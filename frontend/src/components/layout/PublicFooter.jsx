import React from "react";
import { Link } from "react-router-dom";
import { Shield } from "lucide-react";

export const PublicFooter = () => {
  return (
    <footer
      style={{
        backgroundColor: "var(--deep-forest)",
        color: "rgba(255,255,255,0.8)",
        padding: "3.5rem 1.5rem 2rem",
        marginTop: "auto",
        borderTop: "3px solid var(--primary-green)",
      }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "3rem",
            marginBottom: "2.5rem",
          }}
        >
          <div style={{ maxWidth: "420px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#FFFFFF", marginBottom: "0.875rem" }}>
              <div
                style={{
                  background: "linear-gradient(135deg, #276749 0%, #173D2D 100%)",
                  padding: "0.5rem",
                  borderRadius: "10px",
                  display: "flex",
                  border: "1px solid rgba(52, 211, 153, 0.3)",
                }}
              >
                <Shield size={24} style={{ color: "#34D399" }} />
              </div>
              <span style={{ fontFamily: "var(--font-heading)", fontSize: "1.375rem", fontWeight: 800, letterSpacing: "-0.01em" }}>
                THERAPHYLAX
              </span>
            </div>
            <p style={{ fontSize: "0.9375rem", lineHeight: 1.65, color: "rgba(255,255,255,0.72)", margin: 0 }}>
              Risk Monitoring and Human-Wildlife Conflict Intelligence Platform. Empowering communities & authorities.
            </p>
          </div>

          <div>
            <h4 style={{ color: "#FFFFFF", marginBottom: "1rem", fontSize: "1rem", fontWeight: 700, letterSpacing: "0.02em" }}>
              Platform Navigation
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.9rem" }}>
              <li>
                <Link to="/" style={{ color: "rgba(255,255,255,0.75)", textDecoration: "none", transition: "color 0.2s" }}>
                  Home Overview
                </Link>
              </li>
              <li>
                <Link to="/risks" style={{ color: "rgba(255,255,255,0.75)", textDecoration: "none", transition: "color 0.2s" }}>
                  Explore Regional Risks
                </Link>
              </li>
              <li>
                <Link to="/alerts" style={{ color: "rgba(255,255,255,0.75)", textDecoration: "none", transition: "color 0.2s" }}>
                  Active Safety Alerts
                </Link>
              </li>
              <li>
                <Link to="/updates" style={{ color: "#34D399", fontWeight: 600, textDecoration: "none" }}>
                  Public Safety Updates
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: "#FFFFFF", marginBottom: "1rem", fontSize: "1rem", fontWeight: 700, letterSpacing: "0.02em" }}>
              Portals & Access
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.9rem" }}>
              <li>
                <Link to="/login" style={{ color: "rgba(255,255,255,0.75)", textDecoration: "none" }}>
                  Citizen Sign In
                </Link>
              </li>
              <li>
                <Link to="/register" style={{ color: "rgba(255,255,255,0.75)", textDecoration: "none" }}>
                  Citizen Sign Up
                </Link>
              </li>
              <li>
                <Link to="/officer/login" style={{ color: "#FBBF24", fontWeight: 700, textDecoration: "none" }}>
                  Forest Officer Portal
                </Link>
              </li>
              <li>
                <Link to="/officer/register" style={{ color: "rgba(255,255,255,0.75)", textDecoration: "none" }}>
                  Officer Enrollment
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.1)",
            paddingTop: "1.5rem",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            fontSize: "0.8125rem",
            color: "rgba(255,255,255,0.6)",
          }}
        >
          <p>© {new Date().getFullYear()} THERAPHYLAX. All rights reserved.</p>
          <p>Built for Community Safety & Forest Protection</p>
        </div>
      </div>
    </footer>
  );
};
