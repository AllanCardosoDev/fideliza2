// src/components/LoginScreen.jsx
import React, { useState, useContext } from "react";
import { AppContext } from "../App";
import { useNavigate } from "react-router-dom";
import { getEmployees } from "../services/api";

function LoginScreen() {
  const { setIsAuthenticated, setAuthToken, setCurrentUser } =
    useContext(AppContext);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    // Hardcoded admin fallback
    if (username === "admin" && password === "admin") {
      setAuthToken("fake-jwt-token");
      localStorage.setItem("fc_token", "fake-jwt-token");
      setCurrentUser({ name: "Administrador", access_level: "admin" });
      localStorage.setItem("fc_current_user", JSON.stringify({ name: "Administrador", access_level: "admin" }));
      setIsAuthenticated(true);
      navigate("/dashboard");
      return;
    }

    if (username === "offline" && password === "offline") {
      setAuthToken("offline");
      localStorage.setItem("fc_token", "offline");
      setCurrentUser({ name: "Demo", access_level: "admin" });
      localStorage.setItem("fc_current_user", JSON.stringify({ name: "Demo", access_level: "admin" }));
      setIsAuthenticated(true);
      navigate("/dashboard");
      return;
    }

    // Try DB authentication
    setLoading(true);
    try {
      const res = await getEmployees();
      const employees = res.data || [];
      const found = employees.find(
        (emp) =>
          emp.username === username &&
          emp.password === password &&
          emp.status === "active",
      );
      if (found) {
        setAuthToken("fake-jwt-token");
        localStorage.setItem("fc_token", "fake-jwt-token");
        setCurrentUser(found);
        localStorage.setItem("fc_current_user", JSON.stringify(found));
        setIsAuthenticated(true);
        navigate("/dashboard");
      } else {
        setError("Usuário ou senha inválidos.");
      }
    } catch {
      setError("Usuário ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    background: "#ffffff",
    border: "1.5px solid #d1d5db",
    borderRadius: "8px",
    padding: "10px 12px 10px 38px",
    fontSize: "0.95rem",
    color: "#1a1a2e",
    width: "100%",
    boxSizing: "border-box",
    outline: "none",
    transition: "border-color 0.2s",
  };

  return (
    <section id="login-screen" className="login-screen">
      <div className="login-bg-effects">
        <div className="login-orb login-orb-1"></div>
        <div className="login-orb login-orb-2"></div>
        <div className="login-orb login-orb-3"></div>
      </div>
      <div className="login-card">
        <div className="login-logo">
          <img
            src="/logo.jpeg"
            alt="Fideliza Cred"
            className="login-logo-img"
          />
          <h1>
            Fideliza <span className="gold">Cred</span>
          </h1>
          <p className="login-subtitle">Sistema de Gestão Financeira</p>
        </div>
        <form id="login-form" className="login-form" onSubmit={handleLogin}>
          {error && <p className="error-message">{error}</p>}
          <div className="form-group">
            <label htmlFor="login-user" style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: 6, display: "block" }}>Usuário</label>
            <div className="input-icon-wrap">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M20 21c0-3.3-3.6-6-8-6s-8 2.7-8 6" />
              </svg>
              <input
                id="login-user"
                type="text"
                placeholder="Seu usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="login-pass" style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: 6, display: "block" }}>Senha</label>
            <div className="input-icon-wrap">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                id="login-pass"
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
          </div>
          <button type="submit" className="btn btn-gold btn-full" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </section>
  );
}

export default LoginScreen;
