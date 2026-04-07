// src/App.jsx
import React, {
  useState,
  useEffect,
  createContext,
  useContext,
  useCallback,
} from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import "./index.css";

import LoginScreen from "./components/LoginScreen";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Financeiro from "./pages/Financeiro";
import Emprestimos from "./pages/Emprestimos";
import Funcionarios from "./pages/Funcionarios";
import Relatorios from "./pages/Relatorios";
import Agenda from "./pages/Agenda";
import Configuracoes from "./pages/Configuracoes";
import Cobrancas from "./pages/Cobrancas";
import Recebimentos from "./pages/Recebimentos";
import Simulador from "./pages/Simulador";
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
  getEmployees,
  createEmployee as apiCreateEmployee,
  updateEmployee as apiUpdateEmployee,
  deleteEmployee as apiDeleteEmployee,
  getNotifications,
  createNotification as apiCreateNotification,
  updateNotification as apiUpdateNotification,
  getClientAssignments,
  getEmployeeClients,
  assignClientToEmployee,
  updateClientAssignment,
  deleteClientAssignment,
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
  const userRole =
    currentUser?.access_level ||
    (authToken && authToken !== "offline" ? "admin" : null);
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

  // Caixa (Cash Management)
  const [caixa, setCaixa] = useState(() => {
    try {
      const saved = localStorage.getItem("fc_caixa");
      return saved ? JSON.parse(saved) : 1000000;
    } catch {
      return 1000000;
    }
  });

  const saveCaixa = useCallback((newCaixa) => {
    const caixaAmount = Math.max(0, Number(newCaixa) || 0);
    setCaixa(caixaAmount);
    localStorage.setItem("fc_caixa", JSON.stringify(caixaAmount));
  }, []);

  // Payments (from Recebimentos)
  const [payments, setPayments] = useState(() => {
    try {
      const saved = localStorage.getItem("fc_payments");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handlePaymentsUpdated = (event) => {
      const updated = event.detail || [];
      setPayments(updated);
    };
    window.addEventListener("paymentsUpdated", handlePaymentsUpdated);
    return () =>
      window.removeEventListener("paymentsUpdated", handlePaymentsUpdated);
  }, []);

  // Theme
  const getInitialTheme = () => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  };
  const [theme, setTheme] = useState(getInitialTheme);
  useEffect(() => {
    document.body.className = theme === "dark" ? "dark-theme" : "light-theme";
    localStorage.setItem("theme", theme);
  }, [theme]);
  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      4000,
    );
  }, []);

  const openModal = (title, bodyComponent) =>
    setModal({ isOpen: true, title, body: bodyComponent });
  const closeModal = () => setModal({ isOpen: false, title: "", body: null });

  const addNotification = useCallback(
    async (message, type = "blue") => {
      try {
        const notifData = {
          message,
          text: message,
          type,
          read: false,
          created_at: new Date().toISOString(),
        };
        if (authToken && authToken !== "offline") {
          const res = await apiCreateNotification(notifData);
          const created = Array.isArray(res.data) ? res.data[0] : res.data;
          notifData.id = created?.id || Date.now();
        } else {
          notifData.id = Date.now();
        }
        setNotifications((prev) => [notifData, ...prev]);
      } catch (err) {
        console.warn("Failed to create notification", err);
        setNotifications((prev) => [
          {
            id: Date.now(),
            message,
            text: message,
            type,
            read: false,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
      }
    },
    [authToken],
  );

  const [readNotifIds, setReadNotifIds] = useState(() => {
    try {
      const saved = localStorage.getItem("fc_read_notifs");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const markNotificationAsRead = useCallback(
    async (id) => {
      // Save to local cache to survive reloads if Supabase RLS silently fails
      setReadNotifIds((prev) => {
        const updated = [...new Set([...prev, id])];
        localStorage.setItem("fc_read_notifs", JSON.stringify(updated));
        return updated;
      });

      // Optimistic remove from unread list
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      if (authToken && authToken !== "offline" && id) {
        try {
          await apiUpdateNotification(id, { read: true });
        } catch (e) {
          console.warn("Failed to update notification status", e);
        }
      }
    },
    [authToken],
  );

  const clearAllNotifications = useCallback(async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);

    // Save to local cache
    setReadNotifIds((prev) => {
      const updated = [...new Set([...prev, ...unreadIds])];
      localStorage.setItem("fc_read_notifs", JSON.stringify(updated));
      return updated;
    });

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (authToken && authToken !== "offline") {
      unreadIds.forEach((id) => {
        if (id) {
          apiUpdateNotification(id, { read: true }).catch((e) =>
            console.warn(e),
          );
        }
      });
    }
  }, [notifications, authToken]);

  // Helper function to map loan from API format to app format
  const mapLoanFromApi = useCallback(
    (loan) => ({
      ...loan,
      client: loan.clients?.name || loan.client || "",
    }),
    [],
  );

  // Loan CRUD
  const createLoan = useCallback(
    async (loanData) => {
      try {
        // IMPORTANT: Employee can ONLY create loans as "pending" requisitions
        // The status field is hidden from employees in the form
        // This ensures they cannot accidentally or intentionally create active loans
        const submissionData = { ...loanData };
        let toastMessage = "Empréstimo salvo!";

        if (userRole === "employee") {
          // EMPLOYEE: ALWAYS force pending status - this is non-negotiable
          submissionData.status = "pending";
          toastMessage = "Requisição enviada para aprovação do Admin!";
        } else {
          // ADMIN/SUPERVISOR: Use provided status or default to active
          if (!submissionData.status) {
            submissionData.status = "active";
          }
        }

        if (authToken === "offline") {
          const created = { id: Date.now(), ...submissionData };
          const mapped = mapLoanFromApi(created);
          setLoans((prev) => [mapped, ...prev]);
          addToast(toastMessage, "success");
          if (userRole === "employee") {
            const valstr = new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(mapped.value || 0);
            const userName = currentUser?.name
              ? currentUser.name.split(" ")[0]
              : "Um funcionário";
            addNotification(
              `⏳ Nova Requisição: ${userName} solicitou ${valstr} para ${mapped.client}. Revisão pendente!`,
              "warning",
              "/emprestimos",
            );
          } else {
            addNotification(
              `Novo empréstimo ativado com sucesso!`,
              "blue",
              "/emprestimos",
            );
          }
          return mapped;
        }

        const res = await apiCreateLoan(submissionData);
        const created = Array.isArray(res.data) ? res.data[0] : res.data;
        const mapped = mapLoanFromApi(created);
        setLoans((prev) => [mapped, ...prev]);
        addToast(toastMessage, "success");

        if (userRole === "employee") {
          const valstr = new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(mapped.value || 0);
          const userName = currentUser?.name
            ? currentUser.name.split(" ")[0]
            : "Um funcionário";
          addNotification(
            `⏳ Nova Requisição: ${userName} solicitou ${valstr} para ${mapped.client}. Revisão pendente!`,
            "warning",
            "/emprestimos",
          );
        } else {
          addNotification(
            `Novo empréstimo de ${mapped.client} ativado com sucesso!`,
            "blue",
            "/emprestimos",
          );
        }

        return mapped;
      } catch (err) {
        addToast("Erro ao salvar empréstimo.", "error");
        throw err;
      }
    },
    [addToast, mapLoanFromApi, userRole],
  );

  const editLoan = useCallback(
    async (id, loanData) => {
      try {
        if (authToken === "offline") {
          const mapped = mapLoanFromApi({ id, ...loanData });
          setLoans((prev) =>
            prev.map((l) => (l.id === id ? { ...l, ...mapped } : l)),
          );
          addToast("Empréstimo atualizado!", "success");
          return mapped;
        }
        const res = await apiUpdateLoan(id, loanData);
        const updated = Array.isArray(res.data) ? res.data[0] : res.data;
        const mapped = mapLoanFromApi(updated);
        setLoans((prev) => prev.map((l) => (l.id === id ? mapped : l)));
        addToast("Empréstimo atualizado!", "success");
        return mapped;
      } catch (err) {
        addToast("Erro ao atualizar empréstimo.", "error");
        throw err;
      }
    },
    [addToast],
  );

  const removeLoan = useCallback(
    async (id) => {
      try {
        await apiDeleteLoan(id);
        setLoans((prev) => prev.filter((l) => l.id !== id));
        addToast("Empréstimo excluído.", "success");
      } catch (err) {
        addToast("Erro ao excluir empréstimo.", "error");
        throw err;
      }
    },
    [addToast],
  );

  // Loan Requisition Approval/Rejection (Admin only)
  const approveLoan = useCallback(
    async (id) => {
      try {
        const loan = loans.find((l) => l.id === id);
        if (!loan) throw new Error("Empréstimo não encontrado");

        // Approve the loan - only change status
        const res = await apiUpdateLoan(id, { status: "active" });
        const updated = Array.isArray(res.data) ? res.data[0] : res.data;
        const mapped = mapLoanFromApi(updated);
        setLoans((prev) => prev.map((l) => (l.id === id ? mapped : l)));

        // Auto-approve the associated client (also set status to active)
        if (
          loan.client_id &&
          clients.find(
            (c) => c.id === loan.client_id && c.approval_status === "pending",
          )
        ) {
          try {
            await apiUpdateClient(loan.client_id, {
              approval_status: "approved",
              status: "active",
            });
            setClients((prev) =>
              prev.map((c) =>
                c.id === loan.client_id
                  ? { ...c, approval_status: "approved", status: "active" }
                  : c,
              ),
            );
          } catch (clientErr) {
            console.warn("Failed to auto-approve client:", clientErr);
            // Don't fail the whole operation
          }
        }

        addToast("Empréstimo aprovado e saldo descontado do Caixa!", "success");
        addNotification(
          `O empréstimo de ${mapped.client} que você solicitou foi aprovado.`,
          "success",
        );

        // Decrementar do Caixa físico
        saveCaixa(caixa - (Number(loan.value) || 0));

        return mapped;
      } catch (err) {
        console.error("Erro ao aprovar empréstimo:", err);
        addToast("Erro ao aprovar empréstimo.", "error");
        throw err;
      }
    },
    [
      addToast,
      mapLoanFromApi,
      loans,
      clients,
      addNotification,
      caixa,
      saveCaixa,
    ],
  );

  const rejectLoan = useCallback(
    async (id, reason) => {
      try {
        const loan = loans.find((l) => l.id === id);
        if (!loan) throw new Error("Empréstimo não encontrado");

        // A solicitação de arquivamento "cancela toda a ação" excluindo fisicamente
        await apiDeleteLoan(id);

        setLoans((prev) => prev.filter((l) => l.id !== id));
        addToast("Requisição reprovada. Ação inteiramente cancelada.", "info");

        const clientName =
          loan.client || (loan.clients ? loan.clients.name : "um cliente");
        const msg = reason
          ? `Sua requisição para ${clientName} foi reprovada. Motivo: ${reason}`
          : `Sua requisição para ${clientName} foi cancelada/reprovada.`;

        addNotification(msg, "error");

        return loan;
      } catch (err) {
        console.error("Erro ao rejeitar empréstimo:", err);
        addToast("Erro ao cancelar empréstimo.", "error");
        throw err;
      }
    },
    [addToast, loans, addNotification],
  );

  // Client CRUD
  const createClientRecord = useCallback(
    async (data) => {
      try {
        // IMPORTANT: Employee can ONLY create clients as "pending" (awaiting admin approval)
        // Even if the form had an approval_status field, it would be overridden here
        // This ensures employees cannot bypass the approval workflow
        const submissionData = { ...data };
        let toastMessage = "Cliente cadastrado!";

        if (userRole === "employee") {
          // EMPLOYEE: ALWAYS force pending approval status
          submissionData.approval_status = "pending";
          submissionData.status = "inactive"; // Visual indicator of pending approval
          toastMessage = "Cliente cadastrado! Aguardando aprovação do Admin.";
        } else {
          // ADMIN/SUPERVISOR: Create as already approved
          submissionData.approval_status = "approved";
          // Admin can set status directly, or default to active
          if (!submissionData.status) {
            submissionData.status = "active";
          }
        }

        if (authToken === "offline") {
          const created = { id: Date.now(), ...submissionData };
          setClients((prev) => [created, ...prev]);
          addToast(toastMessage, "success");
          if (userRole === "employee") {
            addNotification(
              `Novo cliente aguardando aprovação: ${created.name}`,
              "warning",
            );
          } else {
            addNotification(`Novo cliente cadastrado: ${created.name}`, "blue");
          }
          return created;
        }
        const res = await apiCreateClient(submissionData);
        const created = Array.isArray(res.data) ? res.data[0] : res.data;
        setClients((prev) => [created, ...prev]);

        // Auto-assign client to creator as "owner"
        if (created.id && currentUser?.id) {
          try {
            await assignClientToEmployee(
              created.id,
              currentUser.id,
              "owner",
              currentUser.id,
            );
          } catch (assignErr) {
            console.warn("Failed to create assignment:", assignErr);
            // Don't fail the whole operation if assignment fails
          }
        }

        addToast(toastMessage, "success");

        if (userRole === "employee") {
          addNotification(
            `Novo cliente aguardando aprovação: ${created.name}`,
            "warning",
          );
        } else {
          addNotification(`Novo cliente cadastrado: ${created.name}`, "blue");
        }

        return created;
      } catch (err) {
        addToast("Erro ao cadastrar cliente.", "error");
        throw err;
      }
    },
    [addToast, currentUser, userRole],
  );

  const editClientRecord = useCallback(
    async (id, data) => {
      try {
        if (authToken === "offline") {
          const updated = { id, ...data };
          setClients((prev) =>
            prev.map((c) => (c.id === id ? { ...c, ...updated } : c)),
          );
          addToast("Cliente atualizado!", "success");
          return updated;
        }

        const payload = { ...data };
        delete payload.id;
        delete payload.created_at;

        const res = await apiUpdateClient(id, payload);
        const updated = Array.isArray(res.data) ? res.data[0] : res.data;
        setClients((prev) => prev.map((c) => (c.id === id ? updated : c)));
        addToast("Cliente atualizado!", "success");
        return updated;
      } catch (err) {
        addToast("Erro ao atualizar cliente.", "error");
        throw err;
      }
    },
    [addToast],
  );

  const removeClientRecord = useCallback(
    async (id) => {
      try {
        if (authToken === "offline") {
          setClients((prev) => prev.filter((c) => c.id !== id));
          addToast("Cliente excluído.", "success");
          return;
        }
        await apiDeleteClient(id);
        setClients((prev) => prev.filter((c) => c.id !== id));
        addToast("Cliente excluído.", "success");
      } catch (err) {
        addToast("Erro ao excluir cliente.", "error");
        throw err;
      }
    },
    [addToast],
  );

  // Client Approval/Rejection (Admin only)
  const approveClient = useCallback(
    async (id) => {
      try {
        if (authToken === "offline") {
          setClients((prev) =>
            prev.map((c) =>
              c.id === id
                ? { ...c, approval_status: "approved", status: "active" }
                : c,
            ),
          );
          addToast("Cliente aprovado!", "success");
          addNotification(`Cliente aprovado com sucesso!`, "success");
          return;
        }
        // When approving a client, also set status to "active"
        const res = await apiUpdateClient(id, {
          approval_status: "approved",
          status: "active",
        });
        const updated = Array.isArray(res.data) ? res.data[0] : res.data;
        setClients((prev) => prev.map((c) => (c.id === id ? updated : c)));
        addToast("Cliente aprovado!", "success");
        addNotification(`Cliente aprovado: ${updated.name}`, "success");
        return updated;
      } catch (err) {
        addToast("Erro ao aprovar cliente.", "error");
        throw err;
      }
    },
    [addToast],
  );

  const rejectClient = useCallback(
    async (id, reason) => {
      try {
        const res = await apiUpdateClient(id, {
          approval_status: "rejected",
          rejection_reason: reason || "Rejeitado pelo administrador",
        });
        const updated = Array.isArray(res.data) ? res.data[0] : res.data;
        setClients((prev) => prev.map((c) => (c.id === id ? updated : c)));
        addToast("Cliente rejeitado.", "info");
        return updated;
      } catch (err) {
        addToast("Erro ao rejeitar cliente.", "error");
        throw err;
      }
    },
    [addToast],
  );

  // Transaction CRUD
  const createTransactionRecord = useCallback(
    async (data) => {
      try {
        if (authToken === "offline") {
          const created = { id: Date.now(), ...data };
          setTransactions((prev) => [created, ...prev]);
          addToast("Transação registrada!", "success");
          addNotification(
            `Transação adicionada: ${created.description}`,
            "blue",
          );
          return created;
        }
        const res = await apiCreateTransaction(data);
        const created = Array.isArray(res.data) ? res.data[0] : res.data;
        setTransactions((prev) => [created, ...prev]);
        addToast("Transação registrada!", "success");
        addNotification(`Transação adicionada: ${created.description}`, "blue");
        return created;
      } catch (err) {
        addToast("Erro ao registrar transação.", "error");
        throw err;
      }
    },
    [addToast],
  );

  const removeTransactionRecord = useCallback(
    async (id) => {
      try {
        if (authToken === "offline") {
          setTransactions((prev) => prev.filter((t) => t.id !== id));
          addToast("Transação excluída.", "success");
          return;
        }
        await apiDeleteTransaction(id);
        setTransactions((prev) => prev.filter((t) => t.id !== id));
        addToast("Transação excluída.", "success");
      } catch (err) {
        addToast("Erro ao excluir transação.", "error");
        throw err;
      }
    },
    [addToast],
  );

  // Employee CRUD
  const createEmployeeRecord = useCallback(
    async (data) => {
      try {
        if (authToken === "offline") {
          const created = { id: Date.now(), ...data };
          setEmployees((prev) => [created, ...prev]);
          addToast("Funcionário cadastrado!", "success");
          return created;
        }

        // Handle empty date strings
        const payload = { ...data };
        if (payload.admission === "") payload.admission = null;

        const res = await apiCreateEmployee(payload);
        const created = Array.isArray(res.data) ? res.data[0] : res.data;
        setEmployees((prev) => [created, ...prev]);
        addToast("Funcionário cadastrado!", "success");
        return created;
      } catch (err) {
        addToast("Erro ao cadastrar funcionário.", "error");
        throw err;
      }
    },
    [addToast],
  );

  const editEmployeeRecord = useCallback(
    async (id, data) => {
      try {
        if (authToken === "offline") {
          const updated = { id, ...data };
          setEmployees((prev) =>
            prev.map((e) => (e.id === id ? { ...e, ...updated } : e)),
          );
          addToast("Funcionário atualizado!", "success");
          return updated;
        }

        const payload = { ...data };
        delete payload.id;
        delete payload.created_at;
        if (payload.admission === "") payload.admission = null;

        const res = await apiUpdateEmployee(id, payload);
        const updated = Array.isArray(res.data) ? res.data[0] : res.data;
        setEmployees((prev) => prev.map((e) => (e.id === id ? updated : e)));
        addToast("Funcionário atualizado!", "success");
        return updated;
      } catch (err) {
        addToast("Erro ao atualizar funcionário.", "error");
        throw err;
      }
    },
    [addToast],
  );

  const removeEmployeeRecord = useCallback(
    async (id) => {
      try {
        if (authToken === "offline") {
          setEmployees((prev) => prev.filter((e) => e.id !== id));
          addToast("Funcionário excluído.", "success");
          return;
        }
        await apiDeleteEmployee(id);
        setEmployees((prev) => prev.filter((e) => e.id !== id));
        addToast("Funcionário excluído.", "success");
      } catch (err) {
        addToast("Erro ao excluir funcionário.", "error");
        throw err;
      }
    },
    [addToast],
  );

  // Demo data (offline mode)
  const loadDemoData = useCallback(() => {
    const today = new Date().toISOString().split("T")[0];
    setClients([
      {
        id: 1,
        name: "João Silva",
        email: "joao@email.com",
        phone: "(11) 98765-4321",
        cpf_cnpj: "123.456.789-00",
        status: "active",
        address: "Rua das Flores, 123",
        notes: "",
      },
      {
        id: 2,
        name: "Maria Souza",
        email: "maria@email.com",
        phone: "(21) 99876-5432",
        cpf_cnpj: "987.654.321-00",
        status: "overdue",
        address: "Av. Brasil, 456",
        notes: "Atraso frequente",
      },
      {
        id: 3,
        name: "Carlos Pereira",
        email: "carlos@email.com",
        phone: "(31) 91234-5678",
        cpf_cnpj: "456.789.123-00",
        status: "active",
        address: "Rua do Comércio, 789",
        notes: "",
      },
    ]);
    setLoans([
      {
        id: 1,
        client: "João Silva",
        client_id: 1,
        value: 5000,
        installments: 12,
        paid: 3,
        status: "active",
        interest_rate: 5,
        start_date: "2025-01-15",
        interest_type: "compound",
      },
      {
        id: 2,
        client: "Maria Souza",
        client_id: 2,
        value: 3000,
        installments: 6,
        paid: 6,
        status: "paid",
        interest_rate: 4,
        start_date: "2024-10-01",
        interest_type: "compound",
      },
      {
        id: 3,
        client: "Carlos Pereira",
        client_id: 3,
        value: 8000,
        installments: 24,
        paid: 1,
        status: "overdue",
        interest_rate: 6,
        start_date: "2025-02-01",
        interest_type: "compound",
      },
    ]);
    setTransactions([
      {
        id: 1,
        description: "Recebimento parcela - João Silva",
        category: "Empréstimo",
        type: "income",
        amount: 450,
        date: today,
      },
      {
        id: 2,
        description: "Recebimento parcela - Maria Souza",
        category: "Empréstimo",
        type: "income",
        amount: 530,
        date: today,
      },
      {
        id: 3,
        description: "Despesa operacional",
        category: "Operacional",
        type: "expense",
        amount: 200,
        date: today,
      },
    ]);
  }, []);

  // Load data from API
  const loadDataFromApi = useCallback(async () => {
    const results = await Promise.allSettled([
      getClients(),
      getTransactions(),
      getLoans(),
      getEmployees(),
      getNotifications(),
    ]);
    const [cRes, tRes, lRes, eRes, nRes] = results;
    if (cRes.status === "fulfilled") setClients(cRes.value.data || []);
    if (tRes.status === "fulfilled") setTransactions(tRes.value.data || []);
    if (lRes.status === "fulfilled") {
      // Map loans: convert clients: { name } to client: "name"
      const loansData = (lRes.value.data || []).map((loan) => ({
        ...loan,
        client: loan.clients?.name || loan.client || "",
      }));
      setLoans(loansData);
    }
    if (eRes.status === "fulfilled") setEmployees(eRes.value.data || []);
    if (nRes.status === "fulfilled") {
      // Force read state from local cache if Supabase didn't persist it
      const cachedReadIds = (() => {
        try {
          return JSON.parse(localStorage.getItem("fc_read_notifs") || "[]");
        } catch {
          return [];
        }
      })();
      const loadedNotifs = (nRes.value.data || []).map((n) => {
        if (cachedReadIds.includes(n.id)) {
          return { ...n, read: true };
        }
        return n;
      });
      setNotifications(loadedNotifs);
    }
  }, []);

  // Alias for reloading loans from Financeiro page
  const reloadLoans = useCallback(async () => {
    try {
      const res = await getLoans();
      if (res.status === "fulfilled" || res.data) {
        const loansData = (res.data || []).map((loan) => ({
          ...loan,
          client: loan.clients?.name || loan.client || "",
        }));
        setLoans(loansData);
      }
    } catch (err) {
      console.error("[App] Erro ao recarregar loans:", err);
    }
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
    reloadLoans,
    payments,
    setPayments,
    employees,
    setEmployees,
    notifications,
    setNotifications,
    settings,
    saveSettings,
    caixa,
    saveCaixa,
    createLoan,
    editLoan,
    removeLoan,
    approveLoan,
    rejectLoan,
    createClientRecord,
    editClientRecord,
    removeClientRecord,
    approveClient,
    rejectClient,
    createTransactionRecord,
    removeTransactionRecord,
    createEmployeeRecord,
    editEmployeeRecord,
    removeEmployeeRecord,
    loadDataFromApi,
    loadDemoData,
    getClientAssignments,
    getEmployeeClients,
    assignClientToEmployee,
    updateClientAssignment,
    deleteClientAssignment,
    addNotification,
    markNotificationAsRead,
    clearAllNotifications,
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
              <Route path="simulador" element={<Simulador />} />
              <Route path="cobrancas" element={<Cobrancas />} />
              <Route path="recebimentos" element={<Recebimentos />} />
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
