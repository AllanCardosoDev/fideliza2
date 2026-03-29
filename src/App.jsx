// src/App.jsx
import React, { useState, useEffect, createContext } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import "./index.css";

// Importar componentes
import LoginScreen from "./components/LoginScreen";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Financeiro from "./pages/Financeiro";
import Emprestimos from "./pages/Emprestimos";
import Vendas from "./pages/Vendas";
import Veiculos from "./pages/Veiculos";
import Funcionarios from "./pages/Funcionarios";
import Relatorios from "./pages/Relatorios";
import Agenda from "./pages/Agenda";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";
import Modal from "./components/Modal";
import ToastContainer from "./components/ToastContainer";

// Importar os serviços da API
import {
  getClients,
  getTransactions,
  getLoans,
  getSales,
  getVehicles,
  getEmployees,
  getNotifications,
} from "./services/api";

export const AppContext = createContext(null);
export const ThemeContext = createContext(null);

// MUDANÇA AQUI: export default function App() {
export default function App() {
  // Adicionamos 'export default' diretamente na declaração da função
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState(
    localStorage.getItem("fc_token") || "",
  );
  const [modal, setModal] = useState({ isOpen: false, title: "", body: null });
  const [toasts, setToasts] = useState([]);

  const [clients, setClients] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loans, setLoans] = useState([]);
  const [sales, setSales] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Lógica do tema
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      return savedTheme;
    }
    // Detecta a preferência do sistema se não houver tema salvo
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  };

  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.body.className = theme === "dark" ? "dark-theme" : "light-theme";
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };
  // Fim da lógica do tema

  const addToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  };

  const openModal = (title, bodyComponent) => {
    setModal({ isOpen: true, title: title, body: bodyComponent });
  };

  const closeModal = () => {
    setModal({ isOpen: false, title: "", body: null });
  };

  // Função para carregar dados da API
  const loadDataFromApi = async () => {
    try {
      const [
        clientsRes,
        transactionsRes,
        loansRes,
        salesRes,
        vehiclesRes,
        employeesRes,
        notificationsRes,
      ] = await Promise.all([
        getClients(),
        getTransactions(),
        getLoans(),
        getSales(),
        getVehicles(),
        getEmployees(),
        getNotifications(),
      ]);

      setClients(clientsRes.data);
      setTransactions(transactionsRes.data);
      setLoans(loansRes.data);
      setSales(salesRes.data);
      setVehicles(vehiclesRes.data);
      setEmployees(employeesRes.data);
      setNotifications(notificationsRes.data);

      addToast("Dados carregados da API!", "success");
    } catch (error) {
      console.error("Erro ao carregar dados da API:", error);
      addToast(
        "Erro ao carregar dados da API. Verifique se o JSON Server está rodando.",
        "error",
      );
      // Opcional: Se a API falhar, você pode carregar dados mockados como fallback
      // setClients([ /* dados mockados */ ]);
      // setTransactions([ /* dados mockados */ ]);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      if (authToken === "offline") {
        setIsAuthenticated(true);
        loadDataFromApi(); // Carrega dados da API se autenticado como "offline"
        return;
      }
      if (!authToken) {
        setIsAuthenticated(false);
        return;
      }
      try {
        // Simulação de verificação de token real
        // Em um backend real, você faria uma requisição para validar o token
        const data = { user: { name: "Admin" } }; // Dados de exemplo
        if (data && data.user) {
          setIsAuthenticated(true);
          loadDataFromApi(); // Carrega dados da API após autenticação bem-sucedida
        } else {
          setAuthToken("");
          localStorage.removeItem("fc_token");
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Erro na verificação de autenticação:", error);
        setAuthToken("");
        localStorage.removeItem("fc_token");
        setIsAuthenticated(false);
        addToast("Erro na autenticação. Tente novamente.", "error");
      }
    };
    checkAuth();
  }, [authToken]);

  const contextValue = {
    isAuthenticated,
    setIsAuthenticated,
    authToken,
    setAuthToken,
    openModal,
    closeModal,
    addToast,
    clients,
    setClients,
    transactions,
    setTransactions,
    loans,
    setLoans,
    sales,
    setSales,
    vehicles,
    setVehicles,
    employees,
    setEmployees,
    notifications,
    setNotifications,
    loadDataFromApi, // Exponha a função para recarregar dados se necessário
  };

  const ProtectedLayout = () => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    return (
      <AppLayout>
        <Outlet />
      </AppLayout>
    );
  };

  return (
    <AppContext.Provider value={contextValue}>
      <ThemeContext.Provider value={{ theme, toggleTheme }}>
        <div id="root-container">
          <Routes>
            <Route
              path="/login"
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <LoginScreen />
                )
              }
            />

            <Route path="/" element={<ProtectedLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="clientes" element={<Clientes />} />
              <Route path="financeiro" element={<Financeiro />} />
              <Route path="emprestimos" element={<Emprestimos />} />
              <Route path="vendas" element={<Vendas />} />
              <Route path="veiculos" element={<Veiculos />} />
              <Route path="funcionarios" element={<Funcionarios />} />
              <Route path="relatorios" element={<Relatorios />} />
              <Route path="agenda" element={<Agenda />} />
              <Route path="configuracoes" element={<Configuracoes />} />
              <Route path="*" element={<NotFound />} />
            </Route>

            <Route
              path="*"
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
          </Routes>

          <Modal isOpen={modal.isOpen} title={modal.title} onClose={closeModal}>
            {modal.body}
          </Modal>
          <ToastContainer toasts={toasts} />
        </div>
      </ThemeContext.Provider>
    </AppContext.Provider>
  );
}

// REMOVA ESTA LINHA: export default App;
