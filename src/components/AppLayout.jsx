// src/components/AppLayout.jsx
import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../App";
// import "../styles/AppLayout.css"; // REMOVA esta linha

// Componentes da Sidebar e TopBar
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import MobileHeader from "./MobileHeader";

function AppLayout({ children }) {
  const { setIsAuthenticated, setAuthToken, notifications, setNotifications, userRole } =
    useContext(AppContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    setAuthToken("");
    localStorage.removeItem("fc_token");
    setIsAuthenticated(false);
    navigate("/login");
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  return (
    <div id="app" className={`app ${isSidebarOpen ? "sidebar-open" : ""}`}>
      {" "}
      {/* Adiciona classe sidebar-open */}
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        onLogout={handleLogout}
        notificationsCount={notifications.length}
        userRole={userRole}
      />
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={toggleSidebar}></div>
      )}
      <MobileHeader
        toggleSidebar={toggleSidebar}
        notifications={notifications}
        onClearNotifications={handleClearNotifications}
      />
      <TopBar
        notifications={notifications} // Mantém notifications para TopBar
        onClearNotifications={handleClearNotifications}
      />
      <main className="main-content">{children}</main>
    </div>
  );
}

export default AppLayout;
