import cors from 'cors';
import express from "express";
import mongoose from "mongoose";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { GridFSBucket } from 'mongodb';
import { ObjectId } from 'mongodb';

import User from "./models/users.js";
import Event from "./models/events.js";
import Registration from './models/registrations.js';

import multer from 'multer';
import fs from 'fs';
const storage = multer.memoryStorage();
const upload = multer({ storage });



const app = express();
app.use(cors({
    origin: ['http://localhost:3000','https://eveosmania.vercel.app'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true 
}));
app.use(express.json());

const mongoose_url = "mongodb://localhost:27017/majorproject";

const JWT_SECRET = "your_jwt_secret"; // Keep it secure

// Initialize GridFS bucket
let gfsBucket;

const initializeDb = async () => {
  try {
    await mongoose.connect(mongoose_url);
    console.log("MongoDB connected");
    
    // Initialize GridFS bucket after connection
    const conn = mongoose.connection;
    gfsBucket = new GridFSBucket(conn.db, {
      bucketName: 'posters'
    });
  } catch (e) {
    console.log(e);
  }
};

initializeDb();






app.get('/api/poster/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid file ID" });
    }
    
    const fileId = new ObjectId(req.params.id);
    const files = await mongoose.connection.db.collection('posters.files').find({ _id: fileId }).toArray();
    
    if (!files || files.length === 0) {
      return res.status(404).json({ message: "File not found" });
    }
    
    const readStream = gfsBucket.openDownloadStream(fileId);
    res.set('Content-Type', files[0].contentType);
    readStream.pipe(res);
    
    readStream.on('error', (err) => {
      res.status(500).json({ message: "Error streaming file" });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to retrieve poster" });
  }
});
// -------------------- Middleware to Authenticate User Role --------------------
const authenticateRole = (allowedRoles) => (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (!allowedRoles.includes(decoded.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// -------------------- Login Route --------------------
// -------------------- Login Route --------------------
app.post('/login', async (req, res) => {
  const { email, password, role } = req.body;

  console.log("Request Body:", req.body);

  try {
    const user = await User.findOne({ email });
    console.log("Found User:", user);

    if (!user) {
      console.log("No user found with this email");
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log("Password Match:", isPasswordValid);

    if (!isPasswordValid) {
      console.log("Password mismatch");
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (role && user.role !== role) {
      console.log(`Role mismatch: Expected ${role}, Found ${user.role}`);
      return res.status(401).json({ message: 'Role mismatch' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Send the token, role, and userId in the response
    res.status(200).json({ token, role: user.role, userId: user._id });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
});




// -------------------- Protected Routes --------------------
app.get('/admin-data', authenticateRole(['admin']), async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching data' });
  }
});



app.get('/api/events/grouped', async (req, res) => {
  try {
    const events = await Event.aggregate([
      {
        $group: {
          _id: '$department',
          events: { $push: '$$ROOT' }
        }
      }
    ]);
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.get('/events', async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});
//home page apis
//home page api for clubs based view

app.get('/events-by-club', async (req, res) => {
  try {
    const eventsByClub = await Event.aggregate([
      {
        $group: {
          _id: '$club',             // Grouping by club instead of department
          events: { $push: '$$ROOT' }
        }
      },
      {
        $sort: { _id: 1 }           // Optional: sorts clubs alphabetically
      }
    ]);
    
    res.status(200).json(eventsByClub);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//likes api
app.post('/events/:id/like', async (req, res) => {
  const { userId } = req.body;
  const eventId = req.params.id;

  try {
    const event = await Event.findById(eventId);

    if (!event.likes.includes(userId)) {
      event.likes.push(userId);
      await event.save();
      res.status(200).json({ message: "Liked!" });
    } else {
      res.status(400).json({ message: "Already liked." });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.get('/events/:categoryId', async (req, res) => {
  const { categoryId } = req.params;

  try {
    const events = await Event.find({ department: categoryId });
    
    if (!events || events.length === 0) {
      return res.status(404).json({ message: 'No events found for this category' });
    }

    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching events by category:', error);
    res.status(500).json({ message: 'Failed to fetch events by category' });
  }
});


app.get('/manager-data', authenticateRole(['manager']), async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching data' });
  }
});

app.get('/volunteer-data', authenticateRole(['volunteer']), async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching data' });
  }
});

// -------------------- Signup Route --------------------
app.post('/signup', async (req, res) => {
  try {
    const { name, username, email, password, phone, role, occupation, department, studentDetails } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      username,
      email,
      password: hashedPassword,
      phone,
      role,
      occupation,
      department,
      studentDetails: occupation === 'student' ? studentDetails : undefined
    });

    await newUser.save();

    res.status(201).json({ message: 'User registered successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to register user' });
  }
});



// -------------------- Create Event --------------------
app.post('/events', authenticateRole(['admin']), async (req, res) => {
  try {
    const event = new Event(req.body);
    await event.save();
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create event' });
  }
});

// -------------------- Update Event --------------------
app.put('/events/:id', authenticateRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const updatedEvent = await Event.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json(updatedEvent);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update event' });
  }
});

// -------------------- Delete Event --------------------
app.delete('/events/:id', authenticateRole(['admin']), async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete event' });
  }
});

// -------------------- Assign Manager Role --------------------
app.post('/users/:id/assign-role', authenticateRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(id, { role: 'manager' }, { new: true });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to assign role' });
  }
});

// -------------------- Remove Manager Role --------------------
app.post('/users/:id/remove-role', authenticateRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(id, { role: 'user' }, { new: true });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove role' });
  }
});

// -------------------- Get Manager Requests --------------------
app.get('/manager-requests', authenticateRole(['admin']), async (req, res) => {
  try {
    const requests = await User.find({ roleRequest: 'manager' });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch requests' });
  }
});

// -------------------- Approve Manager Request --------------------
app.post('/manager-requests/:id/approve', authenticateRole(['admin']), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { role: 'manager', roleRequest: null });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to approve request' });
  }
});

// -------------------- Reject Manager Request --------------------
app.post('/manager-requests/:id/reject', authenticateRole(['admin']), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { roleRequest: null });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to reject request' });
  }
});

// -------------------- Get All Users --------------------
app.get('/users', authenticateRole(['admin']), async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// -------------------- Delete User --------------------
app.delete('/users/:id', authenticateRole(['admin']), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete user' });
  }
});





app.put('/users/:id/updateRole', authenticateRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body; // New role to be assigned

    if (!role) {
      return res.status(400).json({ message: 'Role is required' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User role updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Failed to update user role' });
  }
});


app.get('/volunteers', authenticateRole(['admin']), async (req, res) => {
  try {
      const volunteers = await User.find({ role: 'volunteer' }).select('-password');
      res.status(200).json(volunteers);
  } catch (error) {
      console.error('Error fetching volunteers:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/api/events", async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: "Error fetching events" });
  }
});
//--------events fetched used in eventdetails and event edit
// Delete event by ID
app.delete("/api/events/:id", async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting event" });
  }
});

app.put('/api/events/:id', upload.single('poster'), async (req, res) => {
  const { id } = req.params;
  const {
    name,
    description,
    date,
    startTime,
    endTime,
    venue,
    club,
    department,
    status,
    managers,
    volunteers,
  } = req.body;

  const updateData = {
    name,
    description,
    date,
    startTime,
    endTime,
    venue,
    club,
    department,
    status,
  };

  try {
    updateData.managers = managers ? JSON.parse(managers) : [];
    updateData.volunteers = volunteers ? JSON.parse(volunteers) : [];
  } catch (err) {
    console.error('JSON parse error:', err);
    return res.status(400).json({ message: 'Invalid JSON in managers/volunteers' });
  }

  if (req.file) {
    updateData.poster = req.file.buffer.toString('base64');
    updateData.posterContentType = req.file.mimetype;
  }

  try {
    const updated = await Event.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) return res.status(404).json({ message: 'Event not found' });
    res.status(200).json(updated);
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



app.get("/api/events/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('managers', 'name')
      .populate('volunteers', 'name')
      .populate('registeredUserIds', 'name');

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    console.log(event);  // Log the event to see the populated managers
    res.json(event);
  } catch (err) {
    console.error("Error fetching event:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

//----------------------

app.get('/api/users/managers', async (req, res) => {
  try {
      const { search } = req.query;
      const managers = await User.find({
          role: 'manager',
          $or: [
              { name: { $regex: search, $options: 'i' } },
              { email: { $regex: search, $options: 'i' } }
          ]
      });
      res.json(managers);
  } catch (err) {
      res.status(500).json({ error: 'Failed to search managers' });
  }
});
app.get('/api/users/volunteers', async (req, res) => {
  try {
      const { search } = req.query;
      const volunteers = await User.find({
          role: 'volunteer',
          $or: [
              { name: { $regex: search, $options: 'i' } },
              { email: { $regex: search, $options: 'i' } }
          ]
      });
      res.json(volunteers);
  } catch (err) {
      res.status(500).json({ error: 'Failed to search volunteers' });
  }
});


// Verify Token Route
app.get("/auth/verify", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Invalid token" });
    }
    return res.json({ role: decoded.role });
  });
});



// -------------------- Registration Routes --------------------

// Check registration status
app.get("/api/registration/status/:eventId/:userId", async (req, res) => {
  const { eventId, userId } = req.params;

  try {
    const reg = await Registration.findOne({ eventId, userId });

    if (!reg) return res.json({ status: "not-registered" });
    if (reg.approved) return res.json({ status: "approved" });

    return res.json({ status: "registered" });
  } catch (err) {
    console.error("Error checking registration status", err);
    res.status(500).json({ msg: "Internal server error" });
  }
});

// Register with screenshot (base64)
app.post("/api/registration/register", async (req, res) => {
  try {
    const { eventId, userId, screenshot, contentType } = req.body;

    if (!screenshot || !contentType) {
      return res.status(400).json({ msg: "Screenshot and contentType are required" });
    }

    const already = await Registration.findOne({ eventId, userId });
    if (already) return res.status(400).json({ msg: "Already registered" });

    const registration = new Registration({
      eventId,
      userId,
      screenshot,       // storing base64 image directly
      contentType,      // storing content type (like image/png)
      approved: false
    });

    await registration.save();

    res.json({ msg: "Registered successfully" });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ msg: "Internal server error" });
  }
});

// (Optional) Approve a registration
app.put("/api/registration/approve/:id", authenticateRole(['admin', 'manager']), async (req, res) => {
  try {
    const registration = await Registration.findByIdAndUpdate(
      req.params.id,
      { approved: true },
      { new: true }
    );

    if (!registration) {
      return res.status(404).json({ msg: "Registration not found" });
    }

    res.json({ msg: "Registration approved", registration });
  } catch (err) {
    console.error("Approval error:", err);
    res.status(500).json({ msg: "Internal server error" });
  }
});

//-----------------------editevent apis

//------------------------registration approval apis

// Fetch all registrations for a specific event
app.get('/api/registrations/:eventId', async (req, res) => {
  try {
    const registrations = await Registration.find({ eventId: req.params.eventId })
      .populate('userId', 'name email')  // Populate user info like name and email
      .exec();
    res.json(registrations);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch registrations" });
  }
});

// Update the approval status of a registration
app.put('/api/registration/approve/:registrationId', async (req, res) => {
  try {
    const registration = await Registration.findByIdAndUpdate(
      req.params.registrationId,
      { approved: true },
      { new: true }
    );
    res.json(registration);
  } catch (err) {
    res.status(500).json({ message: "Failed to approve registration" });
  }
});

app.delete('/api/registration/:registrationId', async (req, res) => {
  try {
    const registration = await Registration.findByIdAndDelete(req.params.registrationId);
    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }
    res.json({ message: "Registration removed successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to remove registration" });
  }
});

//-----------user dashboard apis
app.get('/api/registered-events/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    // Fetch first 5 registrations for the user
    const registrations = await Registration.find({ userId })
      .populate('eventId', 'name status')  // Populate event details (name, status)
      .limit(5);

    const events = registrations.map(reg => ({
      name: reg.eventId.name,
      status: reg.approved ? 'Approved' : 'Not Approved',
      eventId: reg.eventId._id
    }));

    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching registered events:', error);
    res.status(500).json({ error: 'Failed to fetch registered events' });
  }
});

// GET endpoint to fetch all registered events for a user
app.get('/api/all-registered-events/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    // Fetch all registrations for the user
    const registrations = await Registration.find({ userId })
      .populate('eventId', 'name status')  // Populate event details (name, status)
      .exec();

    const events = registrations.map(reg => ({
      name: reg.eventId.name,
      status: reg.approved ? 'Approved' : 'Not Approved',
      eventId: reg.eventId._id
    }));

    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching all registered events:', error);
    res.status(500).json({ error: 'Failed to fetch all registered events' });
  }
});

//--------------create event

// ✅ API to create event
const handleSubmit = async () => {
  try {
    const eventData = {
      name,
      description,
      date,
      startTime,
      endTime,
      venue,
      club,
      department,
      status,
      posterBase64,
      posterContentType,
      managers,
      volunteers
    };

    console.log("Sending event:", eventData); // ✅ Log to confirm what's sent

    const response = await axios.post('http://localhost:3001/api/events', eventData);
    alert("Event created successfully");
  } catch (error) {
    console.error("Error creating event:", error);
    alert("Error creating event");
  }
};



app.listen(3001, () => {
  console.log("Running at 3001");
});
