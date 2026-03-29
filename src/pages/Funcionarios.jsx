// src/pages/Funcionarios.jsx
import React, { useContext } from "react";
import { AppContext } from "../App";
// import '../styles/Funcionarios.css'; // REMOVA esta linha

function Funcionarios() {
  const { employees, openModal, addToast } = useContext(AppContext);

  const handleAddEmployee = () => {
    openModal(
      "Novo Funcionário",
      <div>
        <p style={{ color: "var(--text)" }}>
          Formulário para adicionar funcionário...
        </p>
        <button
          className="btn btn-gold btn-sm"
          onClick={() => {
            addToast("Funcionário adicionado!", "success");
            openModal(false);
          }}
        >
          Salvar
        </button>
      </div>,
    );
  };

  // KPIs de Funcionários
  const totalActiveEmployees = employees.filter(
    (emp) => emp.status === "active",
  ).length;
  const totalPayroll = employees.reduce((sum, emp) => sum + emp.salary, 0);
  const averageSalary =
    employees.length > 0 ? totalPayroll / employees.length : 0;

  return (
    <div className="page active">
      <div className="page-header">
        <div>
          <h2>Funcionários</h2>
          <p className="page-desc">Gestão de equipe</p>
        </div>
        <div className="header-actions">
          <button onClick={handleAddEmployee} className="btn btn-gold btn-sm">
            + Novo Funcionário
          </button>
        </div>
      </div>

      <div className="kpi-grid kpi-grid-3">
        <div className="kpi-card kpi-clients">
          <div className="kpi-icon">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Ativos</span>
            <span className="kpi-value">{totalActiveEmployees}</span>
          </div>
        </div>
        <div className="kpi-card kpi-expense">
          <div className="kpi-icon">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Folha Mensal</span>
            <span className="kpi-value">
              R${" "}
              {totalPayroll.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
        <div className="kpi-card kpi-profit">
          <div className="kpi-icon">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 20V10" />
              <path d="M12 20V4" />
              <path d="M6 20v-6" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Salário Médio</span>
            <span className="kpi-value">
              R${" "}
              {averageSalary.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-toolbar">
          <input
            className="search-input"
            type="text"
            placeholder="🔍  Buscar funcionário..."
          />
          <select className="select-sm">
            <option value="">Todos</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
        </div>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Cargo</th>
                <th>Departamento</th>
                <th>Salário</th>
                <th>Admissão</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.length > 0 ? (
                employees.map((employee) => (
                  <tr key={employee.id}>
                    <td>{employee.name}</td>
                    <td>{employee.role}</td>
                    <td>{employee.department}</td>
                    <td>
                      R${" "}
                      {employee.salary.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td>{employee.admission}</td>
                    <td>
                      <span className={`status ${"status-" + employee.status}`}>
                        {employee.status === "active" ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    style={{
                      textAlign: "center",
                      padding: "20px",
                      color: "var(--text-dim)",
                    }}
                  >
                    Nenhum funcionário cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Funcionarios;
