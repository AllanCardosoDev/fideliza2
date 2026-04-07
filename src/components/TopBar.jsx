// src/components/TopBar.jsx
import React, { useContext, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext, ThemeContext } from "../App";

function TopBar() {
  const { notifications, markNotificationAsRead, clearAllNotifications, userRole, currentUser, clients } = useContext(AppContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

  // Define which clients this employee owns
  const myClientNames = useMemo(() => {
    if (userRole === "admin" || userRole === "supervisor") return null;
    return clients
      .filter((c) => c.created_by === currentUser?.id || c.owner_id === currentUser?.id)
      .map(c => c.name.toLowerCase());
  }, [userRole, clients, currentUser]);

  const isNotifAccessible = (notif) => {
    const text = (notif.message || notif.text || "").toLowerCase();
    const isAdminOnly = text.includes("[admin]") || text.includes("revisão pendente") || text.includes("aguardando análise");
    
    if (userRole === "admin" || userRole === "supervisor") {
      // Admins see everything
      return true;
    } else {
      // Employees don't see Admin-only alerts
      if (isAdminOnly) return false;
      // Employees only see alerts referencing their own clients
      if (!myClientNames || myClientNames.length === 0) return false;
      return myClientNames.some(name => text.includes(name));
    }
  };

  const unreadList = notifications.filter((n) => !n.read && isNotifAccessible(n));
  const unreadCount = unreadList.length;

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
  };

  const handleItemClick = async (notif) => {
    if (notif.id) {
      markNotificationAsRead(notif.id);
    }
    setShowNotifications(false);
    
    const text = (notif.message || notif.text || "").toLowerCase();
    if (notif.link) {
      navigate(notif.link);
    } else if (text.includes("parcela") || text.includes("atrasad") || text.includes("cobrança")) {
      navigate("/cobrancas");
    } else if (text.includes("empréstimo") || text.includes("requisição") || text.includes("crédito")) {
      navigate("/emprestimos");
    } else if (text.includes("cliente")) {
      navigate("/clientes");
    } else if (text.includes("transação")) {
      navigate("/financeiro");
    }
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
            {unreadCount > 0 && (
              <span className="notif-count">{unreadCount}</span>
            )}
          </button>
          {showNotifications && (
            <div className="notif-dropdown">
              <div className="notif-header">
                <h4>Notificações ({unreadCount})</h4>
                <button className="btn-link" onClick={(e) => { e.stopPropagation(); clearAllNotifications(); setShowNotifications(false); }}>Marcar todas como lidas</button>
              </div>
              <div className="notif-list">
                {unreadList.length > 0 ? (
                  unreadList.map((notif) => (
                    <div 
                      key={notif.id} 
                      className="notif-item" 
                      onClick={() => handleItemClick(notif)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className={`notif-dot ${notif.type || "blue"}`}></div>
                      <div className="notif-text">
                        <div className="tx-desc">{(notif.message || notif.text).replace(/\[ADMIN\] /gi, "")}</div>
                        <span className="notif-time">
                          {notif.created_at ? new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Agora'}
                        </span>
                      </div>
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
