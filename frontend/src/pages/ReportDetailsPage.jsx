import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  AlertTriangle,
  User,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { apiService } from "../services/api";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { AlertMessage } from "../components/ui/AlertMessage";

export const ReportDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusNotes, setStatusNotes] = useState("");
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState("");

  const fetchDetails = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiService.getReportById(id);
      setReport(data);
    } catch (err) {
      setError(err.message || `Could not find incident report #${id}.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleUpdateStatus = async (newStatus) => {
    setUpdating(true);
    setUpdateMsg("");
    try {
      await apiService.updateReportStatus(id, newStatus, statusNotes);
      setUpdateMsg(`Report status updated to ${newStatus}`);
      fetchDetails();
    } catch (err) {
      setError(err.message || "Failed to update report status.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label={`Fetching incident report #${id}...`} />;
  }

  if (error || !report) {
    return (
      <div style={{ maxWidth: "600px", margin: "3rem auto" }}>
        <Card style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
          <AlertTriangle size={48} style={{ color: "var(--amber-warning)", marginBottom: "1rem" }} />
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Incident Report Not Found</h2>
          <p className="text-muted" style={{ marginBottom: "1.5rem" }}>
            {error || `Unable to load details for report ID #${id}.`}
          </p>
          <Link to="/reports">
            <Button variant="primary" icon={ArrowLeft}>
              Back to Reports Directory
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "none",
            border: "none",
            color: "var(--primary-green)",
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.375rem",
            marginBottom: "0.75rem",
            fontSize: "0.875rem",
          }}
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div className="flex-between" style={{ flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.375rem" }}>
              <Badge variant={report.severity || "medium"}>{report.severity || "Medium"} Severity</Badge>
              <Badge variant={report.status || "pending"}>{report.status || "Pending"}</Badge>
              <span className="text-muted" style={{ fontSize: "0.875rem" }}>Report #{report.id}</span>
            </div>
            <h1 style={{ fontSize: "2rem", margin: 0 }}>{report.title}</h1>
          </div>
        </div>
      </div>

      {updateMsg && <AlertMessage type="success" message={updateMsg} />}

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem" }} className="details-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <Card title="Incident Observation Details">
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <h4 className="text-muted" style={{ fontSize: "0.8125rem", textTransform: "uppercase" }}>Category</h4>
                <p style={{ fontSize: "1rem", fontWeight: 600, marginTop: "0.25rem" }}>{report.category || "General Incident"}</p>
              </div>

              <div>
                <h4 className="text-muted" style={{ fontSize: "0.8125rem", textTransform: "uppercase" }}>Description</h4>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.6, marginTop: "0.25rem", whiteSpace: "pre-wrap" }}>
                  {report.description}
                </p>
              </div>

              {(report.evidence_image_url || report.image_url) && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <h4 className="text-muted" style={{ fontSize: "0.8125rem", textTransform: "uppercase", margin: 0 }}>
                      Attached Photographic Evidence
                    </h4>
                    <span style={{ fontSize: "0.75rem", background: "rgba(16, 185, 129, 0.12)", color: "#047857", padding: "2px 8px", borderRadius: "6px", fontWeight: 700 }}>
                      ☁️ Amazon S3 Verified Evidence
                    </span>
                  </div>
                  <img
                    src={report.evidence_image_url || report.image_url}
                    alt="Evidence"
                    style={{ maxWidth: "100%", maxHeight: "380px", objectFit: "cover", borderRadius: "10px", border: "1px solid var(--border-color)" }}
                  />
                </div>
              )}
            </div>
          </Card>

          {(role === "Responder" || role === "Admin") && (
            <Card title="Officer Response Control" subtitle="Authorized officer action panel">
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label htmlFor="notes">Response Update Notes</label>
                  <textarea
                    id="notes"
                    rows={3}
                    placeholder="Add verification findings, patrol dispatch notes, or resolution comments..."
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                  />
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                  <Button
                    variant="primary"
                    size="sm"
                    loading={updating}
                    onClick={() => handleUpdateStatus("In Progress")}
                  >
                    Mark In Progress
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={updating}
                    onClick={() => handleUpdateStatus("Resolved")}
                  >
                    Mark Resolved
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    loading={updating}
                    onClick={() => handleUpdateStatus("Dismissed")}
                  >
                    Dismiss Report
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <Card title="Location & Metadata">
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", fontSize: "0.875rem" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem" }}>
                <MapPin size={18} style={{ color: "var(--primary-green)", flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <strong style={{ display: "block" }}>Location:</strong>
                  <span className="text-muted">{report.location_name || "Location tagged"}</span>
                  {report.latitude && report.longitude && (
                    <div style={{ fontSize: "0.75rem", color: "var(--primary-green)", marginTop: "0.25rem" }}>
                      GPS: {report.latitude}, {report.longitude}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                <Calendar size={18} style={{ color: "var(--primary-green)" }} />
                <div>
                  <strong>Report Date:</strong>
                  <div className="text-muted">
                    {report.created_at ? new Date(report.created_at).toLocaleString() : "Recently"}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                <User size={18} style={{ color: "var(--primary-green)" }} />
                <div>
                  <strong>Reporter:</strong>
                  <div className="text-muted">{report.reporter_name || report.user_email || "Verified Community Member"}</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <style>{`
        @media (max-width: 800px) {
          .details-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};
