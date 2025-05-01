import React from 'react';
import './index.css';
import { useNavigate } from 'react-router-dom';
import ManagerList from '../ManagerList';
// import EventList from '../EventList'; // 🔥 Remove unused import
import AdminList from '../AdminList';
import UpdateUserToManager from '../UpdateUserToManager';
import VolunteerList from '../VolunteerList';
import UpdateUserToVolunteer from '../UpdateUserToVolunteer';
import EventsList from '../EventsList';

const Dashboard = () => {
  const userRole = "admin"; // or "manager" based on logged-in user
  const navigate = useNavigate(); // 👈 required for navigation

  const handleAddEvent = () => {
    navigate('/add-event'); // 👈 match your route for AddEvent component
  };

  return (
    <div className="dashboard">
      <h2>Admin Dashboard</h2>
      
      <ManagerList />
      <UpdateUserToManager />
      <VolunteerList />
      <UpdateUserToVolunteer />
      <EventsList userRole={userRole} />
      
      <button onClick={handleAddEvent} className="add-event-btn">+ Add Event</button>

      <AdminList />
    </div>
  );
};

export default Dashboard;
