// src/components/Sidebar.jsx
import React, { useContext } from "react";
import { NavLink } from "react-router-dom";
import { AppContext } from "../App";
// import "../styles/Sidebar.css"; // REMOVA esta linha

function Sidebar({
  isSidebarOpen,
  toggleSidebar,
  onLogout,
  notificationsCount,
}) {
  const { clients } = useContext(AppContext);

  const handleLinkClick = () => {
    if (window.innerWidth <= 768) {
      // Ajuste para o breakpoint do seu CSS original
      toggleSidebar();
    }
  };

  return (
    <aside className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
      {" "}
      {/* Classe 'open' para abrir */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <img
            src="/logo.jpeg"
            alt="Fideliza Cred"
            className="sidebar-logo-img"
          />
          <div>
            <div className="sidebar-title">
              Fideliza <span className="gold">Cred</span>
            </div>
            <div style={{ fontSize: "0.65rem", color: "var(--text-dim)" }}>
              Gestão Financeira
            </div>
          </div>
        </div>
        {/* Botão de fechar para mobile - use a classe do seu CSS original */}
        <button className="btn-icon close-sidebar-btn" onClick={toggleSidebar}>
          ✕
        </button>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-section-label">Principal</div>
        <NavLink to="/dashboard" className="nav-item" onClick={handleLinkClick}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          Dashboard
        </NavLink>
        <NavLink to="/clientes" className="nav-item" onClick={handleLinkClick}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          Clientes{" "}
          <span className="nav-badge">{clients ? clients.length : 0}</span>{" "}
        </NavLink>

        <div className="nav-section-label">Financeiro</div>
        <NavLink
          to="/financeiro"
          className="nav-item"
          onClick={handleLinkClick}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          Financeiro
        </NavLink>
        <NavLink
          to="/emprestimos"
          className="nav-item"
          onClick={handleLinkClick}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
          </svg>
          Empréstimos{" "}
          {notificationsCount > 0 && (
            <span className="nav-badge">{notificationsCount}</span>
          )}
        </NavLink>
        <NavLink
          to="/cobrancas"
          className="nav-item"
          onClick={handleLinkClick}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 5H2v7l6.29 6.29c.94.94 2.48.94 3.42 0l4.58-4.58c.94-.94.94-2.48 0-3.42L9 5z" />
            <path d="M6 9.01V9" />
          </svg>
          Cobranças
        </NavLink>
        <NavLink
          to="/recebimentos"
          className="nav-item"
          onClick={handleLinkClick}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          Recebimentos
        </NavLink>
        <NavLink to="/vendas" className="nav-item" onClick={handleLinkClick}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          Vendas
        </NavLink>

        <div className="nav-section-label">Operacional</div>
        <NavLink to="/veiculos" className="nav-item" onClick={handleLinkClick}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M5 17h14" />
            <path d="M6 17l-1-5h14l-1 5" />
            <path d="M8 12l1-4h6l1 4" />
            <circle cx="7.5" cy="17" r="1.5" />
            <circle cx="16.5" cy="17" r="1.5" />
          </svg>
          Veículos
        </NavLink>
        <NavLink
          to="/funcionarios"
          className="nav-item"
          onClick={handleLinkClick}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
          Funcionários
        </NavLink>

        <div className="nav-section-label">Análises</div>
        <NavLink
          to="/relatorios"
          className="nav-item"
          onClick={handleLinkClick}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 20V10" />
            <path d="M12 20V4" />
            <path d="M6 20v-6" />
          </svg>
          Relatórios
        </NavLink>
        <NavLink to="/agenda" className="nav-item" onClick={handleLinkClick}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          Agenda
        </NavLink>
        <NavLink
          to="/configuracoes"
          className="nav-item"
          onClick={handleLinkClick}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          Configurações
        </NavLink>
      </nav>
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">AD</div>
          <div className="user-details">
            <span className="user-name">Admin</span>
            <span className="user-role">Administrador</span>
          </div>
        </div>
        <button
          id="logout-btn"
          className="logout-btn"
          title="Sair"
          onClick={onLogout}
        >
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
    </aside>
  );
}

export default Sidebar;
