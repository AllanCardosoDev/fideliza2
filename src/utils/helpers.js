// src/utils/helpers.js
export const fmt = (v) =>
  Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const fmtDate = (d) => {
  if (!d) return "—";
  // Adiciona 'T00:00:00' para garantir que a data seja interpretada como UTC e evitar problemas de fuso horário
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("pt-BR");
};

export const statusLabel = (s) => {
  return (
    {
      active: "Ativo",
      pending: "Pendente",
      inactive: "Inativo",
      paid: "Pago",
      late: "Atrasado",
      completed: "Concluída",
      available: "Disponível",
      reserved: "Reservado",
      sold: "Vendido",
      vacation: "Férias",
    }[s] || s
  );
};
