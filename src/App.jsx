// src/App.jsx
import React, { useState, useEffect, createContext, useContext, useCallback } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import "./index.css";

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
import Cobrancas from "./pages/Cobrancas";
import Recebimentos from "./pages/Recebimentos";
import NotFound from "./pages/NotFound";
import Modal from "./components/Modal";
import ToastContainer from "./components/ToastContainer";

import {
  getClients,
  createClient as apiCreateClient,
  updateClient as apiUpdateClient,
  deleteClient as apiDeleteClient,
  getTransactions,
  createTransaction as apiCreateTransaction,
  deleteTransaction as apiDeleteTransaction,
  getLoans,
  createLoan as apiCreateLoan,
  updateLoan as apiUpdateLoan,
  deleteLoan as apiDeleteLoan,
  getSales,
  createSale as apiCreateSale,
  updateSale as apiUpdateSale,
  deleteSale as apiDeleteSale,
  getVehicles,
  createVehicle as apiCreateVehicle,
  updateVehicle as apiUpdateVehicle,
  deleteVehicle as apiDeleteVehicle,
  getEmployees,
  createEmployee as apiCreateEmployee,
  updateEmployee as apiUpdateEmployee,
  deleteEmployee as apiDeleteEmployee,
  getNotifications,
} from "./services/api";

// eslint-disable-next-line react-refresh/only-export-components
export const AppContext = createContext(null);
// eslint-disable-next-line react-refresh/only-export-components
export const ThemeContext = createContext(null);

// ProtectedLayout defined outside App to avoid creating components during render
function ProtectedLayout() {
  const { isAuthenticated } = useContext(AppContext);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

export default function App() {
  const [authToken, setAuthToken] = useState(
    localStorage.getItem("fc_token") || "",
  );
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("fc_current_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const userRole = currentUser?.access_level || (authToken && authToken !== "offline" ? "admin" : null);
  // isAuthenticated is derived from authToken to avoid setState-in-effect issues
  const isAuthenticated = Boolean(authToken);
  // Kept for backward-compat with components that call setIsAuthenticated
  const setIsAuthenticated = useCallback((val) => {
    if (!val) {
      setAuthToken("");
      setCurrentUser(null);
      localStorage.removeItem("fc_token");
      localStorage.removeItem("fc_current_user");
    }
  }, []);
  const [modal, setModal] = useState({ isOpen: false, title: "", body: null });
  const [toasts, setToasts] = useState([]);

  const [clients, setClients] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loans, setLoans] = useState([]);
  const [sales, setSales] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("fc_settings");
      return saved
        ? JSON.parse(saved)
        : {
            companyName: "Fideliza Cred",
            companyCnpj: "",
            companyEmail: "",
            companyPhone: "",
            companyAddress: "",
            defaultInterestRate: 5,
            defaultPenaltyRate: 2,
            defaultMoraRate: 0.033,
          };
    } catch {
      return {
        companyName: "Fideliza Cred",
        companyCnpj: "",
        companyEmail: "",
        companyPhone: "",
        companyAddress: "",
        defaultInterestRate: 5,
        defaultPenaltyRate: 2,
        defaultMoraRate: 0.033,
      };
    }
  });

  const saveSettings = useCallback((newSettings) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem("fc_settings", JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Theme
  const getInitialTheme = () => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  };
  const [theme, setTheme] = useState(getInitialTheme);
  useEffect(() => {
    document.body.className = theme === "dark" ? "dark-theme" : "light-theme";
    localStorage.setItem("theme", theme);
  }, [theme]);
  const toggleTheme = () => setTheme((prev) => (prev === "light" ? "dark" : "light"));

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const openModal = (title, bodyComponent) =>
    setModal({ isOpen: true, title, body: bodyComponent });
  const closeModal = () => setModal({ isOpen: false, title: "", body: null });

  // Loan CRUD
  const createLoan = useCallback(async (loanData) => {
    try {
      const res = await apiCreateLoan(loanData);
      const created = Array.isArray(res.data) ? res.data[0] : res.data;
      setLoans((prev) => [created, ...prev]);
      addToast("Empréstimo salvo!", "success");
      return created;
    } catch (err) {
      addToast("Erro ao salvar empréstimo.", "error");
      throw err;
    }
  }, [addToast]);

  const editLoan = useCallback(async (id, loanData) => {
    try {
      const res = await apiUpdateLoan(id, loanData);
      const updated = Array.isArray(res.data) ? res.data[0] : res.data;
      setLoans((prev) => prev.map((l) => (l.id === id ? updated : l)));
      addToast("Empréstimo atualizado!", "success");
      return updated;
    } catch (err) {
      addToast("Erro ao atualizar empréstimo.", "error");
      throw err;
    }
  }, [addToast]);

  const removeLoan = useCallback(async (id) => {
    try {
      await apiDeleteLoan(id);
      setLoans((prev) => prev.filter((l) => l.id !== id));
      addToast("Empréstimo excluído.", "success");
    } catch (err) {
      addToast("Erro ao excluir empréstimo.", "error");
      throw err;
    }
  }, [addToast]);

  // Client CRUD
  const createClientRecord = useCallback(async (data) => {
    try {
      const res = await apiCreateClient(data);
      const created = Array.isArray(res.data) ? res.data[0] : res.data;
      setClients((prev) => [created, ...prev]);
      addToast("Cliente cadastrado!", "success");
      return created;
    } catch (err) {
      addToast("Erro ao cadastrar cliente.", "error");
      throw err;
    }
  }, [addToast]);

  const editClientRecord = useCallback(async (id, data) => {
    try {
      const res = await apiUpdateClient(id, data);
      const updated = Array.isArray(res.data) ? res.data[0] : res.data;
      setClients((prev) => prev.map((c) => (c.id === id ? updated : c)));
      addToast("Cliente atualizado!", "success");
      return updated;
    } catch (err) {
      addToast("Erro ao atualizar cliente.", "error");
      throw err;
    }
  }, [addToast]);

  const removeClientRecord = useCallback(async (id) => {
    try {
      await apiDeleteClient(id);
      setClients((prev) => prev.filter((c) => c.id !== id));
      addToast("Cliente excluído.", "success");
    } catch (err) {
      addToast("Erro ao excluir cliente.", "error");
      throw err;
    }
  }, [addToast]);

  // Transaction CRUD
  const createTransactionRecord = useCallback(async (data) => {
    try {
      const res = await apiCreateTransaction(data);
      const created = Array.isArray(res.data) ? res.data[0] : res.data;
      setTransactions((prev) => [created, ...prev]);
      addToast("Transação registrada!", "success");
      return created;
    } catch (err) {
      addToast("Erro ao registrar transação.", "error");
      throw err;
    }
  }, [addToast]);

  const removeTransactionRecord = useCallback(async (id) => {
    try {
      await apiDeleteTransaction(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      addToast("Transação excluída.", "success");
    } catch (err) {
      addToast("Erro ao excluir transação.", "error");
      throw err;
    }
  }, [addToast]);

  // Sale CRUD
  const createSaleRecord = useCallback(async (data) => {
    try {
      const res = await apiCreateSale(data);
      const created = Array.isArray(res.data) ? res.data[0] : res.data;
      setSales((prev) => [created, ...prev]);
      addToast("Venda registrada!", "success");
      return created;
    } catch (err) {
      addToast("Erro ao registrar venda.", "error");
      throw err;
    }
  }, [addToast]);

  const editSaleRecord = useCallback(async (id, data) => {
    try {
      const res = await apiUpdateSale(id, data);
      const updated = Array.isArray(res.data) ? res.data[0] : res.data;
      setSales((prev) => prev.map((s) => (s.id === id ? updated : s)));
      addToast("Venda atualizada!", "success");
      return updated;
    } catch (err) {
      addToast("Erro ao atualizar venda.", "error");
      throw err;
    }
  }, [addToast]);

  const removeSaleRecord = useCallback(async (id) => {
    try {
      await apiDeleteSale(id);
      setSales((prev) => prev.filter((s) => s.id !== id));
      addToast("Venda excluída.", "success");
    } catch (err) {
      addToast("Erro ao excluir venda.", "error");
      throw err;
    }
  }, [addToast]);

  // Vehicle CRUD
  const createVehicleRecord = useCallback(async (data) => {
    try {
      const res = await apiCreateVehicle(data);
      const created = Array.isArray(res.data) ? res.data[0] : res.data;
      setVehicles((prev) => [created, ...prev]);
      addToast("Veículo cadastrado!", "success");
      return created;
    } catch (err) {
      addToast("Erro ao cadastrar veículo.", "error");
      throw err;
    }
  }, [addToast]);

  const editVehicleRecord = useCallback(async (id, data) => {
    try {
      const res = await apiUpdateVehicle(id, data);
      const updated = Array.isArray(res.data) ? res.data[0] : res.data;
      setVehicles((prev) => prev.map((v) => (v.id === id ? updated : v)));
      addToast("Veículo atualizado!", "success");
      return updated;
    } catch (err) {
      addToast("Erro ao atualizar veículo.", "error");
      throw err;
    }
  }, [addToast]);

  const removeVehicleRecord = useCallback(async (id) => {
    try {
      await apiDeleteVehicle(id);
      setVehicles((prev) => prev.filter((v) => v.id !== id));
      addToast("Veículo excluído.", "success");
    } catch (err) {
      addToast("Erro ao excluir veículo.", "error");
      throw err;
    }
  }, [addToast]);

  // Employee CRUD
  const createEmployeeRecord = useCallback(async (data) => {
    try {
      const res = await apiCreateEmployee(data);
      const created = Array.isArray(res.data) ? res.data[0] : res.data;
      setEmployees((prev) => [created, ...prev]);
      addToast("Funcionário cadastrado!", "success");
      return created;
    } catch (err) {
      addToast("Erro ao cadastrar funcionário.", "error");
      throw err;
    }
  }, [addToast]);

  const editEmployeeRecord = useCallback(async (id, data) => {
    try {
      const res = await apiUpdateEmployee(id, data);
      const updated = Array.isArray(res.data) ? res.data[0] : res.data;
      setEmployees((prev) => prev.map((e) => (e.id === id ? updated : e)));
      addToast("Funcionário atualizado!", "success");
      return updated;
    } catch (err) {
      addToast("Erro ao atualizar funcionário.", "error");
      throw err;
    }
  }, [addToast]);

  const removeEmployeeRecord = useCallback(async (id) => {
    try {
      await apiDeleteEmployee(id);
      setEmployees((prev) => prev.filter((e) => e.id !== id));
      addToast("Funcionário excluído.", "success");
    } catch (err) {
      addToast("Erro ao excluir funcionário.", "error");
      throw err;
    }
  }, [addToast]);

  // Demo data (offline mode)
  const loadDemoData = useCallback(() => {
    const today = new Date().toISOString().split("T")[0];
    setClients([
      { id: 1, name: "João Silva", email: "joao@email.com", phone: "(11) 98765-4321", cpf_cnpj: "123.456.789-00", status: "active", address: "Rua das Flores, 123", notes: "" },
      { id: 2, name: "Maria Souza", email: "maria@email.com", phone: "(21) 99876-5432", cpf_cnpj: "987.654.321-00", status: "overdue", address: "Av. Brasil, 456", notes: "Atraso frequente" },
      { id: 3, name: "Carlos Pereira", email: "carlos@email.com", phone: "(31) 91234-5678", cpf_cnpj: "456.789.123-00", status: "active", address: "Rua do Comércio, 789", notes: "" },
    ]);
    setLoans([
      { id: 1, client: "João Silva", client_id: 1, value: 5000, installments: 12, paid: 3, status: "active", interest_rate: 5, start_date: "2025-01-15", interest_type: "compound" },
      { id: 2, client: "Maria Souza", client_id: 2, value: 3000, installments: 6, paid: 6, status: "paid", interest_rate: 4, start_date: "2024-10-01", interest_type: "compound" },
      { id: 3, client: "Carlos Pereira", client_id: 3, value: 8000, installments: 24, paid: 1, status: "overdue", interest_rate: 6, start_date: "2025-02-01", interest_type: "compound" },
    ]);
    setTransactions([
      { id: 1, description: "Recebimento parcela - João Silva", category: "Empréstimo", type: "income", amount: 450, date: today },
      { id: 2, description: "Recebimento parcela - Maria Souza", category: "Empréstimo", type: "income", amount: 530, date: today },
      { id: 3, description: "Despesa operacional", category: "Operacional", type: "expense", amount: 200, date: today },
    ]);
  }, []);

  // Load data from API
  const loadDataFromApi = useCallback(async () => {
    const results = await Promise.allSettled([
      getClients(),
      getTransactions(),
      getLoans(),
      getSales(),
      getVehicles(),
      getEmployees(),
      getNotifications(),
    ]);
    const [cRes, tRes, lRes, sRes, vRes, eRes, nRes] = results;
    if (cRes.status === "fulfilled") setClients(cRes.value.data || []);
    if (tRes.status === "fulfilled") setTransactions(tRes.value.data || []);
    if (lRes.status === "fulfilled") setLoans(lRes.value.data || []);
    if (sRes.status === "fulfilled") setSales(sRes.value.data || []);
    if (vRes.status === "fulfilled") setVehicles(vRes.value.data || []);
    if (eRes.status === "fulfilled") setEmployees(eRes.value.data || []);
    if (nRes.status === "fulfilled") setNotifications(nRes.value.data || []);
  }, []);

  useEffect(() => {
    if (!authToken) return;
    if (authToken === "offline") {
      loadDemoData();
    } else {
      loadDataFromApi();
    }
  }, [authToken, loadDataFromApi, loadDemoData]);

  const contextValue = {
    isAuthenticated,
    setIsAuthenticated,
    authToken,
    setAuthToken,
    currentUser,
    setCurrentUser,
    userRole,
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
    settings,
    saveSettings,
    createLoan,
    editLoan,
    removeLoan,
    createClientRecord,
    editClientRecord,
    removeClientRecord,
    createTransactionRecord,
    removeTransactionRecord,
    createSaleRecord,
    editSaleRecord,
    removeSaleRecord,
    createVehicleRecord,
    editVehicleRecord,
    removeVehicleRecord,
    createEmployeeRecord,
    editEmployeeRecord,
    removeEmployeeRecord,
    loadDataFromApi,
    loadDemoData,
  };

  return (
    <AppContext.Provider value={contextValue}>
      <ThemeContext.Provider value={{ theme, toggleTheme }}>
        <div id="root-container">
          <Routes>
            <Route
              path="/login"
              element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginScreen />}
            />
            <Route path="/" element={<ProtectedLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="clientes" element={<Clientes />} />
              <Route path="financeiro" element={<Financeiro />} />
              <Route path="emprestimos" element={<Emprestimos />} />
              <Route path="cobrancas" element={<Cobrancas />} />
              <Route path="recebimentos" element={<Recebimentos />} />
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
              element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
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
