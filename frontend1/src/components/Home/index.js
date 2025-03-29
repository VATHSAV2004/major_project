import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SliderComponent from '../Carosel';
import "./index.css";

const Home = () => {
  const [eventsByCategory, setEventsByCategory] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('http://localhost:3001/events-by-category');
        const data = await response.json();
        setEventsByCategory(data);
      } catch (error) {
        console.error("Failed to fetch events:", error);
      }
    };

    fetchEvents();
  }, []);

  return (
    <>
      <div className="mainback">
        {eventsByCategory.map((category) => (
          <div key={category._id}>
            <h3 className="departmentname">{category._id} Events</h3>
            {/* Display only 7 events */}
            <SliderComponent events={category.events.slice(0, 7)} />
            {/* Always show "View More" button if events exist */}
            {category.events?.length && (
              <Link to={`/events/${category._id}`} className="view-more">
                View More
              </Link>
            )}
          </div>
        ))}
      </div>
    </>
  );
};

export default Home;
