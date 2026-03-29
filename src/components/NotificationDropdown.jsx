// src/components/NotificationDropdown.jsx
import React, { useEffect, useRef } from "react";

function NotificationDropdown({
  notifications,
  onClearNotifications,
  onClose,
}) {
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  return (
    <div id="notif-dropdown" className="notif-dropdown" ref={dropdownRef}>
      <div className="notif-header">
        <h4>Notificações</h4>
        <button className="btn-link" onClick={onClearNotifications}>
          Limpar
        </button>
      </div>
      <div id="notif-list" className="notif-list">
        {notifications.length === 0 ? (
          <div
            style={{
              padding: "20px",
              textAlign: "center",
              color: "var(--text-dim)",
              fontSize: "0.8rem",
            }}
          >
            Nenhuma notificação
          </div>
        ) : (
          notifications.map((n) => (
            <div className="notif-item" key={n.id}>
              <div className={`notif-dot ${n.type || "blue"}`}></div>
              <div className="notif-text">
                <div className="tx-desc">{n.text}</div>
                <span className="notif-time">{n.time || ""}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default NotificationDropdown;
