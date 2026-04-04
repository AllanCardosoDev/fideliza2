// src/pages/Agenda.jsx
import React, { useContext, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../App";
import { fmt, calcPMT, getClientName } from "../utils/helpers";

function toDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function eventIcon(type) {
  switch (type) {
    case "installment":
      return "💳";
    case "client":
      return "👤";
    case "sale":
      return "🛒";
    case "transaction":
      return "💰";
    case "employee":
      return "👔";
    case "loan_alert":
      return "⏳";
    case "loan_approved":
      return "✅";
    case "loan_rejected":
      return "❌";
    default:
      return "📌";
  }
}

function Agenda() {
  const { loans, clients, sales, transactions, employees, currentUser, userRole } =
    useContext(AppContext);
  const navigate = useNavigate();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("month"); // "month" | "week" | "day"
  const [eventFilter, setEventFilter] = useState("all"); // "all" | "installment" | "transaction" | "client" | "employee" | "loan_alert" | "loan_approved" | "loan_rejected"
  const [selectedDay, setSelectedDay] = useState(null); // Para mostrar modal com eventos pequenos

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Accessible data for employees
  const accessibleClients = useMemo(() => {
    if (userRole === "employee" && currentUser?.id) {
      return clients.filter(c => c.created_by === currentUser.id || c.owner_id === currentUser.id);
    }
    return clients;
  }, [clients, currentUser, userRole]);

  const accessibleLoans = useMemo(() => {
    if (userRole === "employee" && currentUser?.id && clients) {
      const myClientIds = clients
        .filter(c => c.created_by === currentUser.id || c.owner_id === currentUser.id)
        .map(c => c.id);
      return loans.filter(l => myClientIds.includes(l.client_id));
    }
    return loans;
  }, [loans, clients, currentUser, userRole]);

  // Generate all events from all data sources
  const allEvents = useMemo(() => {
    const events = [];
    const now = new Date();

    // 1. Loan installments (for all users, but filtered by access)
    accessibleLoans.forEach((loan) => {
      if (!loan.start_date) return;
      const v = Number(loan.value) || 0;
      const rate = (Number(loan.interest_rate) || 0) / 100;
      const n = Number(loan.installments) || 0;
      const paid = Number(loan.paid) || 0;
      if (!v || !n) return;

      const pmt = calcPMT(v, rate, n);
      const start = new Date(loan.start_date + "T00:00:00");

      for (let i = 1; i <= n; i++) {
        const due = new Date(start);
        due.setMonth(due.getMonth() + (i - 1));
        const dueDate = due.toISOString().split("T")[0];

        let status;
        if (i <= paid) status = "paid";
        else if (due < now) status = "overdue";
        else status = "due";

        events.push({
          id: `loan-${loan.id}-${i}`,
          date: dueDate,
          type: "installment",
          status,
          title: `Parcela ${i}/${n} — ${getClientName(loan.client)}`,
          description: `Empréstimo: ${fmt(v)} | PMT: ${fmt(pmt)}`,
          amount: pmt,
          color:
            status === "paid" ? "green" : status === "overdue" ? "red" : "blue",
          link: "/recebimentos",
        });
      }
    });

    // 1.5. Loan requisition alerts and results
    loans.forEach((loan) => {
      // Alert for pending requisitions (only for admin/supervisor)
      if (loan.status === "pending" && userRole !== "employee") {
        const createdDate = loan.created_at ? loan.created_at.split("T")[0] : new Date().toISOString().split("T")[0];
        const clientName = getClientName(loan.client);
        
        events.push({
          id: `loan-alert-${loan.id}`,
          date: createdDate,
          type: "loan_alert",
          status: "warning",
          title: `⏳ Requisição de Empréstimo Pendente — ${clientName}`,
          description: `Valor: ${fmt(loan.value)} | Criado por: ${loan.created_by_name || "—"}`,
          amount: Number(loan.value) || 0,
          color: "orange",
          link: "/emprestimos",
        });
      }

      // Approved requisition result (for the employee who created it)
      // TODO: After migration, use loan.approved_at for the date. For now, use loan.updated_at
      if (loan.status === "active" && !loan.created_at?.includes(loan.updated_at)) {
        const approvedDate = loan.updated_at ? loan.updated_at.split("T")[0] : new Date().toISOString().split("T")[0];
        const clientName = getClientName(loan.client);
        
        // Show to: creator (if employee), or admin/supervisor (if viewing others)
        const canSeeApproved = userRole === "admin" || userRole === "supervisor" || 
                               (userRole === "employee" && loan.created_by === currentUser?.id);
        
        if (canSeeApproved) {
          events.push({
            id: `loan-approved-${loan.id}`,
            date: approvedDate,
            type: "loan_approved",
            status: "success",
            title: `✅ Empréstimo Aprovado — ${clientName}`,
            description: `Valor: ${fmt(loan.value)} | Aprovação autorizada`,
            amount: Number(loan.value) || 0,
            color: "green",
            link: "/emprestimos",
          });
        }
      }

      // Cancelled/Rejected requisition result (for the employee who created it)
      // TODO: After migration, use loan.rejected_at for the date. For now, use loan.updated_at
      if (loan.status === "cancelled") {
        const rejectedDate = loan.updated_at ? loan.updated_at.split("T")[0] : new Date().toISOString().split("T")[0];
        const clientName = getClientName(loan.client);
        
        // Show to: creator (if employee), or admin/supervisor (if viewing others)
        const canSeeRejected = userRole === "admin" || userRole === "supervisor" || 
                               (userRole === "employee" && loan.created_by === currentUser?.id);
        
        if (canSeeRejected) {
          events.push({
            id: `loan-rejected-${loan.id}`,
            date: rejectedDate,
            type: "loan_rejected",
            status: "error",
            title: `❌ Requisição Cancelada — ${clientName}`,
            description: `Motivo: ${loan.rejection_reason || "Rejeitado pelo administrador"}`,
            amount: Number(loan.value) || 0,
            color: "red",
            link: "/emprestimos",
          });
        }
      }
    });

    // 2. Client registrations (for all users, but filtered by access)
    accessibleClients.forEach((client) => {
      if (!client.created_at) return;
      const date = client.created_at.split("T")[0];
      events.push({
        id: `client-${client.id}`,
        date,
        type: "client",
        status: "info",
        title: `Cliente cadastrado: ${client.name}`,
        description: client.phone || client.email || "",
        color: "blue",
        link: "/clientes",
      });
    });

    // 3. Transactions (only for admins, not employees)
    if (userRole !== "employee") {
      transactions.forEach((tx) => {
        if (!tx.date) return;
        events.push({
          id: `tx-${tx.id}`,
          date: tx.date,
          type: "transaction",
          status: tx.type === "income" ? "income" : "expense",
          title: `${tx.type === "income" ? "Receita" : "Despesa"}: ${tx.description || "—"}`,
          description: tx.category || "",
          amount: Number(tx.amount) || 0,
          color: tx.type === "income" ? "green" : "red",
          link: "/financeiro",
        });
      });
    }

    // 4. Employee admissions (only for admins, not employees)
    if (userRole !== "employee") {
      employees.forEach((emp) => {
        if (!emp.admission) return;
        events.push({
          id: `emp-${emp.id}`,
          date: emp.admission,
          type: "employee",
          status: "info",
          title: `Admissão: ${emp.name}`,
          description: emp.role || "",
          color: "blue",
          link: "/funcionarios",
        });
      });
    }

    return events;
  }, [accessibleLoans, accessibleClients, transactions, employees, userRole, loans, currentUser]);

  // Filter events based on selected filter
  const filteredEvents = useMemo(() => {
    if (eventFilter === "all") return allEvents;
    return allEvents.filter((ev) => ev.type === eventFilter);
  }, [allEvents, eventFilter]);

  // Get next upcoming events (next 7 days)
  const nextEvents = useMemo(() => {
    const upcoming = filteredEvents
      .filter((ev) => new Date(ev.date + "T00:00:00") >= today)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5);
    return upcoming;
  }, [filteredEvents, today]);

  // Get event summary (today)
  const todayEvents = useMemo(() => {
    return filteredEvents.filter(
      (ev) =>
        new Date(ev.date + "T00:00:00").toDateString() === today.toDateString(),
    );
  }, [filteredEvents, today]);

  // Get event summary for today by type
  const todaySummary = useMemo(() => {
    const summary = {
      total: todayEvents.length,
      paid: 0,
      overdue: 0,
      due: 0,
      income: 0,
      expense: 0,
    };
    todayEvents.forEach((ev) => {
      if (ev.status === "paid") summary.paid++;
      else if (ev.status === "overdue") summary.overdue++;
      else if (ev.status === "due") summary.due++;
      if (ev.status === "income") summary.income++;
      if (ev.status === "expense") summary.expense++;
    });
    return summary;
  }, [todayEvents]);

  // Group events by date string
  const eventsByDate = useMemo(() => {
    const map = {};
    filteredEvents.forEach((ev) => {
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    });
    return map;
  }, [allEvents]);

  const eventsForDay = (date) => eventsByDate[toDateKey(date)] || [];

  const dotsForDay = (date) => {
    const evs = eventsForDay(date);
    const colors = [...new Set(evs.map((e) => e.color))];
    return colors;
  };

  // Calendar grid (month view)
  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevDays = new Date(year, month, 0).getDate();

    const days = [];
    for (let i = firstDay; i > 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevDays - i + 1),
        isCurrentMonth: false,
      });
    }
    for (let i = 1; i <= totalDays; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    return days;
  }, [currentDate]);

  // Week days for week view
  const weekDays = useMemo(() => {
    const start = new Date(currentDate);
    start.setDate(currentDate.getDate() - currentDate.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [currentDate]);

  const goToPrev = () => {
    if (viewMode === "month") {
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
      );
    } else if (viewMode === "week") {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 1);
      setCurrentDate(d);
    }
  };

  const goToNext = () => {
    if (viewMode === "month") {
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
      );
    } else if (viewMode === "week") {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 1);
      setCurrentDate(d);
    }
  };

  const goToToday = () => setCurrentDate(new Date());

  const handleDayClick = (date) => {
    setSelectedDay(date);
  };

  const getHeaderTitle = () => {
    if (viewMode === "month") {
      return currentDate.toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      });
    } else if (viewMode === "week") {
      const s = weekDays[0];
      const e = weekDays[6];
      return `${s.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })} — ${e.toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" })}`;
    } else {
      return currentDate.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
  };

  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="page active">
      <div className="page-header">
        <div>
          <h2>Agenda</h2>
          <p className="page-desc">Calendário de vencimentos e compromissos</p>
        </div>
      </div>

      {/* Controls */}
      <div
        className="card"
        style={{
          padding: "12px 16px",
          marginBottom: 16,
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div
          className="view-toggle"
          style={{
            display: "flex",
            gap: 8,
            backgroundColor: "var(--bg-secondary)",
            padding: "6px",
            borderRadius: "8px",
          }}
        >
          {[
            { key: "month", label: "Mês", icon: "📅" },
            { key: "week", label: "Semana", icon: "📆" },
            { key: "day", label: "Dia", icon: "📋" },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              className={`view-toggle-btn${viewMode === key ? " active" : ""}`}
              onClick={() => setViewMode(key)}
              style={{
                padding: "8px 16px",
                border:
                  viewMode === key
                    ? "2px solid var(--gold)"
                    : "2px solid transparent",
                backgroundColor:
                  viewMode === key ? "var(--bg-primary)" : "transparent",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: viewMode === key ? 600 : 500,
                fontSize: "0.9rem",
                color: viewMode === key ? "var(--gold)" : "var(--text)",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
              onMouseEnter={(e) => {
                if (viewMode !== key) {
                  e.currentTarget.style.backgroundColor =
                    "rgba(255, 165, 0, 0.1)";
                }
              }}
              onMouseLeave={(e) => {
                if (viewMode !== key) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              {icon} {label}
            </button>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flex: 1,
            justifyContent: "center",
          }}
        >
          <button
            className="btn-icon"
            onClick={goToPrev}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "8px",
              border: "2px solid var(--border)",
              backgroundColor: "var(--bg-secondary)",
              cursor: "pointer",
              fontSize: "1.2rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--gold)";
              e.currentTarget.style.backgroundColor = "rgba(255, 165, 0, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
            }}
          >
            ◀
          </button>
          <span
            style={{
              fontWeight: 700,
              fontSize: "1.15rem",
              minWidth: 250,
              textAlign: "center",
              color: "var(--text)",
              textTransform: "capitalize",
            }}
          >
            {getHeaderTitle()}
          </span>
          <button
            className="btn-icon"
            onClick={goToNext}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "8px",
              border: "2px solid var(--border)",
              backgroundColor: "var(--bg-secondary)",
              cursor: "pointer",
              fontSize: "1.2rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--gold)";
              e.currentTarget.style.backgroundColor = "rgba(255, 165, 0, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
            }}
          >
            ▶
          </button>
        </div>
        <button
          className="btn btn-outline btn-sm"
          onClick={goToToday}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            border: "2px solid var(--gold)",
            backgroundColor: "transparent",
            color: "var(--gold)",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s ease",
            fontSize: "0.9rem",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--gold)";
            e.currentTarget.style.color = "var(--bg-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "var(--gold)";
          }}
        >
          📌 Hoje
        </button>
      </div>

      {/* KPI Summary */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div
          className="card"
          style={{
            padding: "12px 16px",
            backgroundColor: "var(--bg-secondary)",
          }}
        >
          <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
            Hoje
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 700, marginTop: 4 }}>
            {todayEvents.length}
          </div>
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--text-dim)",
              marginTop: 4,
            }}
          >
            {todayEvents.length === 1 ? "evento" : "eventos"}
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: "12px 16px",
            backgroundColor: "var(--bg-secondary)",
          }}
        >
          <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
            Próximos 7 dias
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 700, marginTop: 4 }}>
            {nextEvents.length}
          </div>
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--text-dim)",
              marginTop: 4,
            }}
          >
            próximos eventos
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: "12px 16px",
            backgroundColor: "var(--bg-secondary)",
          }}
        >
          <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
            Total
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 700, marginTop: 4 }}>
            {filteredEvents.length}
          </div>
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--text-dim)",
              marginTop: 4,
            }}
          >
            eventos registrados
          </div>
        </div>
      </div>

      {/* Event Filters */}
      <div
        className="card"
        style={{
          padding: "12px 16px",
          marginBottom: 16,
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: "0.85rem",
            fontWeight: 600,
            color: "var(--text-dim)",
          }}
        >
          Filtrar:
        </span>
        {[
          { key: "all", label: "Todos", icon: "📋" },
          { key: "installment", label: "Parcelas", icon: "💳" },
          ...(userRole !== "employee" ? [
            { key: "transaction", label: "Transações", icon: "💰" },
          ] : []),
          { key: "client", label: "Clientes", icon: "👤" },
          { key: "loan_alert", label: "Req. Pend.", icon: "⏳" },
          { key: "loan_approved", label: "Aprovados", icon: "✅" },
          { key: "loan_rejected", label: "Cancelados", icon: "❌" },
          ...(userRole !== "employee" ? [
            { key: "employee", label: "Funcion.", icon: "👔" },
          ] : []),
        ].map(({ key, label, icon }) => (
          <button
            key={key}
            className={`btn btn-sm${eventFilter === key ? " btn-gold" : " btn-outline"}`}
            onClick={() => setEventFilter(key)}
            style={{ fontSize: "0.8rem" }}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Next Events Preview */}
      {nextEvents.length > 0 && (
        <div className="card" style={{ marginBottom: 16, padding: "16px" }}>
          <h3 style={{ marginBottom: 12, fontSize: "1rem", fontWeight: 600 }}>
            Próximos Eventos
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
              gap: 12,
            }}
          >
            {nextEvents.map((ev) => (
              <div
                key={ev.id}
                className={`card`}
                style={{
                  padding: "12px",
                  background: `linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)`,
                  borderLeft: `4px solid var(--${ev.color})`,
                  cursor: "pointer",
                  transition: "transform 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "translateY(-2px)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "translateY(0)")
                }
                onClick={() => navigate(ev.link)}
              >
                <div style={{ display: "flex", gap: 8, alignItems: "start" }}>
                  <span style={{ fontSize: "1.5rem", minWidth: "1.5rem" }}>
                    {eventIcon(ev.type)}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        marginBottom: 4,
                        wordBreak: "break-word",
                      }}
                    >
                      {ev.title}
                    </div>
                    {ev.description && (
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--text-dim)",
                          marginBottom: 4,
                        }}
                      >
                        {ev.description}
                      </div>
                    )}
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: `var(--${ev.color})`,
                        fontWeight: 600,
                      }}
                    >
                      {new Date(ev.date + "T00:00:00").toLocaleDateString(
                        "pt-BR",
                        {
                          weekday: "short",
                          day: "2-digit",
                          month: "2-digit",
                        },
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal com eventos pequeninos ao clicar no dia */}
      {selectedDay && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
          }}
          onClick={() => setSelectedDay(null)}
        >
          <div
            className="card"
            style={{
              backgroundColor: "var(--bg-secondary)",
              padding: "20px",
              borderRadius: "12px",
              maxHeight: "80vh",
              maxWidth: "500px",
              width: "100%",
              overflowY: "auto",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header do modal */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
                paddingBottom: "12px",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>
                {selectedDay.toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </h3>
              <button
                onClick={() => setSelectedDay(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  color: "var(--text-dim)",
                  padding: "0",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✕
              </button>
            </div>

            {/* Eventos pequeninos */}
            {(() => {
              const evs = eventsForDay(selectedDay);
              if (evs.length === 0) {
                return (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "24px",
                      color: "var(--text-dim)",
                    }}
                  >
                    <div style={{ fontSize: "2rem", marginBottom: 8 }}>📭</div>
                    Nenhum evento para este dia
                  </div>
                );
              }
              return (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {evs.map((ev) => (
                    <div
                      key={ev.id}
                      style={{
                        padding: "10px 12px",
                        backgroundColor: "var(--bg-primary)",
                        borderLeft: `3px solid var(--${ev.color})`,
                        borderRadius: "6px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        display: "flex",
                        gap: 8,
                        alignItems: "flex-start",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "rgba(255, 165, 0, 0.05)";
                        e.currentTarget.style.transform = "translateX(4px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "var(--bg-primary)";
                        e.currentTarget.style.transform = "translateX(0)";
                      }}
                      onClick={() => {
                        setSelectedDay(null);
                        navigate(ev.link);
                      }}
                    >
                      <span style={{ fontSize: "0.9rem", minWidth: "1.2rem" }}>
                        {eventIcon(ev.type)}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            marginBottom: 2,
                            lineHeight: "1.3",
                            wordBreak: "break-word",
                          }}
                        >
                          {ev.title}
                        </div>
                        {ev.description && (
                          <div
                            style={{
                              fontSize: "0.7rem",
                              color: "var(--text-dim)",
                            }}
                          >
                            {ev.description}
                          </div>
                        )}
                        {ev.amount != null && ev.amount > 0 && (
                          <div
                            style={{
                              fontSize: "0.7rem",
                              color: `var(--${ev.color})`,
                              fontWeight: 600,
                              marginTop: 2,
                            }}
                          >
                            {fmt(ev.amount)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Month view */}
      {viewMode === "month" && (
        <div className="card">
          <div className="calendar-grid">
            {dayNames.map((name) => (
              <div key={name} className="cal-day-header">
                {name}
              </div>
            ))}
            {daysInMonth.map((day, index) => {
              const isToday = day.date.toDateString() === today.toDateString();
              const dots = dotsForDay(day.date);
              const evs = eventsForDay(day.date);
              return (
                <div
                  key={index}
                  className={`cal-day${day.isCurrentMonth ? "" : " other-month"}${isToday ? " today" : ""}${evs.length > 0 ? " has-event" : ""}`}
                  onClick={() => day.isCurrentMonth && handleDayClick(day.date)}
                  style={{
                    cursor: day.isCurrentMonth ? "pointer" : "default",
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
                  <span>{day.date.getDate()}</span>
                  {dots.length > 0 && (
                    <div className="event-dots">
                      {dots.map((color) => (
                        <span
                          key={color}
                          className={`event-dot event-dot-${color}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {/* Legend */}
          <div
            style={{
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
              padding: "12px 16px",
              borderTop: "1px solid var(--border)",
              fontSize: "0.8rem",
              color: "var(--text-dim)",
            }}
          >
            <span>
              <span
                className="event-dot event-dot-green"
                style={{
                  display: "inline-block",
                  verticalAlign: "middle",
                  marginRight: 4,
                }}
              />{" "}
              Pago
            </span>
            <span>
              <span
                className="event-dot event-dot-red"
                style={{
                  display: "inline-block",
                  verticalAlign: "middle",
                  marginRight: 4,
                }}
              />{" "}
              Atrasado
            </span>
            <span>
              <span
                className="event-dot event-dot-blue"
                style={{
                  display: "inline-block",
                  verticalAlign: "middle",
                  marginRight: 4,
                }}
              />{" "}
              A vencer / Info
            </span>
            <span>
              <span
                className="event-dot event-dot-gold"
                style={{
                  display: "inline-block",
                  verticalAlign: "middle",
                  marginRight: 4,
                }}
              />{" "}
              Venda
            </span>
          </div>
        </div>
      )}

      {/* Week view */}
      {viewMode === "week" && (
        <div className="card">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 12,
              padding: "16px",
            }}
          >
            {weekDays.map((d, idx) => {
              const isToday = d.toDateString() === today.toDateString();
              const evs = eventsForDay(d);
              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: isToday
                      ? "rgba(255, 165, 0, 0.1)"
                      : "var(--bg-primary)",
                    border: isToday
                      ? "2px solid var(--gold)"
                      : "1px solid var(--border)",
                    borderRadius: "8px",
                    padding: "12px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    minHeight: "180px",
                    display: "flex",
                    flexDirection: "column",
                  }}
                  onClick={() => handleDayClick(d)}
                  onMouseEnter={(e) => {
                    if (!isToday) {
                      e.currentTarget.style.borderColor = "var(--gold)";
                      e.currentTarget.style.backgroundColor =
                        "rgba(255, 165, 0, 0.05)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isToday) {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.backgroundColor =
                        "var(--bg-primary)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }
                  }}
                >
                  <div style={{ marginBottom: 12 }}>
                    <div
                      style={{
                        fontSize: "0.7rem",
                        color: "var(--text-dim)",
                        textTransform: "uppercase",
                        fontWeight: 600,
                        marginBottom: 4,
                      }}
                    >
                      {dayNames[d.getDay()]}
                    </div>
                    <div
                      style={{
                        fontWeight: isToday ? 800 : 700,
                        color: isToday ? "var(--gold)" : "var(--text)",
                        fontSize: "1.4rem",
                      }}
                    >
                      {d.getDate()}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      flex: 1,
                      overflowY: "auto",
                    }}
                  >
                    {evs.slice(0, 5).map((ev) => (
                      <div
                        key={ev.id}
                        style={{
                          padding: "8px 10px",
                          backgroundColor: `rgba(0, 0, 0, 0.1)`,
                          borderLeft: `3px solid var(--${ev.color})`,
                          borderRadius: "4px",
                          fontSize: "0.7rem",
                          color: "var(--text)",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          display: "flex",
                          gap: 4,
                          alignItems: "flex-start",
                          lineHeight: "1.2",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(ev.link);
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = `var(--${ev.color})`;
                          e.currentTarget.style.color = "var(--bg-primary)";
                          e.currentTarget.style.borderLeftColor =
                            "var(--bg-primary)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = `rgba(0, 0, 0, 0.1)`;
                          e.currentTarget.style.color = "var(--text)";
                          e.currentTarget.style.borderLeftColor = `var(--${ev.color})`;
                        }}
                        title={ev.title}
                      >
                        <span style={{ minWidth: "1rem", fontSize: "0.8rem" }}>
                          {eventIcon(ev.type)}
                        </span>
                        <span style={{ flex: 1, wordBreak: "break-word" }}>
                          {ev.title.length > 20
                            ? ev.title.slice(0, 20) + "…"
                            : ev.title}
                        </span>
                      </div>
                    ))}
                    {evs.length > 5 && (
                      <div
                        style={{
                          fontSize: "0.65rem",
                          color: "var(--gold)",
                          fontWeight: 600,
                          padding: "4px 8px",
                          textAlign: "center",
                          backgroundColor: "rgba(255, 165, 0, 0.1)",
                          borderRadius: "4px",
                          marginTop: 4,
                        }}
                      >
                        +{evs.length - 5} mais
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day view */}
      {viewMode === "day" && (
        <div className="card">
          <div
            style={{
              padding: "20px",
              backgroundColor: "var(--bg-primary)",
            }}
          >
            {/* Day header */}
            <div
              style={{
                marginBottom: 24,
                paddingBottom: 16,
                borderBottom: "2px solid var(--border)",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "var(--text)",
                  textTransform: "capitalize",
                }}
              >
                {currentDate.toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </h2>
              <div
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-dim)",
                  marginTop: 6,
                }}
              >
                {(() => {
                  const evs = eventsForDay(currentDate);
                  return `${evs.length} ${evs.length === 1 ? "evento" : "eventos"} registrado${evs.length === 1 ? "" : "s"}`;
                })()}
              </div>
            </div>

            {(() => {
              const evs = eventsForDay(currentDate);
              if (evs.length === 0) {
                return (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "60px 40px",
                      color: "var(--text-dim)",
                    }}
                  >
                    <div style={{ fontSize: "3rem", marginBottom: 16 }}>📭</div>
                    <div style={{ fontSize: "1rem", fontWeight: 600 }}>
                      Nenhuma atividade
                    </div>
                    <div style={{ fontSize: "0.85rem", marginTop: 8 }}>
                      Nenhuma atividade registrada para este dia.
                    </div>
                  </div>
                );
              }
              return (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: 16,
                  }}
                >
                  {evs.map((ev) => (
                    <div
                      key={ev.id}
                      style={{
                        padding: "16px",
                        backgroundColor: "var(--bg-secondary)",
                        border: `2px solid var(--${ev.color})`,
                        borderRadius: "8px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                      onClick={() => navigate(ev.link)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = `rgba(255, 165, 0, 0.08)`;
                        e.currentTarget.style.transform = "translateY(-4px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "var(--bg-secondary)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                      title="Clique para ir à página"
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: 12,
                          alignItems: "flex-start",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "1.8rem",
                            minWidth: "2rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: `var(--${ev.color})`,
                          }}
                        >
                          {eventIcon(ev.type)}
                        </span>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: "0.95rem",
                              fontWeight: 700,
                              color: "var(--text)",
                              marginBottom: 4,
                              lineHeight: "1.3",
                            }}
                          >
                            {ev.title}
                          </div>
                          {ev.description && (
                            <div
                              style={{
                                fontSize: "0.8rem",
                                color: "var(--text-dim)",
                                lineHeight: "1.3",
                              }}
                            >
                              {ev.description}
                            </div>
                          )}
                        </div>
                      </div>

                      {ev.amount != null && ev.amount > 0 && (
                        <div
                          style={{
                            paddingTop: 8,
                            borderTop: `1px solid var(--border)`,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--text-dim)",
                            }}
                          >
                            Valor
                          </span>
                          <span
                            style={{
                              fontSize: "1rem",
                              fontWeight: 700,
                              color: `var(--${ev.color})`,
                            }}
                          >
                            {fmt(ev.amount)}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

export default Agenda;
