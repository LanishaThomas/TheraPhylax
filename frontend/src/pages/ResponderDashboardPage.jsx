import React, { useEffect, useState } from "react";
import { Radio, ShieldAlert, CheckCircle2, RefreshCw, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { apiService } from "../services/api";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { AlertMessage } from "../components/ui/AlertMessage";

export const ResponderDashboardPage = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadResponderData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiService.getReports();
      setIncidents(Array.isArray(data) ? data : data?.reports || []);
    } catch (err) {
      setError(err.message || "Failed to load responder incident queue.");
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResponderData();
  }, []);

  const pendingIncidents = incidents.filter(
    (i) => i.status !== "Resolved" && i.status !== "Dismissed"
  );

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
      <Card style={{ backgroundColor: "var(--deep-forest)", color: "#FFFFFF", marginBottom: "2rem", padding: "2rem" }}>
        <div className="flex-between" style={{ flexWrap: "wrap", gap: "1.5rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--sage)", fontWeight: 700, fontSize: "0.875rem", marginBottom: "0.5rem" }}>
              <Radio size={18} />
              <span>OFFICIAL RESPONDER COMMAND WORKSPACE</span>
            </div>
            <h1 style={{ fontSize: "1.875rem", color: "#FFFFFF", margin: 0 }}>
              Forest Officer & Responder Queue
            </h1>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9375rem", marginTop: "0.25rem" }}>
              Prioritize geotagged wildlife intrusions, review evidence photos, and dispatch patrol units.
            </p>
          </div>

          <Button variant="secondary" icon={RefreshCw} onClick={loadResponderData} disabled={loading}>
            Refresh Queue
          </Button>
        </div>
      </Card>

      <div className="grid-cols-3" style={{ gap: "1.25rem", marginBottom: "2rem" }}>
        <Card>
          <div className="flex-between" style={{ marginBottom: "0.5rem" }}>
            <span className="text-muted" style={{ fontSize: "0.875rem", fontWeight: 600 }}>Active Patrol Queue</span>
            <Radio size={20} style={{ color: "var(--amber-warning)" }} />
          </div>
          <p style={{ fontSize: "2rem", fontWeight: 800, color: "var(--deep-forest)", margin: 0 }}>
            {pendingIncidents.length}
          </p>
          <span style={{ fontSize: "0.75rem", color: "var(--muted-text)" }}>Incidents requiring action</span>
        </Card>

        <Card>
          <div className="flex-between" style={{ marginBottom: "0.5rem" }}>
            <span className="text-muted" style={{ fontSize: "0.875rem", fontWeight: 600 }}>High & Critical Threats</span>
            <ShieldAlert size={20} style={{ color: "var(--red-critical)" }} />
          </div>
          <p style={{ fontSize: "2rem", fontWeight: 800, color: "var(--red-critical)", margin: 0 }}>
            {pendingIncidents.filter((i) => i.severity === "High" || i.severity === "Critical").length}
          </p>
          <span style={{ fontSize: "0.75rem", color: "var(--muted-text)" }}>Immediate priority dispatch</span>
        </Card>

        <Card>
          <div className="flex-between" style={{ marginBottom: "0.5rem" }}>
            <span className="text-muted" style={{ fontSize: "0.875rem", fontWeight: 600 }}>Total Handled Today</span>
            <CheckCircle2 size={20} style={{ color: "var(--green-success)" }} />
          </div>
          <p style={{ fontSize: "2rem", fontWeight: 800, color: "var(--green-success)", margin: 0 }}>
            {incidents.filter((i) => i.status === "Resolved").length}
          </p>
          <span style={{ fontSize: "0.75rem", color: "var(--muted-text)" }}>Verified and closed</span>
        </Card>
      </div>

      {error && <AlertMessage type="info" message={error} />}

      <Card title="Prioritized Emergency Dispatch List">
        {loading ? (
          <LoadingSpinner label="Loading responder queue..." />
        ) : pendingIncidents.length > 0 ? (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Incident Title</th>
                  <th>Category</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Location</th>
                  <th>Logged Date</th>
                  <th>Officer Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingIncidents.map((inc) => (
                  <tr key={inc.id}>
                    <td>
                      <strong>{inc.title}</strong>
                    </td>
                    <td>{inc.category}</td>
                    <td>
                      <Badge variant={inc.severity}>{inc.severity}</Badge>
                    </td>
                    <td>
                      <Badge variant={inc.status || "pending"}>{inc.status || "Pending"}</Badge>
                    </td>
                    <td>{inc.location_name || "Map tagged"}</td>
                    <td style={{ fontSize: "0.8125rem" }}>
                      {inc.created_at ? new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently"}
                    </td>
                    <td>
                      <Link to={`/reports/${inc.id}`}>
                        <Button variant="primary" size="sm" icon={Eye}>
                          Review & Update
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
            <CheckCircle2 size={48} style={{ color: "var(--green-success)", marginBottom: "0.75rem" }} />
            <h3 style={{ fontSize: "1.25rem", marginBottom: "0.25rem" }}>All Incident Patrols Clear</h3>
            <p className="text-muted" style={{ fontSize: "0.875rem" }}>
              No active pending incidents requiring officer dispatch in your sector.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};
