import React from "react";
import { Link } from "react-router-dom";
import { Shield, Mail, Phone, MapPin } from "lucide-react";

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
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "2.5rem",
            marginBottom: "3rem",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#FFFFFF", marginBottom: "1rem" }}>
              <Shield size={26} style={{ color: "var(--sage)" }} />
              <span style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", fontWeight: 800 }}>
                THERAPHYLAX
              </span>
            </div>
            <p style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "rgba(255,255,255,0.7)" }}>
              Disaster Reporting, Risk Monitoring, and Human-Wildlife Conflict Intelligence Platform. Empowering communities & authorities.
            </p>
          </div>

          <div>
            <h4 style={{ color: "#FFFFFF", marginBottom: "1rem", fontSize: "1rem" }}>Platform</h4>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.625rem", fontSize: "0.875rem" }}>
              <li><Link to="/" style={{ color: "rgba(255,255,255,0.75)" }}>Home Overview</Link></li>
              <li><Link to="/risks" style={{ color: "rgba(255,255,255,0.75)" }}>Explore Disaster Risks</Link></li>
              <li><Link to="/alerts" style={{ color: "rgba(255,255,255,0.75)" }}>Active Safety Alerts</Link></li>
              <li><Link to="/reports/new" style={{ color: "var(--sage)" }}>Submit Incident Report</Link></li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: "#FFFFFF", marginBottom: "1rem", fontSize: "1rem" }}>Access & Portal</h4>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.625rem", fontSize: "0.875rem" }}>
              <li><Link to="/login" style={{ color: "rgba(255,255,255,0.75)" }}>Sign In</Link></li>
              <li><Link to="/register" style={{ color: "rgba(255,255,255,0.75)" }}>Create Account</Link></li>
              <li><Link to="/dashboard" style={{ color: "rgba(255,255,255,0.75)" }}>User Dashboard</Link></li>
              <li><Link to="/responder" style={{ color: "rgba(255,255,255,0.75)" }}>Responder Portal</Link></li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: "#FFFFFF", marginBottom: "1rem", fontSize: "1rem" }}>Emergency Helpline</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.875rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Phone size={16} style={{ color: "var(--sage)" }} />
                <span>Emergency Control: 1800-425-WILD</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Mail size={16} style={{ color: "var(--sage)" }} />
                <span>support@theraphylax.gov.in</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <MapPin size={16} style={{ color: "var(--sage)" }} />
                <span>Mumbai / ap-south-1 Control HQ</span>
              </div>
            </div>
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
