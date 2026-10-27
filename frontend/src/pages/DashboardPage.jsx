import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FilePlus,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Shield,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { apiService } from "../services/api";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { AlertMessage } from "../components/ui/AlertMessage";

export const DashboardPage = () => {
  const { user, role } = useAuth();
  const [stats, setStats] = useState({ total: 0, open: 0, resolved: 0, alerts: 0 });
  const [recentReports, setRecentReports] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiNotice, setApiNotice] = useState("");

  const loadDashboardData = async () => {
    setLoading(true);
    setApiNotice("");
    try {
      const reportsData = await apiService.getReports();
      const reportsList = Array.isArray(reportsData) ? reportsData : reportsData?.reports || [];
      
      const alertsData = await apiService.getAlerts();
      const alertsList = Array.isArray(alertsData) ? alertsData : alertsData?.alerts || [];

      setRecentReports(reportsList.slice(0, 5));
      setActiveAlerts(alertsList.slice(0, 3));

      setStats({
        total: reportsList.length,
        open: reportsList.filter((r) => r.status !== "Resolved" && r.status !== "Dismissed").length,
        resolved: reportsList.filter((r) => r.status === "Resolved").length,
        alerts: alertsList.length,
      });
    } catch (err) {
      setApiNotice(`Backend Connection: ${err.message}`);
      setRecentReports([]);
      setActiveAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <Card style={{ backgroundColor: "var(--deep-forest)", color: "#FFFFFF", padding: "2rem" }}>
        <div className="flex-between" style={{ flexWrap: "wrap", gap: "1.5rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--sage)", fontSize: "0.875rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              <Shield size={18} />
              <span>COMMUNITY SAFETY DASHBOARD</span>
            </div>
            <h1 style={{ fontSize: "1.75rem", color: "#FFFFFF", margin: 0 }}>
              Welcome back, {user?.name || "Citizen"}
            </h1>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9375rem", marginTop: "0.375rem" }}>
              Logged in with role <strong style={{ color: "var(--sage)" }}>{role}</strong>. Monitor incident activity, verify safety warnings, or submit a new report.
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.875rem" }}>
            <Link to="/reports/new">
              <Button variant="primary" icon={FilePlus}>
                Report an Incident
              </Button>
            </Link>
            <Link to="/accidents/my-reports">
              <Button variant="secondary" icon={FileText}>
                View My Reports
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {apiNotice && (
        <AlertMessage
          type="info"
          title="Backend Status Notice"
          message={`${apiNotice}. Showing empty states until FastAPI endpoints respond.`}
        />
      )}

      <div className="grid-cols-4" style={{ gap: "1.25rem" }}>
        <Card>
          <div className="flex-between" style={{ marginBottom: "0.75rem" }}>
            <span className="text-muted" style={{ fontSize: "0.875rem", fontWeight: 600 }}>Total Reports</span>
            <div style={{ padding: "0.5rem", borderRadius: "10px", backgroundColor: "var(--sage-light)", color: "var(--primary-green)" }}>
              <FileText size={20} />
            </div>
          </div>
          <p style={{ fontSize: "2rem", fontWeight: 800, color: "var(--deep-forest)", margin: 0 }}>
            {stats.total}
          </p>
          <span style={{ fontSize: "0.75rem", color: "var(--muted-text)" }}>Submitted by your account</span>
        </Card>

        <Card>
          <div className="flex-between" style={{ marginBottom: "0.75rem" }}>
            <span className="text-muted" style={{ fontSize: "0.875rem", fontWeight: 600 }}>Open Incidents</span>
            <div style={{ padding: "0.5rem", borderRadius: "10px", backgroundColor: "var(--blue-bg)", color: "var(--blue-info)" }}>
              <Clock size={20} />
            </div>
          </div>
          <p style={{ fontSize: "2rem", fontWeight: 800, color: "var(--blue-info)", margin: 0 }}>
            {stats.open}
          </p>
          <span style={{ fontSize: "0.75rem", color: "var(--muted-text)" }}>Under officer review</span>
        </Card>

        <Card>
          <div className="flex-between" style={{ marginBottom: "0.75rem" }}>
            <span className="text-muted" style={{ fontSize: "0.875rem", fontWeight: 600 }}>Resolved Reports</span>
            <div style={{ padding: "0.5rem", borderRadius: "10px", backgroundColor: "var(--green-bg)", color: "var(--green-success)" }}>
              <CheckCircle2 size={20} />
            </div>
          </div>
          <p style={{ fontSize: "2rem", fontWeight: 800, color: "var(--green-success)", margin: 0 }}>
            {stats.resolved}
          </p>
          <span style={{ fontSize: "0.75rem", color: "var(--muted-text)" }}>Successfully handled</span>
        </Card>

        <Card>
          <div className="flex-between" style={{ marginBottom: "0.75rem" }}>
            <span className="text-muted" style={{ fontSize: "0.875rem", fontWeight: 600 }}>Active Alerts</span>
            <div style={{ padding: "0.5rem", borderRadius: "10px", backgroundColor: "var(--amber-bg)", color: "var(--amber-warning)" }}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <p style={{ fontSize: "2rem", fontWeight: 800, color: "var(--amber-warning)", margin: 0 }}>
            {stats.alerts}
          </p>
          <span style={{ fontSize: "0.75rem", color: "var(--muted-text)" }}>Regional safety notices</span>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem" }} className="dashboard-grid">
        <Card
          title="Recent Incident Reports"
          subtitle="Your latest logged observations and emergency reports"
          action={
            <Link to="/reports" style={{ fontSize: "0.875rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.25rem" }}>
              View All <ArrowRight size={14} />
            </Link>
          }
        >
          {loading ? (
            <LoadingSpinner label="Loading reports..." />
          ) : recentReports.length > 0 ? (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title / Category</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentReports.map((report) => (
                    <tr key={report.id}>
                      <td>
                        <strong>{report.title}</strong>
                        <div style={{ fontSize: "0.75rem", color: "var(--muted-text)" }}>{report.category}</div>
                      </td>
                      <td>
                        <Badge variant={report.severity}>{report.severity}</Badge>
                      </td>
                      <td>
                        <Badge variant={report.status || "pending"}>{report.status || "Pending"}</Badge>
                      </td>
                      <td style={{ fontSize: "0.8125rem" }}>
                        {report.created_at ? new Date(report.created_at).toLocaleDateString() : "Recently"}
                      </td>
                      <td>
                        <Link to={`/reports/${report.id}`}>
                          <Button variant="ghost" size="sm">Details</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: "3rem 1rem", textAlign: "center" }}>
              <FileText size={40} style={{ color: "var(--sage)", marginBottom: "0.75rem" }} />
              <h4 style={{ fontSize: "1.125rem", marginBottom: "0.375rem" }}>No Incident Reports Yet</h4>
              <p className="text-muted" style={{ fontSize: "0.875rem", marginBottom: "1.25rem" }}>
                You have not submitted any incident reports. Log wildlife intrusions or natural hazards to keep your area safe.
              </p>
              <Link to="/reports/new">
                <Button variant="primary" size="sm" icon={FilePlus}>
                  Submit First Report
                </Button>
              </Link>
            </div>
          )}
        </Card>

        <Card
          title="Safety Notices & Alerts"
          subtitle="Real-time disaster warnings"
          action={
            <Link to="/alerts" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
              All Alerts
            </Link>
          }
        >
          {loading ? (
            <LoadingSpinner label="Fetching alerts..." />
          ) : activeAlerts.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {activeAlerts.map((alert, i) => (
                <div
                  key={alert.id || i}
                  style={{
                    padding: "0.875rem",
                    borderRadius: "10px",
                    backgroundColor: "var(--bg-warm)",
                    borderLeft: `4px solid ${
                      alert.severity === "Critical" ? "var(--red-critical)" : "var(--amber-warning)"
                    }`,
                  }}
                >
                  <div className="flex-between" style={{ marginBottom: "0.375rem" }}>
                    <Badge variant={alert.severity || "high"}>{alert.severity || "Alert"}</Badge>
                    <span style={{ fontSize: "0.75rem", color: "var(--muted-text)" }}>{alert.time || "Active"}</span>
                  </div>
                  <h4 style={{ fontSize: "0.9375rem", marginBottom: "0.25rem" }}>{alert.title || "Safety Warning"}</h4>
                  <p className="text-muted" style={{ fontSize: "0.8125rem", lineHeight: 1.4 }}>
                    {alert.message || alert.description || "Caution advised near sector boundary."}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: "2.5rem 1rem", textAlign: "center" }}>
              <CheckCircle2 size={36} style={{ color: "var(--green-success)", marginBottom: "0.75rem" }} />
              <h4 style={{ fontSize: "1rem", marginBottom: "0.25rem" }}>No Active Critical Warnings</h4>
              <p className="text-muted" style={{ fontSize: "0.8125rem" }}>
                No emergency disaster alerts have been issued for your registered sector.
              </p>
            </div>
          )}
        </Card>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .dashboard-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};
