import React from "react";
import { Navbar, Nav, Container, Button } from "react-bootstrap";
import { FaUserCircle } from "react-icons/fa";
import "./index.css";

const Header = () => {
  return (
    <Navbar expand="lg" bg="dark" variant="dark" className="shadow p-2 navcontainer">
      <Container>
        <Navbar.Brand href="/" className="brand">EveOsmania</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto navelements">
            <Nav.Link href="/" className="navelements">Home</Nav.Link>
            <Nav.Link href="/dashboard" className="navelements">User Dashboard</Nav.Link>
            <Nav.Link href="/about" className="navelements">About</Nav.Link>
            <div className="nav-actions">
              <Button href="/login" className="login-button">Login</Button>
              <FaUserCircle className="user-icon" />
            </div>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;
