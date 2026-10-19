import React, { useState, useEffect } from "react";
import {
  Bell,
  Mail,
  ShieldAlert,
  CheckCircle2,
  MapPin,
  RefreshCw,
  ExternalLink,
  Filter,
  Check,
  AlertTriangle,
  Info,
} from "lucide-react";
import { apiService } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { AlertMessage } from "../components/ui/AlertMessage";

export const NotificationsPage = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("ALL");
  const [filterRead, setFilterRead] = useState("ALL"); // "ALL", "UNREAD"

  const loadNotifications = async () => {
    setLoading(true);
    setError("");
    try {
      const email = user?.email || "";
      const res = await apiService.getNotifications(email);
      setNotifications(res?.notifications || []);
    } catch (err) {
      setError("Unable to load notifications from backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [user?.email]);

  const handleMarkAsRead = async (id) => {
    try {
      await apiService.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.warn(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiService.markAllNotificationsRead(user?.email || "");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.warn(err);
    }
  };

  // Filtered Notifications
  const filteredNotifications = notifications.filter((n) => {
    if (filterSeverity !== "ALL" && n.severity?.toUpperCase() !== filterSeverity) {
      return false;
    }
    if (filterRead === "UNREAD" && n.is_read) {
      return false;
    }
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div style={{ maxWidth: "1080px", margin: "0 auto", paddingBottom: "4rem" }}>
      {/* PAGE HEADER */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.75rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 800,
                backgroundColor: "var(--primary-green)",
                color: "#FFFFFF",
                padding: "0.2rem 0.625rem",
                borderRadius: "9999px",
              }}
            >
              GEOFENCE DISPATCH HUB
            </span>
            <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
              Mumbai & MMR Safe Corridor
            </span>
          </div>
          <h1 style={{ fontSize: "2.125rem", margin: 0, fontWeight: 800 }}>
            Emergency Notifications & Geofence Alerts
          </h1>
          <p className="text-muted" style={{ margin: "0.25rem 0 0", fontSize: "0.9375rem" }}>
            Perimeter-targeted alerts issued by forest officers. Low & Medium alerts are delivered in-app; High/Critical alerts are delivered in-app and dispatched to Gmail via AWS SES/SNS.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
              <Check size={14} /> Mark All as Read ({unreadCount})
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={loadNotifications} loading={loading}>
            <RefreshCw size={14} /> Refresh
          </Button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
          padding: "0.875rem 1.25rem",
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          border: "1px solid var(--border-color)",
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--charcoal)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <Filter size={14} /> Priority Filter:
          </span>
          {["ALL", "HIGH", "MEDIUM", "LOW"].map((sev) => {
            const isSelected = filterSeverity === sev;
            const color =
              sev === "HIGH"
                ? "#EF4444"
                : sev === "MEDIUM"
                ? "#F59E0B"
                : sev === "LOW"
                ? "#10B981"
                : "var(--primary-green)";

            return (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                style={{
                  fontSize: "0.75rem",
                  padding: "0.3rem 0.75rem",
                  borderRadius: "9999px",
                  border: isSelected ? `1.5px solid ${color}` : "1px solid var(--border-color)",
                  backgroundColor: isSelected ? color : "transparent",
                  color: isSelected ? "#FFFFFF" : "var(--charcoal)",
                  fontWeight: isSelected ? 700 : 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {sev === "ALL" ? "All Severities" : `${sev} Priority`}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            onClick={() => setFilterRead("ALL")}
            style={{
              fontSize: "0.75rem",
              padding: "0.3rem 0.625rem",
              borderRadius: "6px",
              border: filterRead === "ALL" ? "1px solid var(--primary-green)" : "1px solid transparent",
              backgroundColor: filterRead === "ALL" ? "var(--sage-light)" : "transparent",
              color: filterRead === "ALL" ? "var(--primary-green)" : "var(--text-muted)",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilterRead("UNREAD")}
            style={{
              fontSize: "0.75rem",
              padding: "0.3rem 0.625rem",
              borderRadius: "6px",
              border: filterRead === "UNREAD" ? "1px solid #DC2626" : "1px solid transparent",
              backgroundColor: filterRead === "UNREAD" ? "#FEF2F2" : "transparent",
              color: filterRead === "UNREAD" ? "#DC2626" : "var(--text-muted)",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Unread Only ({unreadCount})
          </button>
        </div>
      </div>

      {/* NOTIFICATIONS FEED */}
      {error && <AlertMessage type="error" message={error} style={{ marginBottom: "1.5rem" }} />}

      {loading ? (
        <Card style={{ padding: "3rem", textAlign: "center" }}>
          <div style={{ color: "var(--text-muted)", fontSize: "0.9375rem" }}>
            Scanning geofenced hazard channels in Mumbai...
          </div>
        </Card>
      ) : filteredNotifications.length === 0 ? (
        <Card style={{ padding: "3.5rem 2rem", textAlign: "center" }}>
          <CheckCircle2 size={44} style={{ color: "#10B981", margin: "0 auto 0.75rem" }} />
          <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.25rem", fontWeight: 800 }}>
            All Clear — No Active Emergency Alerts
          </h3>
          <p style={{ margin: "0 auto", color: "var(--text-muted)", fontSize: "0.875rem", maxWidth: "480px" }}>
            There are currently no active geofenced disaster alerts or safety advisories issued for your registered area. You will receive real-time notifications here when official alerts are dispatched.
          </p>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {filteredNotifications.map((notif) => {
            const isHigh = notif.severity === "High" || notif.severity === "Critical";
            const isMed = notif.severity === "Medium";
            const borderColor = notif.priority_color || (isHigh ? "#EF4444" : isMed ? "#F59E0B" : "#10B981");
            const bgTint = notif.is_read
              ? "#FFFFFF"
              : isHigh
              ? "#FFF5F5"
              : isMed
              ? "#FFFDF5"
              : "#F7FEFA";

            return (
              <Card
                key={notif.id}
                style={{
                  padding: "1.5rem 1.75rem",
                  backgroundColor: bgTint,
                  border: notif.is_read ? "1px solid var(--border-color)" : `1.5px solid ${borderColor}`,
                  borderLeft: `6px solid ${borderColor}`,
                  boxShadow: notif.is_read ? "none" : `0 4px 16px ${borderColor}22`,
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flexWrap: "wrap" }}>
                    {/* PRIORITY BADGE */}
                    <span
                      style={{
                        backgroundColor: borderColor,
                        color: "#FFFFFF",
                        fontSize: "0.6875rem",
                        fontWeight: 800,
                        padding: "0.2rem 0.625rem",
                        borderRadius: "9999px",
                        letterSpacing: "0.5px",
                        textTransform: "uppercase",
                      }}
                    >
                      {notif.priority_label || `${notif.severity} Priority`}
                    </span>

                    {/* CHANNEL BADGE */}
                    {isHigh ? (
                      <span
                        style={{
                          backgroundColor: "#FEE2E2",
                          color: "#991B1B",
                          fontSize: "0.6875rem",
                          fontWeight: 700,
                          padding: "0.2rem 0.625rem",
                          borderRadius: "9999px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          border: "1px solid #FECACA",
                        }}
                      >
                        <Mail size={12} /> Delivered to App + Gmail via AWS SES/SNS
                      </span>
                    ) : (
                      <span
                        style={{
                          backgroundColor: "#E0F2FE",
                          color: "#0369A1",
                          fontSize: "0.6875rem",
                          fontWeight: 700,
                          padding: "0.2rem 0.625rem",
                          borderRadius: "9999px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <Bell size={12} /> In-App Push Notification Only
                      </span>
                    )}

                    {!notif.is_read && (
                      <span
                        style={{
                          backgroundColor: "#DC2626",
                          color: "#FFFFFF",
                          fontSize: "0.625rem",
                          fontWeight: 800,
                          padding: "0.1rem 0.4rem",
                          borderRadius: "4px",
                        }}
                      >
                        NEW
                      </span>
                    )}
                  </div>

                  {/* ACTION CONTROLS */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {notif.created_at ? new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                    </span>
                    {!notif.is_read && (
                      <button
                        onClick={() => handleMarkAsRead(notif.id)}
                        style={{
                          background: "none",
                          border: "1px solid var(--border-color)",
                          padding: "0.25rem 0.5rem",
                          borderRadius: "6px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: "var(--primary-green)",
                          cursor: "pointer",
                        }}
                      >
                        Mark as Read
                      </button>
                    )}
                  </div>
                </div>

                {/* ALERT TITLE & MESSAGE */}
                <h3
                  style={{
                    fontSize: "1.1875rem",
                    fontWeight: 800,
                    color: "var(--charcoal)",
                    margin: "0.75rem 0 0.5rem",
                    lineHeight: 1.35,
                  }}
                >
                  {notif.title}
                </h3>

                <p
                  style={{
                    fontSize: "0.9375rem",
                    color: "#374151",
                    lineHeight: 1.6,
                    margin: "0 0 1rem",
                  }}
                >
                  {notif.message}
                </p>

                {/* GEOFENCE METADATA BAR */}
                <div
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.03)",
                    padding: "0.75rem 1rem",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "0.75rem",
                    fontSize: "0.8125rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--charcoal)" }}>
                    <MapPin size={15} style={{ color: borderColor }} />
                    <span>
                      <strong>Epicenter:</strong> {notif.location_name || "Mumbai Sector"}
                    </span>
                    <span style={{ color: "var(--text-muted)" }}>•</span>
                    <span>
                      <strong>Perimeter:</strong> {notif.alert_radius_km || 5.0} km radius
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontWeight: 700, color: borderColor }}>
                      {notif.user_distance_km !== undefined
                        ? `Your Proximity: Approx. ${notif.user_distance_km} km away`
                        : "Targeted to your profile location"}
                    </span>
                    <span style={{ color: "#059669", fontWeight: 700, fontSize: "0.75rem" }}>
                      [INSIDE GEOFENCE]
                    </span>
                  </div>
                </div>

                {/* EMAIL STATUS RECEIPT */}
                {isHigh && notif.email_status && (
                  <div
                    style={{
                      marginTop: "0.75rem",
                      fontSize: "0.75rem",
                      color: "#6B7280",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                    }}
                  >
                    <CheckCircle2 size={13} style={{ color: "#16A34A" }} />
                    <span>{notif.email_status}</span>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
