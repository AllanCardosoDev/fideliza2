// src/pages/NotFound.jsx
import React from "react";
import { Link } from "react-router-dom";
// import '../styles/NotFound.css'; // REMOVA esta linha

function NotFound() {
  return (
    <div
      className="page active"
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
        textAlign: "center",
        padding: "40px",
      }}
    >
      <h2
        style={{ fontSize: "3em", color: "var(--gold)", marginBottom: "20px" }}
      >
        404
      </h2>
      <p
        style={{
          fontSize: "1.2em",
          color: "var(--text-dim)",
          marginBottom: "30px",
        }}
      >
        Página não encontrada.
      </p>
      <Link to="/dashboard" className="btn btn-gold">
        Voltar para o Dashboard
      </Link>
    </div>
  );
}

export default NotFound;
