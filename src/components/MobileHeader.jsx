// src/components/MobileHeader.jsx
import React, { useContext } from "react";
import { AppContext } from "../App";
// import '../styles/MobileHeader.css'; // REMOVA esta linha

function MobileHeader({ toggleSidebar }) {
  const { notifications } = useContext(AppContext);
  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="mobile-header">
      <button className="menu-toggle" onClick={toggleSidebar}>
        {" "}
        {/* Use a classe do seu CSS original */}
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      <span className="mobile-title">
        Fideliza <span className="gold">Cred</span>
      </span>
      <div className="notification-wrap">
        <button id="mobile-notif-btn" className="notification-bell">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {unreadNotificationsCount > 0 && (
            <span className="notif-count">{unreadNotificationsCount}</span>
          )}
        </button>
        {/* Lógica para dropdown de notificações mobile, se necessário */}
      </div>
    </header>
  );
}

export default MobileHeader;
