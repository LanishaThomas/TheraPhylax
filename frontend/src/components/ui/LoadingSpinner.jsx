import React from "react";
import { Loader2 } from "lucide-react";

export const LoadingSpinner = ({ label = "Loading data...", fullScreen = false }) => {
  if (fullScreen) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          backgroundColor: "var(--bg-warm)",
          color: "var(--deep-forest)",
        }}
      >
        <Loader2 className="animate-spin" size={40} style={{ color: "var(--primary-green)" }} />
        <p style={{ fontWeight: 600 }}>{label}</p>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "3rem 1rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.75rem",
        color: "var(--muted-text)",
      }}
    >
      <Loader2 className="animate-spin" size={28} style={{ color: "var(--primary-green)" }} />
      <p style={{ fontSize: "0.9375rem" }}>{label}</p>
    </div>
  );
};
