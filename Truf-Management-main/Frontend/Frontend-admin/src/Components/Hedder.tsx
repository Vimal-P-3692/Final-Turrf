import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

import "../styles/Hedder.css";
import Login from "../assets/loginicon.svg";
import logo from "../assets/logo.png";

function Hedder() {
  const navigate = useNavigate(); // Navigation hook
  const dropdownRef = useRef<HTMLDivElement>(null); // Ref to detect outside clicks on dropdown

  // State for dropdown visibility and edit mode
  const [dropdownVisible, setDropdownVisible] = useState(false);


  const location = useLocation();

  // Get the username from location state, fallback to default
  const [username] = useState(() => {
    return location.state?.username || "Admin";
  });

  

  // Toggle the dropdown and reset edit mode
  const toggleDropdown = () => {
    setDropdownVisible((prev) => !prev);
    
  };

 
  // Log out and navigate to login page
  const handleLogout = () => {
   
    setDropdownVisible(false);
    navigate("/login");
  };

  // Close dropdown if user clicks outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownVisible(false);
        
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="nav">
      {/* Logo on the left side of header */}
      <img src={logo} alt="Logo" className="logo" />

      {/* Profile section on the right */}
      <div className="profile-section" ref={dropdownRef}>
        {/* Profile avatar circle */}
        <div className="avatar-circle large" onClick={toggleDropdown}>
          {username?.charAt(0).toUpperCase()}
        </div>

        {/* Dropdown menu when visible */}
        {dropdownVisible && (
          <div className="dropdown-menu">
            {/* Top section with avatar and name */}
            <div className="dropdown-header">
              <div className="avatar-circle">{username.charAt(0)}</div>
              <div className="username">{username}</div>

             
            </div>

            <hr className="divider" />

            {/* Logout option */}
            <div className="logout-btn" onClick={handleLogout}>
              <img src={Login} alt="Logout" className="logout-icon" />
              Log out
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Hedder;
