// src/components/TopBar.jsx
import React, { useContext, useState } from "react";
import { AppContext, ThemeContext } from "../App";

function TopBar() {
  const { notifications } = useContext(AppContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadNotifications = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
  };

  const handleLogout = () => {
    localStorage.removeItem("fc_token");
    window.location.href = "/login"; // Redireciona para a página de login
  };

  const today = new Date();
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const formattedDate = today.toLocaleDateString("pt-BR", options);

  return (
    <header className="top-bar">
      <div className="date-display">{formattedDate}</div>
      <div className="top-bar-right">
        {/* Toggle de Tema */}
        <label className="toggle" style={{ marginRight: "10px" }}>
          <input
            type="checkbox"
            checked={theme === "dark"}
            onChange={toggleTheme}
          />
          <span className="toggle-slider"></span>
        </label>

        <div className="notification-wrap">
          <button
            className="notification-bell"
            onClick={handleNotificationClick}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadNotifications > 0 && (
              <span className="notif-count">{unreadNotifications}</span>
            )}
          </button>
          {showNotifications && (
            <div className="notif-dropdown">
              <div className="notif-header">
                <h4>Notificações ({unreadNotifications})</h4>
                <button className="btn-link">Marcar todas como lidas</button>
              </div>
              <div className="notif-list">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div key={notif.id} className="notif-item">
                      {notif.message}
                      <span className="notif-time">Há 5 minutos</span>
                    </div>
                  ))
                ) : (
                  <p
                    style={{
                      padding: "10px 16px",
                      fontSize: "0.76rem",
                      color: "var(--text-dim)",
                    }}
                  >
                    Nenhuma notificação.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="user-profile">
          <span>Admin</span>
          <button className="logout-btn" title="Sair" onClick={handleLogout}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}

export default TopBar;
