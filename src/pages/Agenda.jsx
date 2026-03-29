// src/pages/Agenda.jsx
import React, { useState, useEffect } from "react";
// import '../styles/Agenda.css'; // REMOVA esta linha

function Agenda() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [daysInMonth, setDaysInMonth] = useState([]);

  useEffect(() => {
    generateCalendarDays(currentDate);
  }, [currentDate]);

  const generateCalendarDays = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday, 1 = Monday...
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const newDays = [];

    // Dias do mês anterior
    for (let i = firstDayOfMonth; i > 0; i--) {
      newDays.push({
        day: daysInPrevMonth - i + 1,
        isCurrentMonth: false,
        isToday: false,
        hasEvent: false,
      });
    }

    // Dias do mês atual
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      const dayDate = new Date(year, month, i);
      const isToday = dayDate.toDateString() === new Date().toDateString();
      // Exemplo de evento: dia 10 e 20 de cada mês
      const hasEvent = i === 10 || i === 20;
      newDays.push({
        day: i,
        isCurrentMonth: true,
        isToday: isToday,
        hasEvent: hasEvent,
      });
    }

    // Dias do próximo mês para preencher a última semana
    const remainingDays = 42 - newDays.length; // 6 semanas * 7 dias
    for (let i = 1; i <= remainingDays; i++) {
      newDays.push({
        day: i,
        isCurrentMonth: false,
        isToday: false,
        hasEvent: false,
      });
    }
    setDaysInMonth(newDays);
  };

  const goToPreviousMonth = () => {
    setCurrentDate(
      (prevDate) =>
        new Date(prevDate.getFullYear(), prevDate.getMonth() - 1, 1),
    );
  };

  const goToNextMonth = () => {
    setCurrentDate(
      (prevDate) =>
        new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 1),
    );
  };

  const monthYearString = currentDate.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="page active">
      <div className="page-header">
        <div>
          <h2>Agenda</h2>
          <p className="page-desc">Calendário de vencimentos e compromissos</p>
        </div>
      </div>
      <div className="card">
        <div className="calendar-header">
          <button
            id="cal-prev"
            className="btn-icon"
            onClick={goToPreviousMonth}
          >
            ‹
          </button>
          <span id="cal-month-year">{monthYearString}</span>
          <button id="cal-next" className="btn-icon" onClick={goToNextMonth}>
            ›
          </button>
        </div>
        <div id="calendar-grid" className="calendar-grid">
          {dayNames.map((name) => (
            <div key={name} className="cal-day-header">
              {name}
            </div>
          ))}
          {daysInMonth.map((day, index) => (
            <div
              key={index}
              className={`cal-day ${day.isCurrentMonth ? "" : "other-month"} ${day.isToday ? "today" : ""} ${day.hasEvent ? "has-event" : ""}`}
            >
              {day.day}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Agenda;
