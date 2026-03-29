// src/services/api.js
import axios from "axios";

const API_BASE_URL = "http://localhost:3001"; // URL do seu JSON Server

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Funções para Clientes
export const getClients = () => api.get("/clients");
export const getClientById = (id) => api.get(`/clients/${id}`);
export const createClient = (clientData) => api.post("/clients", clientData);
export const updateClient = (id, clientData) =>
  api.put(`/clients/${id}`, clientData);
export const deleteClient = (id) => api.delete(`/clients/${id}`);

// Funções para Transações
export const getTransactions = () => api.get("/transactions");
export const createTransaction = (transactionData) =>
  api.post("/transactions", transactionData);
export const updateTransaction = (id, transactionData) =>
  api.put(`/transactions/${id}`, transactionData);
export const deleteTransaction = (id) => api.delete(`/transactions/${id}`);

// Funções para Empréstimos
export const getLoans = () => api.get("/loans");
export const createLoan = (loanData) => api.post("/loans", loanData);
export const updateLoan = (id, loanData) => api.put(`/loans/${id}`, loanData);
export const deleteLoan = (id) => api.delete(`/loans/${id}`);

// Funções para Vendas
export const getSales = () => api.get("/sales");
export const createSale = (saleData) => api.post("/sales", saleData);
export const updateSale = (id, saleData) => api.put(`/sales/${id}`, saleData);
export const deleteSale = (id) => api.delete(`/sales/${id}`);

// Funções para Veículos
export const getVehicles = () => api.get("/vehicles");
export const createVehicle = (vehicleData) =>
  api.post("/vehicles", vehicleData);
export const updateVehicle = (id, vehicleData) =>
  api.put(`/vehicles/${id}`, vehicleData);
export const deleteVehicle = (id) => api.delete(`/vehicles/${id}`);

// Funções para Funcionários
export const getEmployees = () => api.get("/employees");
export const createEmployee = (employeeData) =>
  api.post("/employees", employeeData);
export const updateEmployee = (id, employeeData) =>
  api.put(`/employees/${id}`, employeeData);
export const deleteEmployee = (id) => api.delete(`/employees/${id}`);

// Funções para Notificações
export const getNotifications = () => api.get("/notifications");
export const createNotification = (notificationData) =>
  api.post("/notifications", notificationData);
export const updateNotification = (id, notificationData) =>
  api.put(`/notifications/${id}`, notificationData);
export const deleteNotification = (id) => api.delete(`/notifications/${id}`);
