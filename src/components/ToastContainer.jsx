// src/components/ToastContainer.jsx
import React from "react";
// import '../styles/ToastContainer.css'; // REMOVA esta linha

function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}

export default ToastContainer;
