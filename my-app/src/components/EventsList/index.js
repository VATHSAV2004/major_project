import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaTrash } from "react-icons/fa";
import axios from "axios";
import "./index.css";

const EventsList = ({ userRole }) => {
  const [events, setEvents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get("http://localhost:3001/api/events");
        setEvents(response.data);
      } catch (err) {
        console.error("Failed to fetch events:", err);
      }
    };
    fetchEvents();
  }, []);

  const handleDelete = async (eventId) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await axios.delete(`http://localhost:3001/api/events/${eventId}`);
        setEvents(events.filter((event) => event._id !== eventId));
      } catch (err) {
        console.error("Failed to delete event:", err);
      }
    }
  };

  const handleEdit = (event) => {
    navigate(`/edit-event/${event._id}`, { state: { event } });
  };

  return (
    <div className="events-wrapper">
      <h2 className="events-heading">Events</h2>
      <div className="events-container">
        {events.slice(0, 4).map((event) => (
          <div key={event._id} className="event-card">
            <div className="event-content">
              <h3 className="event-title">{event.name || "Untitled Event"}</h3>
              <p className="event-detail">
                <strong>Date:</strong>{" "}
                {event.date
                  ? new Date(event.date).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "TBA"}
              </p>
              <p className="event-detail">
                <strong>Time:</strong>{" "}
                {event.startTime && event.endTime
                  ? `${event.startTime} - ${event.endTime}`
                  : "TBA"}
              </p>
              <p className="event-detail">
                <strong>Location:</strong> {event.venue || "TBA"}
              </p>
            </div>

            {(userRole === "admin" || userRole === "manager") && (
              <div className="event-actions">
                <FaEdit
                  className="edit-icon"
                  onClick={() => handleEdit(event)}
                />
                <FaTrash
                  className="delete-icon"
                  onClick={() => handleDelete(event._id)}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      <button className="see-more" onClick={() => navigate("/events")}>
        See More
      </button>
    </div>
  );
};

export default EventsList;
