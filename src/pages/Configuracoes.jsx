// src/pages/Configuracoes.jsx
import React, { useState, useContext } from "react";
import { AppContext } from "../App";

function Configuracoes() {
  const { settings, saveSettings, addToast } = useContext(AppContext);

  const [profile, setProfile] = useState({
    companyName: settings.companyName || "Fideliza Cred",
    companyCnpj: settings.companyCnpj || "",
    companyEmail: settings.companyEmail || "",
    companyPhone: settings.companyPhone || "",
    companyAddress: settings.companyAddress || "",
  });

  const [rates, setRates] = useState({
    defaultInterestRate: settings.defaultInterestRate ?? 5,
    defaultPenaltyRate: settings.defaultPenaltyRate ?? 2,
    defaultMoraRate: settings.defaultMoraRate ?? 0.033,
  });

  const [system, setSystem] = useState({
    emailNotifications: settings.emailNotifications ?? true,
    autoBackup: settings.autoBackup ?? true,
    weeklyReports: settings.weeklyReports ?? false,
  });

  const handleSaveProfile = (e) => {
    e.preventDefault();
    saveSettings(profile);
    addToast("Perfil da empresa salvo!", "success");
  };

  const handleSaveRates = (e) => {
    e.preventDefault();
    saveSettings(rates);
    addToast("Taxas padrão salvas!", "success");
  };

  const handleSaveSystem = () => {
    saveSettings(system);
    addToast("Configurações do sistema salvas!", "success");
  };

  const handleExportData = () => {
    const data = {
      exportDate: new Date().toISOString(),
      settings,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fideliza-config-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast("Configurações exportadas!", "success");
  };

  return (
    <div className="page active">
      <div className="page-header">
        <div>
          <h2>Configurações</h2>
          <p className="page-desc">Preferências e parâmetros do sistema</p>
        </div>
      </div>

      <div className="settings-grid">
        {/* Company Profile */}
        <div className="card">
          <div className="card-header">
            <h3>Perfil da Empresa</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleSaveProfile}>
              <div className="form-group">
                <label>Nome da Empresa</label>
                <input
                  value={profile.companyName}
                  onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                  placeholder="Nome da empresa"
                />
              </div>
              <div className="form-group">
                <label>CNPJ / CPF</label>
                <input
                  value={profile.companyCnpj}
                  onChange={(e) => setProfile({ ...profile, companyCnpj: e.target.value })}
                  placeholder="00.000.000/0001-00"
                />
              </div>
              <div className="form-group">
                <label>E-mail</label>
                <input
                  type="email"
                  value={profile.companyEmail}
                  onChange={(e) => setProfile({ ...profile, companyEmail: e.target.value })}
                  placeholder="contato@empresa.com.br"
                />
              </div>
              <div className="form-group">
                <label>Telefone</label>
                <input
                  value={profile.companyPhone}
                  onChange={(e) => setProfile({ ...profile, companyPhone: e.target.value })}
                  placeholder="(00) 0000-0000"
                />
              </div>
              <div className="form-group">
                <label>Endereço</label>
                <input
                  value={profile.companyAddress}
                  onChange={(e) => setProfile({ ...profile, companyAddress: e.target.value })}
                  placeholder="Rua, número, bairro, cidade"
                />
              </div>
              <button type="submit" className="btn btn-gold btn-sm" style={{ marginTop: 12 }}>
                Salvar Perfil
              </button>
            </form>
          </div>
        </div>

        {/* Default Rates */}
        <div className="card">
          <div className="card-header">
            <h3>Taxas Padrão</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleSaveRates}>
              <div className="form-group">
                <label>Taxa de Juros Padrão (% a.m.)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={rates.defaultInterestRate}
                  onChange={(e) => setRates({ ...rates, defaultInterestRate: parseFloat(e.target.value) || 0 })}
                  placeholder="5.00"
                />
                <small style={{ color: "var(--text-dim)", fontSize: "0.75rem" }}>
                  Aplicada automaticamente ao criar novos empréstimos.
                </small>
              </div>
              <div className="form-group">
                <label>Multa por Atraso (% sobre a parcela)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={rates.defaultPenaltyRate}
                  onChange={(e) => setRates({ ...rates, defaultPenaltyRate: parseFloat(e.target.value) || 0 })}
                  placeholder="2.00"
                />
                <small style={{ color: "var(--text-dim)", fontSize: "0.75rem" }}>
                  Cobrada sobre a parcela em atraso (máx. 2% pela legislação).
                </small>
              </div>
              <div className="form-group">
                <label>Juros de Mora (% a.d. sobre a parcela)</label>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={rates.defaultMoraRate}
                  onChange={(e) => setRates({ ...rates, defaultMoraRate: parseFloat(e.target.value) || 0 })}
                  placeholder="0.033"
                />
                <small style={{ color: "var(--text-dim)", fontSize: "0.75rem" }}>
                  Juros por dia de atraso (padrão: 0,033% a.d. = 1% a.m.).
                </small>
              </div>
              <button type="submit" className="btn btn-gold btn-sm" style={{ marginTop: 12 }}>
                Salvar Taxas
              </button>
            </form>
          </div>
        </div>

        {/* System Settings */}
        <div className="card">
          <div className="card-header">
            <h3>Sistema</h3>
          </div>
          <div className="card-body">
            {[
              { key: "emailNotifications", label: "Notificações por e-mail" },
              { key: "autoBackup", label: "Backup automático" },
              { key: "weeklyReports", label: "Relatórios semanais" },
            ].map(({ key, label }) => (
              <div key={key} className="setting-row">
                {label}
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={system[key]}
                    onChange={() => setSystem({ ...system, [key]: !system[key] })}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button className="btn btn-gold btn-sm" onClick={handleSaveSystem}>
                Salvar
              </button>
              <button className="btn btn-outline btn-sm" onClick={handleExportData}>
                📥 Exportar Config
              </button>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="card">
          <div className="card-header">
            <h3>Sobre o Sistema</h3>
          </div>
          <div className="card-body">
            <div className="setting-row" style={{ borderBottom: "1px solid var(--border)", paddingBottom: 8, marginBottom: 8 }}>
              <span style={{ color: "var(--text-dim)" }}>Versão</span>
              <strong>1.0.0</strong>
            </div>
            <div className="setting-row" style={{ borderBottom: "1px solid var(--border)", paddingBottom: 8, marginBottom: 8 }}>
              <span style={{ color: "var(--text-dim)" }}>Sistema</span>
              <strong>Fideliza Cred</strong>
            </div>
            <div className="setting-row">
              <span style={{ color: "var(--text-dim)" }}>Backend</span>
              <strong>Supabase</strong>
            </div>
            <p style={{ marginTop: 16, fontSize: "0.8rem", color: "var(--text-dim)", lineHeight: 1.6 }}>
              Sistema de gestão de empréstimos profissional com controle completo de clientes, parcelas e recebimentos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Configuracoes;
