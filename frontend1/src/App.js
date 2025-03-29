import './App.css';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import AdminDashboard from './components/AdminDashboard';
import ManagerDashboard from './components/ManagerDashboard';
import VolunteerDashboard from './components/VolunteerDashboard';
import Home from './components/Home';
import CategoryPage from "./components/CategoryPage";
import AllManagers from './components/AllManagers';
import Header from './components/Header';

import Footer from './components/Footer'; 
import EditEvent from './components/EditEvent';

const ProtectedRoute = ({ element, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');

  if (!token || !allowedRoles.includes(userRole)) {
    return <Navigate to="/login" />;
  }

  return element;
};

function App() {
  return (
    <BrowserRouter>
    <Header/>
      <Routes>
        
      <Route path="/" element={<Home />} />

        <Route path="/login" element={<LoginPage />} />
        <Route 
          path="/admin-dashboard" 
          element={<ProtectedRoute element={<AdminDashboard />} allowedRoles={['admin']} />} 
        />
        <Route 
          path="/manager-dashboard" 
          element={<ProtectedRoute element={<ManagerDashboard />} allowedRoles={['manager']} />} 
        />
                <Route path="/all-managers" element={<AllManagers />} />

        <Route 
          path="/volunteer-dashboard" 
          element={<ProtectedRoute element={<VolunteerDashboard />} allowedRoles={['volunteer']} />} 
        />
        <Route path="/events/:categoryId" element={<CategoryPage />} />

        <Route path="/edit-event/:id" element={<EditEvent />} />

        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
      <Footer /> 
    </BrowserRouter>
  );
}

export default App;
