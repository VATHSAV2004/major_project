import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./index.css";

// Modal component for showing the image
const PaymentImageModal = ({ image, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <img
          src={`data:${image.contentType};base64,${image.screenshot}`}
          alt="Payment Screenshot"
        />
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

const Approval = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/api/events/${eventId}`);
        setEvent(response.data);
      } catch (err) {
        console.error("Failed to fetch event details:", err);
      }
    };

    const fetchRegistrations = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/api/registrations/${eventId}`);
        setRegistrations(response.data);
      } catch (err) {
        console.error("Failed to fetch registrations:", err);
      }
    };

    fetchEventDetails();
    fetchRegistrations();
  }, [eventId]);

  const handleApprove = async (registrationId) => {
    try {
      const token = localStorage.getItem("token");  // 🔥 updated here

      if (!token) {
        alert("You need to log in first.");
        return;
      }

      await axios.put(
        `http://localhost:3001/api/registration/approve/${registrationId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,  // 🔥 use the correct token
          },
        }
      );

      setRegistrations(
        registrations.map((registration) =>
          registration._id === registrationId
            ? { ...registration, approved: true }
            : registration
        )
      );
    } catch (err) {
      console.error("Failed to approve registration:", err);
    }
  };

  const handleRemove = async (registrationId) => {
    if (window.confirm("Are you sure you want to remove this registration?")) {
      try {
        const token = localStorage.getItem("token"); // 🔥 updated here also

        if (!token) {
          alert("You need to log in first.");
          return;
        }

        await axios.delete(
          `http://localhost:3001/api/registration/${registrationId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,  // 🔥 correct token
            },
          }
        );

        setRegistrations(
          registrations.filter((registration) => registration._id !== registrationId)
        );
      } catch (err) {
        console.error("Failed to remove registration:", err);
      }
    }
  };

  const handleShowImage = (registration) => {
    setSelectedImage(registration);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedImage(null);
  };

  if (!event) {
    return <div>Loading...</div>;
  }

  return (
    <div className="approval-page">
      <h2>Event Approval</h2>
      <h3>{event.name}</h3>
      <p>
        <strong>Date:</strong> {new Date(event.date).toLocaleDateString("en-GB")}
      </p>
      <p>
        <strong>Time:</strong> {event.startTime} - {event.endTime}
      </p>
      <p>
        <strong>Location:</strong> {event.venue}
      </p>
      <p>
        <strong>Description:</strong> {event.description}
      </p>

      <h4>Registrations:</h4>
      {registrations.length === 0 ? (
        <p>No registrations found.</p>
      ) : (
        <div className="registrations-list">
          {registrations.map((registration) => (
            <div key={registration._id} className="registration-item">
              <p>
                <strong>User:</strong> {registration.userId.name}
              </p>
              <p>
                <strong>Email:</strong> {registration.userId.email}
              </p>
              <button onClick={() => handleShowImage(registration)}>
                Show Payment Image
              </button>
              <button
                onClick={() => handleApprove(registration._id)}
                disabled={registration.approved}
              >
                {registration.approved ? "Approved" : "Approve"}
              </button>
              <button onClick={() => handleRemove(registration._id)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && selectedImage && (
        <PaymentImageModal image={selectedImage} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default Approval;
