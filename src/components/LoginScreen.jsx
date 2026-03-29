// src/components/LoginScreen.jsx
import React, { useState, useContext } from "react";
import { AppContext } from "../App";
import { useNavigate } from "react-router-dom";
// import '../styles/LoginScreen.css'; // REMOVA esta linha

function LoginScreen() {
  const { setIsAuthenticated, setAuthToken, loadDemoData } =
    useContext(AppContext);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");

    if (username === "admin" && password === "admin") {
      setAuthToken("fake-jwt-token");
      localStorage.setItem("fc_token", "fake-jwt-token");
      setIsAuthenticated(true);
      navigate("/dashboard");
    } else if (username === "offline" && password === "offline") {
      setAuthToken("offline");
      localStorage.setItem("fc_token", "offline");
      setIsAuthenticated(true);
      loadDemoData();
      navigate("/dashboard");
    } else {
      setError("Usuário ou senha inválidos.");
    }
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
            src="/logo.jpeg" // Caminho para sua logo na pasta public
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
            <label htmlFor="login-user">Usuário</label>
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
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="login-pass">Senha</label>
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
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
          <button type="submit" className="btn btn-gold btn-full">
            Entrar
          </button>
        </form>
      </div>
    </section>
  );
}

export default LoginScreen;
