import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  RefreshCw,
  Plus,
  Bell,
  Mail,
  MapPin,
  Radio,
} from "lucide-react";
import { apiService } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { AlertMessage } from "../components/ui/AlertMessage";

export const AlertsPage = () => {
  const { user, role } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");

  const isOfficer =
    (role || user?.role || "Citizen").toLowerCase() === "officer" ||
    (role || user?.role || "Citizen").toLowerCase() === "responder" ||
    (role || user?.role || "Citizen").toLowerCase() === "admin";

  const fetchAlerts = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiService.getAlerts();
      setAlerts(Array.isArray(data) ? data : data?.alerts || []);
    } catch (err) {
      setError(err.message || "Failed to fetch active alerts from FastAPI backend.");
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const filteredAlerts = alerts.filter((a) => {
    return (
      severityFilter === "all" ||
      a.severity?.toLowerCase() === severityFilter.toLowerCase()
    );
  });

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", paddingBottom: "4rem" }}>
      <div className="flex-between" style={{ flexWrap: "wrap", gap: "1.5rem", marginBottom: "2rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--red-critical)", fontWeight: 700, fontSize: "0.875rem", marginBottom: "0.25rem" }}>
            <AlertTriangle size={18} />
            <span>EMERGENCY DISASTER BROADCAST</span>
          </div>
          <h1 style={{ fontSize: "2rem", margin: 0, fontWeight: 800 }}>Active Geofence Alerts & Safety Advisories</h1>
          <p className="text-muted" style={{ fontSize: "0.9375rem", marginTop: "0.25rem" }}>
            Official emergency warnings issued by Forest Officers & Disaster Control Authorities in Mumbai.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          {isOfficer && (
            <Link to="/officer/alerts/create">
              <Button variant="primary" icon={Plus} style={{ backgroundColor: "#DC2626", borderColor: "#B91C1C" }}>
                Issue Geofenced Alert
              </Button>
            </Link>
          )}

          <Link to="/notifications">
            <Button variant="outline" icon={Bell}>
              My Notifications Hub
            </Button>
          </Link>

          <Button variant="outline" icon={RefreshCw} onClick={fetchAlerts} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>

      <Card style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--deep-forest)" }}>
            Filter Severity:
          </span>
          {["all", "critical", "high", "medium", "low"].map((sev) => (
            <Button
              key={sev}
              variant={severityFilter === sev ? "primary" : "outline"}
              size="sm"
              onClick={() => setSeverityFilter(sev)}
              style={{ textTransform: "capitalize" }}
            >
              {sev}
            </Button>
          ))}
        </div>
      </Card>

      {error && <AlertMessage type="info" title="Alert Service Status" message={error} />}

      {loading ? (
        <LoadingSpinner label="Fetching active disaster warnings..." />
      ) : filteredAlerts.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {filteredAlerts.map((alert, i) => {
            const isCritical = alert.severity === "Critical";
            const isHigh = alert.severity === "High";
            const isMed = alert.severity === "Medium";
            const borderColor = alert.priority_color || (isCritical || isHigh ? "#EF4444" : isMed ? "#F59E0B" : "#10B981");

            return (
              <Card
                key={alert.id || i}
                style={{
                  borderLeft: `6px solid ${borderColor}`,
                  padding: "1.5rem",
                }}
              >
                <div className="flex-between" style={{ flexWrap: "wrap", gap: "1rem", marginBottom: "0.75rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flexWrap: "wrap" }}>
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
                      {alert.priority_label || `${alert.severity} Priority`}
                    </span>

                    {/* CHANNEL POLICY BADGE */}
                    {isCritical || isHigh ? (
                      <span
                        style={{
                          backgroundColor: "#FEE2E2",
                          color: "#991B1B",
                          fontSize: "0.6875rem",
                          fontWeight: 700,
                          padding: "0.15rem 0.5rem",
                          borderRadius: "6px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                        }}
                      >
                        <Mail size={12} /> In-App + Gmail Dispatched via AWS
                      </span>
                    ) : (
                      <span
                        style={{
                          backgroundColor: "#E0F2FE",
                          color: "#0369A1",
                          fontSize: "0.6875rem",
                          fontWeight: 700,
                          padding: "0.15rem 0.5rem",
                          borderRadius: "6px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                        }}
                      >
                        <Bell size={12} /> In-App Notification Only
                      </span>
                    )}

                    <span style={{ fontSize: "0.8125rem", color: "var(--muted-text)", fontWeight: 600 }}>
                      Issued by: {alert.source || "Forest Disaster Control"}
                    </span>
                  </div>

                  <div style={{ fontSize: "0.8125rem", color: "var(--muted-text)", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                    <Clock size={14} />
                    <span>{alert.created_at ? new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Active"}</span>
                  </div>
                </div>

                <h3 style={{ fontSize: "1.25rem", margin: "0.25rem 0 0.5rem", fontWeight: 800 }}>
                  {alert.title}
                </h3>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.6, color: "var(--charcoal)", margin: "0 0 1rem" }}>
                  {alert.message || alert.description}
                </p>

                <div
                  style={{
                    backgroundColor: "var(--bg-warm)",
                    padding: "0.625rem 1rem",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                    fontSize: "0.8125rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--deep-forest)", fontWeight: 600 }}>
                    <MapPin size={15} style={{ color: borderColor }} />
                    <span>Affected Zone: {alert.location || "Mumbai"}</span>
                    {alert.radius_km && (
                      <span style={{ color: "var(--text-muted)" }}>
                        • Exact Geofence: {alert.radius_km} km radius
                      </span>
                    )}
                  </div>

                  {alert.delivery_status && (
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                      {alert.delivery_status}
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <CheckCircle2 size={48} style={{ color: "var(--green-success)", marginBottom: "1rem" }} />
          <h3 style={{ fontSize: "1.375rem", marginBottom: "0.5rem" }}>No Active Safety Alerts</h3>
          <p className="text-muted" style={{ maxWidth: "500px", margin: "0 auto" }}>
            {severityFilter !== "all"
              ? "No disaster alerts match your severity filter."
              : "There are currently no active emergency alerts or disaster warnings reported in Mumbai."}
          </p>
        </Card>
      )}
    </div>
  );
};
