import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, LogIn, LayoutDashboard } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../ui/Button";

export const PublicNavbar = () => {
  const { isAuthenticated, user, role } = useAuth();
  const navigate = useNavigate();

  const getDashboardPath = () => {
    const r = (role || "").toLowerCase();
    if (r === "officer" || r === "responder") return "/officer/dashboard";
    if (r === "admin") return "/admin";
    return "/dashboard";
  };

  return (
    <header
      style={{
        backgroundColor: "var(--deep-forest)",
        color: "#FFFFFF",
        position: "sticky",
        top: 0,
        zIndex: 50,
        boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0.875rem 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* LOGO & BRAND */}
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#FFFFFF", textDecoration: "none" }}>
          <div
            style={{
              backgroundColor: "var(--primary-green)",
              padding: "0.5rem",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Shield size={24} style={{ color: "#FFFFFF" }} />
          </div>
          <div>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: "1.375rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
              THERAPHYLAX
            </span>
            <span style={{ display: "block", fontSize: "0.6875rem", color: "var(--sage)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
              Disaster Risk & Emergency Network
            </span>
          </div>
        </Link>

        {/* ONLY SEPARATE SIGN IN & SIGN UP BUTTONS */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
          {isAuthenticated ? (
            <Button
              variant="secondary"
              size="sm"
              icon={LayoutDashboard}
              onClick={() => navigate(getDashboardPath())}
            >
              Portal ({role}: {user?.name?.split(" ")[0] || "User"})
            </Button>
          ) : (
            <>
              <Link to="/login" style={{ textDecoration: "none" }}>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={LogIn}
                  style={{
                    color: "#FFFFFF",
                    border: "1px solid rgba(255, 255, 255, 0.25)",
                    borderRadius: "8px",
                    fontWeight: 600,
                  }}
                >
                  Sign In
                </Button>
              </Link>
              <Link to="/register" style={{ textDecoration: "none" }}>
                <Button
                  variant="primary"
                  size="sm"
                  style={{
                    backgroundColor: "var(--primary-green)",
                    borderColor: "var(--primary-green)",
                    borderRadius: "8px",
                    fontWeight: 700,
                  }}
                >
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
