import React, { useState } from "react";
import "./index.css";
import { FaThumbsUp } from "react-icons/fa";

const EventCard = ({ image, name, description }) => {
  const [likes, setLikes] = useState(0);

  return (
    <div className="event-card">
      <div className="event-image-container">
        <img src={image} alt={name} className="event-image" />
      </div>
      <h3 className="event-name">{name}</h3>
      <p className="event-description">{description}</p>
      <div className="event-actions">
        <button className="like-button" onClick={() => setLikes(likes + 1)}>
          <FaThumbsUp /> {likes}
        </button>
        <button className="know-more-button">Know More</button>
      </div>
    </div>
  );
};

export default EventCard;
