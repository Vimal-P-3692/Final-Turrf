// Importing the react components
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

// Importing the styles
import "../styles/Hedder.css";

// Importing the assets
import Login from "../assets/loginicon.svg";
import logo from "../assets/logo.png";

function Hedder() {
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const location = useLocation();
  const [username] = useState(() => {
    return location.state?.username || "Admin";
  });

  const toggleDropdown = () => {
    setDropdownVisible((prev) => !prev);
    
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setDropdownVisible(false);
    navigate("/login");
  };

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
      <img src={logo} alt="Logo" className="logo" />

      <div className="profile-section" ref={dropdownRef}>
        <div className="avatar-circle large" onClick={toggleDropdown}>
          {username?.charAt(0).toUpperCase()}
        </div>
        {dropdownVisible && (
          <div className="dropdown-menu">
            <div className="dropdown-header">
              <div className="avatar-circle">{username.charAt(0)}</div>
              <div className="username">{username}</div>
            </div>
            <hr className="divider" />
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
