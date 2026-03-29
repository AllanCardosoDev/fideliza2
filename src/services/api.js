// src/services/api.js
import { supabase } from "./supabaseClient";

const wrap = async (queryPromise) => {
  const { data, error } = await queryPromise;
  if (error) {
    throw error;
  }
  return { data };
};

// Funções para Clientes
export const getClients = () => wrap(supabase.from("clients").select("*").order("name", { ascending: true }));
export const getClientById = (id) =>
  wrap(supabase.from("clients").select("*").eq("id", id).single());
export const createClient = (clientData) =>
  wrap(supabase.from("clients").insert(clientData).select());
export const updateClient = (id, clientData) =>
  wrap(supabase.from("clients").update(clientData).eq("id", id).select());
export const deleteClient = (id) =>
  wrap(supabase.from("clients").delete().eq("id", id));

// Funções para Transações
export const getTransactions = () =>
  wrap(supabase.from("transactions").select("*").order("date", { ascending: false }));
export const createTransaction = (transactionData) =>
  wrap(supabase.from("transactions").insert(transactionData).select());
export const updateTransaction = (id, transactionData) =>
  wrap(supabase.from("transactions").update(transactionData).eq("id", id).select());
export const deleteTransaction = (id) =>
  wrap(supabase.from("transactions").delete().eq("id", id));

// Funções para Empréstimos
export const getLoans = () =>
  wrap(supabase.from("loans").select("*").order("created_at", { ascending: false }));
export const createLoan = (loanData) =>
  wrap(supabase.from("loans").insert(loanData).select());
export const updateLoan = (id, loanData) =>
  wrap(supabase.from("loans").update(loanData).eq("id", id).select());
export const deleteLoan = (id) =>
  wrap(supabase.from("loans").delete().eq("id", id));

// Funções para Parcelas
export const getInstallments = (loanId) => {
  const query = supabase.from("installments").select("*");
  return wrap(loanId ? query.eq("loan_id", loanId).order("due_date") : query.order("due_date"));
};
export const createInstallments = (rows) =>
  wrap(supabase.from("installments").insert(rows).select());
export const updateInstallment = (id, data) =>
  wrap(supabase.from("installments").update(data).eq("id", id).select());
export const deleteInstallmentsByLoan = (loanId) =>
  wrap(supabase.from("installments").delete().eq("loan_id", loanId));

// Funções para Pagamentos
export const getPayments = () =>
  wrap(supabase.from("payments").select("*").order("payment_date", { ascending: false }));
export const getPaymentsByLoan = (loanId) =>
  wrap(supabase.from("payments").select("*").eq("loan_id", loanId).order("payment_date", { ascending: false }));
export const createPayment = (paymentData) =>
  wrap(supabase.from("payments").insert(paymentData).select());
export const deletePayment = (id) =>
  wrap(supabase.from("payments").delete().eq("id", id));

// Funções para Vendas
export const getSales = () => wrap(supabase.from("sales").select("*"));
export const createSale = (saleData) =>
  wrap(supabase.from("sales").insert(saleData).select());
export const updateSale = (id, saleData) =>
  wrap(supabase.from("sales").update(saleData).eq("id", id).select());
export const deleteSale = (id) =>
  wrap(supabase.from("sales").delete().eq("id", id));

// Funções para Veículos
export const getVehicles = () => wrap(supabase.from("vehicles").select("*"));
export const createVehicle = (vehicleData) =>
  wrap(supabase.from("vehicles").insert(vehicleData).select());
export const updateVehicle = (id, vehicleData) =>
  wrap(supabase.from("vehicles").update(vehicleData).eq("id", id).select());
export const deleteVehicle = (id) =>
  wrap(supabase.from("vehicles").delete().eq("id", id));

// Funções para Funcionários
export const getEmployees = () => wrap(supabase.from("employees").select("*"));
export const createEmployee = (employeeData) =>
  wrap(supabase.from("employees").insert(employeeData).select());
export const updateEmployee = (id, employeeData) =>
  wrap(supabase.from("employees").update(employeeData).eq("id", id).select());
export const deleteEmployee = (id) =>
  wrap(supabase.from("employees").delete().eq("id", id));

// Funções para Notificações
export const getNotifications = () =>
  wrap(supabase.from("notifications").select("*").order("created_at", { ascending: false }));
export const createNotification = (notificationData) =>
  wrap(supabase.from("notifications").insert(notificationData).select());
export const updateNotification = (id, notificationData) =>
  wrap(supabase.from("notifications").update(notificationData).eq("id", id).select());
export const deleteNotification = (id) =>
  wrap(supabase.from("notifications").delete().eq("id", id));
