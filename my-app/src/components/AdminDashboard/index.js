import React from 'react';
import './index.css';
import ManagerList from '../ManagerList';
import EventList from '../EventList';
import AdminList from '../AdminList';
import UpdateUserToManager from '../UpdateUserToManager';
import VolunteerList from '../VolunteerList';
import UpdateUserToVolunteer from '../UpdateUserToVolunteer';
import EventsList from '../EventsList';
const Dashboard = () => {
  const userRole = "admin"; // or "manager" based on logged-in user
  return (
    <div className="dashboard">
      <h2>Admin Dashboard</h2>
      <ManagerList />
      <UpdateUserToManager/>
      <VolunteerList/>
      <UpdateUserToVolunteer/>
      <EventsList  userRole={userRole}/>


      <AdminList/>
      
      
      
    </div>
  );
};

export default Dashboard;