import React, { useEffect, useState } from "react";
import { AlertTriangle, Clock, CheckCircle2, RefreshCw } from "lucide-react";
import { apiService } from "../services/api";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { AlertMessage } from "../components/ui/AlertMessage";

export const AlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");

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
    return severityFilter === "all" || a.severity?.toLowerCase() === severityFilter.toLowerCase();
  });

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
      <div className="flex-between" style={{ flexWrap: "wrap", gap: "1.5rem", marginBottom: "2rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--red-critical)", fontWeight: 700, fontSize: "0.875rem", marginBottom: "0.25rem" }}>
            <AlertTriangle size={18} />
            <span>EMERGENCY DISASTER BROADCAST</span>
          </div>
          <h1 style={{ fontSize: "2rem", margin: 0 }}>Active Safety Alerts & Advisories</h1>
          <p className="text-muted" style={{ fontSize: "0.9375rem", marginTop: "0.25rem" }}>
            Official emergency warnings issued by Forest Officers & Disaster Control Authorities.
          </p>
        </div>

        <Button variant="outline" icon={RefreshCw} onClick={fetchAlerts} disabled={loading}>
          Refresh Alerts
        </Button>
      </div>

      <Card style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
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
          {filteredAlerts.map((alert, i) => (
            <Card
              key={alert.id || i}
              style={{
                borderLeft: `6px solid ${
                  alert.severity === "Critical"
                    ? "var(--red-critical)"
                    : alert.severity === "High"
                    ? "var(--amber-warning)"
                    : "var(--primary-green)"
                }`,
              }}
            >
              <div className="flex-between" style={{ flexWrap: "wrap", gap: "1rem", marginBottom: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                  <Badge variant={alert.severity || "high"}>{alert.severity || "Emergency Alert"}</Badge>
                  <span style={{ fontSize: "0.8125rem", color: "var(--muted-text)", fontWeight: 600 }}>
                    Issued by: {alert.source || "Forest Disaster Control"}
                  </span>
                </div>
                <div style={{ fontSize: "0.8125rem", color: "var(--muted-text)", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                  <Clock size={14} />
                  <span>Valid until: {alert.valid_until || "Active until revoked"}</span>
                </div>
              </div>

              <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>{alert.title}</h3>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.6, color: "var(--charcoal)", marginBottom: "1rem" }}>
                {alert.message || alert.description}
              </p>

              {alert.location && (
                <div style={{ fontSize: "0.8125rem", color: "var(--deep-forest)", fontWeight: 600 }}>
                  📍 Affected Zone: {alert.location}
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <CheckCircle2 size={48} style={{ color: "var(--green-success)", marginBottom: "1rem" }} />
          <h3 style={{ fontSize: "1.375rem", marginBottom: "0.5rem" }}>No Active Safety Alerts</h3>
          <p className="text-muted" style={{ maxWidth: "500px", margin: "0 auto" }}>
            {severityFilter !== "all"
              ? "No disaster alerts match your severity filter."
              : "There are currently no active emergency alerts or disaster warnings reported."}
          </p>
        </Card>
      )}
    </div>
  );
};
