import React from "react";
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";

export const AlertMessage = ({ type = "error", title, message, className = "" }) => {
  const styles = {
    error: { bg: "#FEE2E2", border: "#FCA5A5", text: "#991B1B", icon: AlertCircle },
    success: { bg: "#DCFCE7", border: "#86EFAC", text: "#166534", icon: CheckCircle2 },
    warning: { bg: "#FEF3C7", border: "#FDE047", text: "#92400E", icon: AlertTriangle },
    info: { bg: "#DBEAFE", border: "#93C5FD", text: "#1E40AF", icon: Info },
  };

  const current = styles[type] || styles.info;
  const Icon = current.icon;

  return (
    <div
      className={className}
      style={{
        backgroundColor: current.bg,
        borderColor: current.border,
        color: current.text,
        borderWidth: "1px",
        borderStyle: "solid",
        borderRadius: "10px",
        padding: "0.875rem 1.25rem",
        display: "flex",
        alignItems: "flex-start",
        gap: "0.75rem",
        marginBottom: "1rem",
        fontSize: "0.9375rem",
      }}
    >
      <Icon size={20} style={{ flexShrink: 0, marginTop: "2px" }} />
      <div>
        {title && <strong style={{ display: "block", marginBottom: "0.25rem" }}>{title}</strong>}
        {message}
      </div>
    </div>
  );
};
