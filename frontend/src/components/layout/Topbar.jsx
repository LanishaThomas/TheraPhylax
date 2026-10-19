import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  ShieldCheck,
  Bell,
  Check,
  AlertTriangle,
  Mail,
  ExternalLink,
  MapPin,
  X,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { apiService } from "../../services/api";

export const Topbar = ({ onMobileToggle }) => {
  const { user, cognitoActive } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const dropdownRef = useRef(null);

  const getPageTitle = (path) => {
    if (path === "/dashboard") return "User Dashboard";
    if (path === "/reports/new") return "Report an Incident";
    if (path === "/reports") return "Incident Queue";
    if (path.startsWith("/reports/")) return "Incident Detail Overview";
    if (path === "/alerts") return "Active Geofence Alerts";
    if (path === "/officer/alerts/create") return "Officer Geofence Alert Creator";
    if (path === "/notifications") return "Emergency Notifications & Alerts";
    if (path === "/updates") return "Public Safety Updates & Risk Geofences";
    if (path === "/risks") return "Disaster Risk Intelligence";
    if (path === "/profile") return "Profile & Account Settings";
    if (path === "/responder" || path === "/officer/dashboard") return "Officer Command Center";
    if (path === "/admin") return "Administrator Management Console";
    return "TheraPhylax Workspace";
  };

  const fetchUserNotifications = async () => {
    try {
      const email = user?.email || "";
      const res = await apiService.getNotifications(email);
      if (res && Array.isArray(res.notifications)) {
        setNotifications(res.notifications);
        setUnreadCount(res.unread_count || 0);
      }
    } catch (err) {
      console.warn("Notifications poll:", err);
    }
  };

  useEffect(() => {
    fetchUserNotifications();
    const interval = setInterval(fetchUserNotifications, 12000); // Poll every 12 seconds
    return () => clearInterval(interval);
  }, [user?.email]);

  // Click outside to close notifications dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await apiService.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.warn("Mark read failed:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiService.markAllNotificationsRead(user?.email || "");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.warn("Mark all read failed:", err);
    }
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
        zIndex: 35,
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              fontSize: "0.75rem",
              color: "var(--primary-green)",
              backgroundColor: "var(--sage-light)",
              padding: "0.25rem 0.625rem",
              borderRadius: "9999px",
              fontWeight: 600,
            }}
          >
            <ShieldCheck size={14} />
            <span>Cognito Secure</span>
          </div>
        )}

        {/* NOTIFICATION BELL WITH UNREAD BADGE & POPUP DRAWER */}
        <div style={{ position: "relative" }} ref={dropdownRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            style={{
              background: notificationsOpen ? "rgba(22, 101, 52, 0.1)" : "none",
              border: "none",
              color: unreadCount > 0 ? "#DC2626" : "var(--charcoal)",
              padding: "0.5rem",
              borderRadius: "50%",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              transition: "background 0.15s ease",
            }}
            title="Geofenced Emergency Notifications"
          >
            <Bell size={21} style={unreadCount > 0 ? { animation: "pulse 1.8s infinite" } : {}} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "2px",
                  right: "2px",
                  backgroundColor: "#DC2626",
                  color: "#FFFFFF",
                  borderRadius: "9999px",
                  padding: "0.1rem 0.35rem",
                  fontSize: "0.6875rem",
                  fontWeight: 800,
                  border: "2px solid #FFFFFF",
                  boxShadow: "0 2px 6px rgba(220, 38, 38, 0.4)",
                  minWidth: "18px",
                  textAlign: "center",
                }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* NOTIFICATION DROPDOWN DRAWER */}
          {notificationsOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                width: "380px",
                maxWidth: "92vw",
                backgroundColor: "#FFFFFF",
                borderRadius: "14px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
                border: "1.5px solid var(--border-color)",
                overflow: "hidden",
                zIndex: 50,
                display: "flex",
                flexDirection: "column",
                maxHeight: "520px",
              }}
            >
              {/* DRAWER HEADER */}
              <div
                style={{
                  padding: "0.875rem 1.125rem",
                  backgroundColor: "var(--deep-forest)",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Bell size={16} />
                  <strong style={{ fontSize: "0.9375rem" }}>Geofence Notifications</strong>
                  {unreadCount > 0 && (
                    <span
                      style={{
                        backgroundColor: "#DC2626",
                        color: "#FFFFFF",
                        fontSize: "0.6875rem",
                        fontWeight: 800,
                        padding: "0.1rem 0.45rem",
                        borderRadius: "9999px",
                      }}
                    >
                      {unreadCount} new
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      style={{
                        background: "none",
                        border: "none",
                        color: "rgba(255,255,255,0.85)",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setNotificationsOpen(false)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#FFFFFF",
                      cursor: "pointer",
                      padding: "0.2rem",
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* NOTIFICATIONS LIST CONTAINER */}
              <div style={{ overflowY: "auto", flex: 1 }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: "2.5rem 1.5rem", textAlign: "center", color: "var(--text-muted)" }}>
                    <ShieldCheck size={36} style={{ margin: "0 auto 0.5rem", color: "#10B981", opacity: 0.8 }} />
                    <strong style={{ display: "block", color: "var(--charcoal)", fontSize: "0.9375rem" }}>
                      No Active Hazard Alerts
                    </strong>
                    <span style={{ fontSize: "0.8125rem" }}>
                      Your current location has no active emergency geofence warnings.
                    </span>
                  </div>
                ) : (
                  notifications.slice(0, 8).map((notif) => {
                    const isHigh = notif.severity === "High" || notif.severity === "Critical";
                    const isMed = notif.severity === "Medium";
                    const borderColor = notif.priority_color || (isHigh ? "#EF4444" : isMed ? "#F59E0B" : "#10B981");

                    return (
                      <div
                        key={notif.id}
                        onClick={() => {
                          if (!notif.is_read) handleMarkAsRead(notif.id, { stopPropagation: () => {} });
                          navigate("/notifications");
                          setNotificationsOpen(false);
                        }}
                        style={{
                          padding: "0.875rem 1.125rem",
                          borderBottom: "1px solid var(--border-color)",
                          backgroundColor: notif.is_read ? "#FFFFFF" : "rgba(254, 242, 242, 0.45)",
                          borderLeft: `4px solid ${borderColor}`,
                          cursor: "pointer",
                          transition: "background 0.15s ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                          <span
                            style={{
                              fontSize: "0.6875rem",
                              fontWeight: 800,
                              color: borderColor,
                              backgroundColor: `${borderColor}18`,
                              padding: "0.15rem 0.5rem",
                              borderRadius: "9999px",
                            }}
                          >
                            {notif.severity?.toUpperCase()} PRIORITY
                          </span>

                          <span
                            style={{
                              fontSize: "0.6875rem",
                              fontWeight: 700,
                              color: isHigh ? "#DC2626" : "var(--text-muted)",
                              display: "flex",
                              alignItems: "center",
                              gap: "3px",
                            }}
                          >
                            {isHigh ? <Mail size={11} /> : null}
                            {notif.channels?.includes("email") ? "App + Gmail via AWS" : "App Push"}
                          </span>
                        </div>

                        <strong
                          style={{
                            display: "block",
                            fontSize: "0.875rem",
                            color: "var(--charcoal)",
                            fontWeight: notif.is_read ? 600 : 750,
                            lineHeight: 1.35,
                          }}
                        >
                          {notif.title}
                        </strong>

                        <p
                          style={{
                            margin: "0.25rem 0 0.5rem",
                            fontSize: "0.8125rem",
                            color: "#4B5563",
                            lineHeight: 1.4,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {notif.message}
                        </p>

                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.6875rem", color: "var(--text-muted)" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                            <MapPin size={11} />
                            {notif.location_name || "Mumbai"} •{" "}
                            {notif.user_distance_km ? `${notif.user_distance_km} km away` : "In Geofence"}
                          </span>

                          {!notif.is_read && (
                            <button
                              onClick={(e) => handleMarkAsRead(notif.id, e)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "var(--primary-green)",
                                fontWeight: 700,
                                cursor: "pointer",
                                fontSize: "0.6875rem",
                              }}
                            >
                              Mark Read
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* DRAWER FOOTER */}
              <div
                style={{
                  padding: "0.75rem 1.125rem",
                  backgroundColor: "var(--bg-warm)",
                  borderTop: "1px solid var(--border-color)",
                  textAlign: "center",
                }}
              >
                <Link
                  to="/notifications"
                  onClick={() => setNotificationsOpen(false)}
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 700,
                    color: "var(--primary-green)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    textDecoration: "none",
                  }}
                >
                  View All Notifications & AWS Hub <ExternalLink size={13} />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* PROFILE CHIP */}
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
            textDecoration: "none",
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
