// src/pages/Configuracoes.jsx
import React, { useState } from "react";
// import { ThemeContext } from '../App'; // Não é mais necessário importar aqui

function Configuracoes() {
  // const { theme, toggleTheme } = useContext(ThemeContext); // Não é mais necessário usar aqui

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoBackup, setAutoBackup] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(false);
  // O estado do darkMode agora é controlado pelo ThemeContext e o toggle está na TopBar

  const handleSaveProfile = () => {
    alert("Perfil salvo!");
  };

  const handleExportData = () => {
    alert("Exportando dados...");
  };

  const handleClearData = () => {
    if (
      window.confirm(
        "Tem certeza que deseja limpar todos os dados? Esta ação é irreversível!",
      )
    ) {
      alert("Dados limpos!");
    }
  };

  return (
    <div className="page active">
      <div className="page-header">
        <div>
          <h2>Configurações</h2>
          <p className="page-desc">Preferências do sistema</p>
        </div>
      </div>
      <div className="settings-grid">
        <div className="card">
          <div className="card-header">
            <h3>Perfil</h3>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label>Nome da Empresa</label>
              <input value="Fideliza Cred" />
            </div>
            <div className="form-group">
              <label>CNPJ</label>
              <input value="12.345.678/0001-99" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input value="contato@fidelizacred.com.br" />
            </div>
            <div className="form-group">
              <label>Telefone</label>
              <input value="(11) 3456-7890" />
            </div>
            <button
              id="btn-save-profile"
              className="btn btn-gold btn-sm"
              style={{ marginTop: "12px" }}
              onClick={handleSaveProfile}
            >
              Salvar Alterações
            </button>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <h3>Sistema</h3>
          </div>
          <div className="card-body">
            <div className="setting-row">
              Notificações por email
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={() => setEmailNotifications(!emailNotifications)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div className="setting-row">
              Backup automático
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={autoBackup}
                  onChange={() => setAutoBackup(!autoBackup)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div className="setting-row">
              Relatórios semanais
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={weeklyReports}
                  onChange={() => setWeeklyReports(!weeklyReports)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            {/* O toggle de modo escuro foi movido para a TopBar */}
            <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
              <button
                id="btn-export-data"
                className="btn btn-outline btn-sm"
                onClick={handleExportData}
              >
                📥 Exportar Dados
              </button>
              <button
                id="btn-clear-data"
                className="btn btn-danger btn-sm"
                onClick={handleClearData}
              >
                🗑 Limpar Dados
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Configuracoes;
