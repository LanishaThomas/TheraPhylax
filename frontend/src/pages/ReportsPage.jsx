import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Search, FilePlus, RefreshCw, Eye } from "lucide-react";
import { apiService } from "../services/api";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { AlertMessage } from "../components/ui/AlertMessage";

export const ReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");

  const fetchReports = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiService.getReports();
      setReports(Array.isArray(data) ? data : data?.reports || []);
    } catch (err) {
      setError(err.message || "Failed to fetch reports from backend API.");
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.title?.toLowerCase().includes(search.toLowerCase()) ||
      r.category?.toLowerCase().includes(search.toLowerCase()) ||
      r.location_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || r.status?.toLowerCase() === statusFilter.toLowerCase();
    const matchesSeverity = severityFilter === "all" || r.severity?.toLowerCase() === severityFilter.toLowerCase();
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
      <div className="flex-between" style={{ flexWrap: "wrap", gap: "1.5rem", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", margin: 0 }}>Incident Reports Directory</h1>
          <p className="text-muted" style={{ fontSize: "0.9375rem", marginTop: "0.25rem" }}>
            Track officer verification status, response progress, and historical submissions.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Button variant="outline" icon={RefreshCw} onClick={fetchReports} disabled={loading}>
            Refresh
          </Button>
          <Link to="/reports/new">
            <Button variant="primary" icon={FilePlus}>
              Submit New Report
            </Button>
          </Link>
        </div>
      </div>

      <Card style={{ marginBottom: "2rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="Search reports by title or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: "2.5rem" }}
            />
            <Search
              size={18}
              style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "var(--muted-text)" }}
            />
          </div>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="pending">Pending Review</option>
            <option value="under_review">Under Review</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>

          <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </Card>

      {error && <AlertMessage type="info" title="Backend Connection Notice" message={error} />}

      {loading ? (
        <LoadingSpinner label="Loading incident reports directory..." />
      ) : filteredReports.length > 0 ? (
        <Card>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Incident Details</th>
                  <th>Category</th>
                  <th>Severity</th>
                  <th>Verification Status</th>
                  <th>Location</th>
                  <th>Submitted Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => (
                  <tr key={report.id}>
                    <td>
                      <strong style={{ fontSize: "0.9375rem" }}>{report.title}</strong>
                      {report.id && <div style={{ fontSize: "0.75rem", color: "var(--muted-text)" }}>ID: #{report.id}</div>}
                    </td>
                    <td>{report.category || "General"}</td>
                    <td>
                      <Badge variant={report.severity || "medium"}>{report.severity || "Medium"}</Badge>
                    </td>
                    <td>
                      <Badge variant={report.status || "pending"}>{report.status || "Pending"}</Badge>
                    </td>
                    <td style={{ fontSize: "0.875rem" }}>{report.location_name || "Location tagged"}</td>
                    <td style={{ fontSize: "0.8125rem" }}>
                      {report.created_at ? new Date(report.created_at).toLocaleDateString() : "Recent"}
                    </td>
                    <td>
                      <Link to={`/reports/${report.id}`}>
                        <Button variant="ghost" size="sm" icon={Eye}>
                          View Details
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <FileText size={48} style={{ color: "var(--sage)", marginBottom: "1rem" }} />
          <h3 style={{ fontSize: "1.375rem", marginBottom: "0.5rem" }}>No Incident Reports Found</h3>
          <p className="text-muted" style={{ maxWidth: "500px", margin: "0 auto 1.5rem" }}>
            {search || statusFilter !== "all" || severityFilter !== "all"
              ? "No incident reports match your selected search or filter options."
              : "No incident reports have been logged in the platform database."}
          </p>
          <Link to="/reports/new">
            <Button variant="primary" icon={FilePlus}>
              Submit New Report
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
};
