// src/pages/Agenda.jsx
import React, { useState, useMemo } from "react";

function Agenda() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];
    for (let i = firstDayOfMonth; i > 0; i--) {
      days.push({ day: daysInPrevMonth - i + 1, isCurrentMonth: false, isToday: false, hasEvent: false });
    }
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      const dayDate = new Date(year, month, i);
      const isToday = dayDate.toDateString() === new Date().toDateString();
      days.push({ day: i, isCurrentMonth: true, isToday, hasEvent: false });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, isCurrentMonth: false, isToday: false, hasEvent: false });
    }
    return days;
  }, [currentDate]);

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
