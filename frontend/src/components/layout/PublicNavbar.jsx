import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Menu, X, LogIn, LayoutDashboard, Phone, Heart, Info } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../ui/Button";

export const PublicNavbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, role } = useAuth();
  const navigate = useNavigate();

  const getDashboardPath = () => {
    const r = (role || "").toLowerCase();
    if (r === "officer" || r === "responder") return "/officer/dashboard";
    if (r === "ngo") return "/ngo/dashboard";
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
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#FFFFFF" }}>
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

        <nav style={{ display: "none", alignItems: "center", gap: "1.5rem" }} className="desktop-nav">
          <Link to="/" style={{ color: "rgba(255,255,255,0.9)", fontWeight: 500, fontSize: "0.9375rem" }}>
            Home
          </Link>
          <Link to="/accidents/report" style={{ color: "var(--sage)", fontWeight: 700, fontSize: "0.9375rem" }}>
            Report Incident
          </Link>
          <Link to="/emergency" style={{ color: "#FCA5A5", fontWeight: 700, fontSize: "0.9375rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <Phone size={14} /> Emergency Numbers
          </Link>
          <Link to="/ngos" style={{ color: "rgba(255,255,255,0.9)", fontWeight: 500, fontSize: "0.9375rem" }}>
            NGO Rescue Directory
          </Link>
          <Link to="/updates" style={{ color: "rgba(255,255,255,0.9)", fontWeight: 500, fontSize: "0.9375rem" }}>
            Community Updates
          </Link>
          <Link to="/risks" style={{ color: "rgba(255,255,255,0.9)", fontWeight: 500, fontSize: "0.9375rem" }}>
            Risks
          </Link>
        </nav>

        <div style={{ display: "none", alignItems: "center", gap: "0.875rem" }} className="desktop-nav">
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
              <Link to="/login">
                <Button variant="ghost" size="sm" icon={LogIn} style={{ color: "#FFFFFF" }}>
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">
                  Register
                </Button>
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            background: "none",
            border: "none",
            color: "#FFFFFF",
            cursor: "pointer",
            padding: "0.5rem",
          }}
          className="mobile-toggle"
        >
          {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div
          style={{
            backgroundColor: "#123023",
            padding: "1.25rem 1.5rem",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <Link to="/" onClick={() => setMobileMenuOpen(false)} style={{ color: "#FFFFFF", fontWeight: 500 }}>
            Home
          </Link>
          <Link to="/accidents/report" onClick={() => setMobileMenuOpen(false)} style={{ color: "var(--sage)", fontWeight: 700 }}>
            Report Incident / Accident
          </Link>
          <Link to="/emergency" onClick={() => setMobileMenuOpen(false)} style={{ color: "#FCA5A5", fontWeight: 700 }}>
            Emergency Numbers (112, 108)
          </Link>
          <Link to="/ngos" onClick={() => setMobileMenuOpen(false)} style={{ color: "#FFFFFF", fontWeight: 500 }}>
            NGO Rescue Directory
          </Link>
          <Link to="/updates" onClick={() => setMobileMenuOpen(false)} style={{ color: "#FFFFFF", fontWeight: 500 }}>
            Community Safety Updates
          </Link>
          <Link to="/risks" onClick={() => setMobileMenuOpen(false)} style={{ color: "#FFFFFF", fontWeight: 500 }}>
            Explore Risk Zones
          </Link>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {isAuthenticated ? (
              <Button variant="secondary" onClick={() => { navigate(getDashboardPath()); setMobileMenuOpen(false); }}>
                Go to Dashboard ({role})
              </Button>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" style={{ width: "100%", color: "#FFFFFF", borderColor: "rgba(255,255,255,0.3)" }}>
                    Sign In
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" style={{ width: "100%" }}>
                    Create Account
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (min-width: 900px) {
          .desktop-nav { display: flex !important; }
          .mobile-toggle { display: none !important; }
        }
      `}</style>
    </header>
  );
};
