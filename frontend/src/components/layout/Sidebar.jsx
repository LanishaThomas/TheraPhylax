import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Shield,
  LayoutDashboard,
  FilePlus,
  FileText,
  Radio,
  MapPin,
  Send,
  AlertTriangle,
  User,
  LogOut,
  ChevronRight,
  Newspaper,
  Compass,
  Settings,
  ShieldAlert,
  Bell,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { Badge } from "../ui/Badge";

export const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const userRole = (role || "Citizen").toLowerCase();

  // Define role-specific nav items (Forest Officers, Responders, Citizens, Admins)
  let navItems = [];

  if (userRole === "officer" || userRole === "responder") {
    navItems = [
      { label: "Officer Command", path: "/officer/dashboard", icon: Radio, badge: "Officer", color: "#34D399" },
      { label: "Incident Triage", path: "/reports", icon: FileText, color: "#60A5FA" },
      { label: "Create Geofenced Alert", path: "/officer/alerts/create", icon: MapPin, color: "#F87171" },
      { label: "Geofence Notifications", path: "/notifications", icon: Bell, color: "#EF4444" },
      { label: "Targeted Geo-Alerts", path: "/alerts", icon: AlertTriangle, color: "#FBBF24" },
      { label: "Public Safety Updates", path: "/updates", icon: Compass, color: "#34D399" },
      { label: "Animal & Safety News", path: "/news", icon: Newspaper, color: "#FBBF24" },
      { label: "My Profile", path: "/profile", icon: User, color: "#9CA3AF" },
    ];
  } else if (userRole === "admin") {
    navItems = [
      { label: "Citizen Dashboard", path: "/dashboard", icon: LayoutDashboard, color: "#34D399" },
      { label: "Admin Console", path: "/admin", icon: Settings, badge: "Admin", color: "#C084FC" },
      { label: "Responder Command", path: "/responder", icon: Radio, badge: "Officer", color: "#FBBF24" },
      { label: "Geofence Notifications", path: "/notifications", icon: Bell, color: "#EF4444" },
      { label: "Report Incident / Accident", path: "/accidents/report", icon: FilePlus, color: "#F87171" },
      { label: "My Submitted Reports", path: "/accidents/my-reports", icon: FileText, color: "#60A5FA" },
      { label: "Public Safety Updates", path: "/updates", icon: Compass, color: "#34D399" },
      { label: "Publish Safety Notice", path: "/officer/updates/create", icon: Send, color: "#C084FC" },
      { label: "Active Disaster Alerts", path: "/alerts", icon: AlertTriangle, color: "#FBBF24" },
      { label: "Animal & Safety News", path: "/news", icon: Newspaper, color: "#FBBF24" },
      { label: "My Profile", path: "/profile", icon: User, color: "#9CA3AF" },
    ];
  } else {
    // Default Citizen Role (Notifications tab removed as requested; alerts and updates are available in other tabs)
    navItems = [
      { label: "Citizen Dashboard", path: "/dashboard", icon: LayoutDashboard, color: "#34D399" },
      { label: "Report Incident / Accident", path: "/accidents/report", icon: FilePlus, color: "#F87171" },
      { label: "My Submitted Reports", path: "/accidents/my-reports", icon: FileText, color: "#60A5FA" },
      { label: "Public Safety Updates", path: "/updates", icon: Compass, color: "#34D399" },
      { label: "Active Disaster Alerts", path: "/alerts", icon: AlertTriangle, color: "#FBBF24" },
      { label: "Animal & Safety News", path: "/news", icon: Newspaper, color: "#FBBF24" },
      { label: "My Profile", path: "/profile", icon: User, color: "#9CA3AF" },
    ];
  }

  return (
    <>
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 40,
          }}
          className="mobile-backdrop"
        />
      )}

      <aside
        style={{
          width: "270px",
          background: "linear-gradient(180deg, #092116 0%, #123826 50%, #17422E 100%)",
          color: "#FFFFFF",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          bottom: 0,
          left: mobileOpen ? 0 : "-270px",
          zIndex: 45,
          transition: "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: "6px 0 25px rgba(0,0,0,0.25)",
          borderRight: "1px solid rgba(167, 196, 160, 0.15)",
        }}
        className="app-sidebar"
      >
        {/* HEADER BRANDING */}
        <div
          style={{
            padding: "1.5rem 1.25rem",
            background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%)",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            alignItems: "center",
            gap: "0.875rem",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #276749 0%, #1B4D36 100%)",
              padding: "0.625rem",
              borderRadius: "12px",
              display: "flex",
              boxShadow: "0 4px 12px rgba(39, 103, 73, 0.4)",
              border: "1px solid rgba(52, 211, 153, 0.3)",
            }}
          >
            <Shield size={24} style={{ color: "#34D399" }} />
          </div>
          <div>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: "1.375rem", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.01em" }}>
              THERAPHYLAX
            </span>
            <span style={{ display: "block", fontSize: "0.6875rem", color: "#E5C07B", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.06em" }}>
              {userRole.toUpperCase()} PORTAL
            </span>
          </div>
        </div>

        {/* USER INFO BADGE */}
        <div
          style={{
            margin: "1rem 1.25rem 0.5rem",
            padding: "0.875rem 1rem",
            background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)",
            borderRadius: "14px",
            border: "1px solid rgba(255,255,255,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
            <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "#FFFFFF", margin: 0 }}>{user?.name || "User"}</p>
            <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.65)", margin: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
              {user?.email}
            </p>
          </div>
          <Badge variant={userRole === "admin" ? "critical" : userRole === "officer" || userRole === "responder" ? "high" : "pending"}>
            {role || "Citizen"}
          </Badge>
        </div>

        {/* NAVIGATION LINKS */}
        <nav style={{ flex: 1, padding: "1rem 0.875rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.375rem" }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                style={({ isActive }) => ({
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.75rem 1rem",
                  borderRadius: "12px",
                  color: isActive ? "#FFFFFF" : "rgba(255,255,255,0.8)",
                  background: isActive
                    ? "linear-gradient(135deg, #1E5E3A 0%, #134229 100%)"
                    : "transparent",
                  borderLeft: isActive ? "4px solid #34D399" : "4px solid transparent",
                  boxShadow: isActive ? "0 4px 15px rgba(30, 94, 58, 0.4)" : "none",
                  fontWeight: isActive ? 700 : 500,
                  fontSize: "0.9375rem",
                  transition: "all 0.2s ease",
                })}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                  <div
                    style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "8px",
                      backgroundColor: "rgba(255,255,255,0.08)",
                      display: "grid",
                      placeItems: "center",
                      color: item.color || "#34D399",
                    }}
                  >
                    <Icon size={17} />
                  </div>
                  <span>{item.label}</span>
                </div>
                {item.badge ? (
                  <span style={{ fontSize: "0.6875rem", backgroundColor: "rgba(255,255,255,0.18)", padding: "0.125rem 0.5rem", borderRadius: "9999px", fontWeight: 700 }}>
                    {item.badge}
                  </span>
                ) : (
                  <ChevronRight size={14} style={{ opacity: 0.35 }} />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* LOGOUT BUTTON */}
        <div style={{ padding: "1rem 1.25rem", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.625rem",
              padding: "0.75rem",
              background: "linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(185, 28, 28, 0.25) 100%)",
              color: "#FCA5A5",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "12px",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: 700,
              transition: "all 0.2s ease",
            }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <style>{`
        @media (min-width: 1024px) {
          .app-sidebar { left: 0 !important; }
          .mobile-backdrop { display: none !important; }
        }
      `}</style>
    </>
  );
};
