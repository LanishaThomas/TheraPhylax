import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, ShieldCheck, Bell } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export const Topbar = ({ onMobileToggle }) => {
  const { user, cognitoActive } = useAuth();
  const location = useLocation();

  const getPageTitle = (path) => {
    if (path === "/dashboard") return "User Dashboard";
    if (path === "/reports/new") return "Report an Incident";
    if (path === "/reports") return "My Incident Reports";
    if (path.startsWith("/reports/")) return "Incident Detail Overview";
    if (path === "/alerts") return "Disaster Alerts & Safety Notices";
    if (path === "/risks") return "Disaster Risk Intelligence";
    if (path === "/profile") return "Profile & Account Settings";
    if (path === "/responder") return "Responder Incident Control";
    if (path === "/admin") return "Administrator Management Console";
    return "TheraPhylax Workspace";
  };

  return (
    <header
      style={{
        height: "64px",
        backgroundColor: "#FFFFFF",
        borderBottom: "1px solid var(--border-color)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 1.5rem",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <button
          onClick={onMobileToggle}
          style={{
            background: "none",
            border: "none",
            color: "var(--charcoal)",
            cursor: "pointer",
            padding: "0.375rem",
          }}
          className="lg-hidden"
        >
          <Menu size={24} />
        </button>

        <div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "var(--deep-forest)" }}>
            {getPageTitle(location.pathname)}
          </h1>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {cognitoActive && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.75rem", color: "var(--primary-green)", backgroundColor: "var(--sage-light)", padding: "0.25rem 0.625rem", borderRadius: "9999px", fontWeight: 600 }}>
            <ShieldCheck size={14} />
            <span>Cognito Secure</span>
          </div>
        )}

        <Link to="/alerts" style={{ color: "var(--muted-text)", padding: "0.5rem", display: "flex", alignItems: "center" }}>
          <Bell size={20} />
        </Link>

        <Link
          to="/profile"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.625rem",
            padding: "0.375rem 0.75rem",
            borderRadius: "9999px",
            backgroundColor: "var(--bg-warm)",
            border: "1px solid var(--border-color)",
          }}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              backgroundColor: "var(--primary-green)",
              color: "#FFFFFF",
              display: "grid",
              placeItems: "center",
              fontSize: "0.8125rem",
              fontWeight: 700,
            }}
          >
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--deep-forest)" }}>
            {user?.name || "Profile"}
          </span>
        </Link>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .lg-hidden { display: none !important; }
        }
      `}</style>
    </header>
  );
};
