import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Search,
  FilePlus,
  RefreshCw,
  Eye,
  Shield,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Radio,
} from "lucide-react";
import { apiService } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { AlertMessage } from "../components/ui/AlertMessage";

export const MyReportsPage = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchMyReports = async () => {
    setLoading(true);
    setError("");
    try {
      const activeEmail =
        user?.email ||
        (typeof window !== "undefined" && JSON.parse(localStorage.getItem("theraphylax_user") || "{}")?.email) ||
        "citizen@theraphylax.org";
      const data = await apiService.getMyReports(activeEmail);
      const list = Array.isArray(data) ? data : data?.reports || [];
      setReports(list);
    } catch (err) {
      setError(err.message || "Failed to fetch your submitted reports.");
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyReports();
  }, [user]);

  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.title?.toLowerCase().includes(search.toLowerCase()) ||
      r.category?.toLowerCase().includes(search.toLowerCase()) ||
      r.location_name?.toLowerCase().includes(search.toLowerCase()) ||
      (r.tagged_forest_officers &&
        r.tagged_forest_officers.some((o) => o.toLowerCase().includes(search.toLowerCase())));

    const matchesStatus =
      statusFilter === "all" ||
      r.status?.toLowerCase().replace(/\s+/g, "_") === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const getStatusVariant = (status = "") => {
    const s = status.toLowerCase();
    if (s.includes("resolved")) return "resolved";
    if (s.includes("officer dispatched") || s.includes("dispatched")) return "critical";
    if (s.includes("in progress")) return "high";
    if (s.includes("under review")) return "medium";
    return "pending";
  };

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", paddingBottom: "4rem" }}>
      {/* HEADER SECTION */}
      <div className="flex-between" style={{ flexWrap: "wrap", gap: "1.25rem", marginBottom: "2rem" }}>
        <div>
          <span
            style={{
              fontFamily: "'Dancing Script', cursive",
              fontSize: "1.75rem",
              color: "var(--primary-green)",
              fontWeight: 700,
              display: "block",
              marginBottom: "0.25rem",
            }}
          >
            Citizen Incident Tracking
          </span>
          <h1 style={{ fontSize: "2.25rem", margin: 0, fontWeight: 800 }}>My Submitted Reports</h1>
          <p className="text-muted" style={{ fontSize: "0.9375rem", marginTop: "0.25rem" }}>
            Real-time status tracking, tagged Forest Officer dispatches, and verification timelines for your incident filings.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Button variant="outline" icon={RefreshCw} onClick={fetchMyReports} disabled={loading}>
            Refresh Feed
          </Button>
          <Link to="/accidents/report" style={{ textDecoration: "none" }}>
            <Button variant="primary" icon={FilePlus}>
              Report Incident / Accident
            </Button>
          </Link>
        </div>
      </div>

      {error && <AlertMessage type="error" message={error} />}

      {/* FILTER & SEARCH CARD */}
      <Card style={{ marginBottom: "2rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="Search by title, location, or tagged forest officer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: "2.5rem" }}
            />
            <Search
              size={18}
              style={{
                position: "absolute",
                left: "0.875rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--muted-text)",
              }}
            />
          </div>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="forest_officer_dispatched">Forest Officer Dispatched</option>
            <option value="pending_review">Pending Review</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </Card>

      {/* REPORT LISTING */}
      {loading ? (
        <LoadingSpinner label="Loading your submitted incident reports..." />
      ) : filteredReports.length === 0 ? (
        <Card style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              backgroundColor: "var(--sage-light)",
              display: "grid",
              placeItems: "center",
              margin: "0 auto 1.25rem",
              color: "var(--primary-green)",
            }}
          >
            <FileText size={32} />
          </div>
          <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>No Incident Reports Found</h3>
          <p className="text-muted" style={{ maxWidth: "450px", margin: "0 auto 1.5rem" }}>
            {search || statusFilter !== "all"
              ? "No reports match your current search and status filter."
              : "You have not submitted any incident reports yet. When you report an accident or animal hazard, it will appear here."}
          </p>
          <Link to="/accidents/report" style={{ textDecoration: "none" }}>
            <Button variant="primary" icon={FilePlus}>
              Submit New Incident Report
            </Button>
          </Link>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {filteredReports.map((report) => (
            <Card
              key={report.id}
              className="card-hover"
              style={{
                borderLeft: `5px solid ${
                  report.severity === "Critical"
                    ? "var(--red-critical)"
                    : report.severity === "High"
                    ? "var(--amber-warning)"
                    : "var(--primary-green)"
                }`,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* TOP HEADER ROW */}
                <div className="flex-between" style={{ flexWrap: "wrap", gap: "0.75rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.8125rem", fontWeight: 800, color: "var(--muted-text)" }}>
                      #{report.id}
                    </span>
                    <Badge variant={report.severity.toLowerCase()}>{report.severity} Severity</Badge>
                    <Badge variant="outline">{report.category}</Badge>
                    <Badge variant={getStatusVariant(report.status)}>{report.status}</Badge>
                  </div>

                  <span style={{ fontSize: "0.8125rem", color: "var(--muted-text)", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                    <Clock size={14} />
                    {new Date(report.incident_date || report.created_at).toLocaleString([], {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>

                {/* TITLE & DESCRIPTION */}
                <div>
                  <h3 style={{ fontSize: "1.25rem", margin: "0 0 0.5rem", fontWeight: 800 }}>
                    {report.title}
                  </h3>
                  <p className="text-muted" style={{ margin: 0, fontSize: "0.9375rem", lineHeight: 1.5 }}>
                    {report.description}
                  </p>
                </div>

                {/* LOCATION & TAGGED FOREST OFFICERS ROW */}
                <div
                  style={{
                    backgroundColor: "#F8FAF8",
                    padding: "0.875rem 1rem",
                    borderRadius: "10px",
                    border: "1px solid var(--border-color)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.625rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "var(--charcoal)", fontWeight: 600 }}>
                    <MapPin size={16} style={{ color: "#DC2626" }} />
                    <span>Location: {report.location_name}</span>
                    {report.latitude && report.longitude && (
                      <span style={{ fontSize: "0.75rem", color: "var(--muted-text)" }}>
                        ({parseFloat(report.latitude).toFixed(4)}, {parseFloat(report.longitude).toFixed(4)})
                      </span>
                    )}
                  </div>

                  {/* TAGGED FOREST OFFICERS BADGES */}
                  {report.tagged_forest_officers && report.tagged_forest_officers.length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", paddingTop: "0.25rem", borderTop: "1px dashed var(--border-color)" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--primary-green)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <Shield size={13} /> Tagged Forest Officers:
                      </span>
                      {report.tagged_forest_officers.map((officer, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: "0.75rem",
                            backgroundColor: "var(--sage-light)",
                            color: "var(--deep-forest)",
                            border: "1px solid var(--sage)",
                            padding: "0.2rem 0.5rem",
                            borderRadius: "6px",
                            fontWeight: 700,
                          }}
                        >
                          {officer}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* FOOTER ACTIONS */}
                <div className="flex-between" style={{ paddingTop: "0.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", color: "var(--muted-text)" }}>
                    {report.status === "Forest Officer Dispatched" ? (
                      <span style={{ color: "#DC2626", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <Radio size={14} className="spin" /> Forest Wildlife Flying Squad Assigned & On Route
                      </span>
                    ) : report.status === "Resolved" ? (
                      <span style={{ color: "var(--primary-green)", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <CheckCircle2 size={14} /> Incident Resolved by Forest Officers
                      </span>
                    ) : (
                      <span>Under Verification by District Control Center</span>
                    )}
                  </div>

                  <Link to={`/reports/${report.id}`} style={{ textDecoration: "none" }}>
                    <Button variant="outline" size="sm" icon={Eye}>
                      View Report Case Details
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
