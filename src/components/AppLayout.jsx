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
  const { setIsAuthenticated, setAuthToken, notifications, setNotifications, userRole, loans, clients } =
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

  // Count pending loan requisitions for admin/supervisor
  const pendingRequisitionsCount = (userRole === "admin" || userRole === "supervisor") 
    ? (loans || []).filter(l => l.status === "pending").length 
    : 0;

  // Count pending clients for admin/supervisor
  const pendingClientsCount = (userRole === "admin" || userRole === "supervisor")
    ? (clients || []).filter(c => c.approval_status === "pending").length
    : 0;

  return (
    <div id="app" className={`app ${isSidebarOpen ? "sidebar-open" : ""}`}>
      {" "}
      {/* Adiciona classe sidebar-open */}
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        onLogout={handleLogout}
        notificationsCount={notifications.length}
        pendingRequisitionsCount={pendingRequisitionsCount}
        pendingClientsCount={pendingClientsCount}
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
