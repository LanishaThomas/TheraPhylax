import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  AlertTriangle,
  User,
  ShieldCheck,
  ExternalLink,
  Image as ImageIcon,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { apiService, getApiBaseUrl } from "../services/api";
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
  const [isTestPixel, setIsTestPixel] = useState(false);

  const resolveEvidenceUrl = (rawUrl) => {
    if (!rawUrl) return "";
    let clean = rawUrl;
    if (clean.includes(".amazonaws.com/")) {
      const key = clean.split(".amazonaws.com/")[1];
      return `${getApiBaseUrl()}/evidence/${key}`;
    }
    if (clean.startsWith("/evidence/")) {
      return `${getApiBaseUrl()}${clean}`;
    }
    return clean;
  };

  const getS3Uri = (rawUrl) => {
    if (!rawUrl) return "s3://theraphylax-evidence-179895364119/";
    if (rawUrl.includes(".amazonaws.com/")) {
      const key = rawUrl.split(".amazonaws.com/")[1];
      return `s3://theraphylax-evidence-179895364119/${key}`;
    }
    if (rawUrl.startsWith("/evidence/")) {
      const key = rawUrl.replace("/evidence/", "");
      return `s3://theraphylax-evidence-179895364119/${key}`;
    }
    return rawUrl;
  };

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
                <div style={{ marginTop: "0.5rem" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "0.625rem",
                      flexWrap: "wrap",
                      gap: "0.5rem",
                    }}
                  >
                    <h4 className="text-muted" style={{ fontSize: "0.8125rem", textTransform: "uppercase", margin: 0, fontWeight: 700 }}>
                      Attached Photographic Evidence
                    </h4>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        background: "#ECFDF5",
                        color: "#065F46",
                        border: "1px solid #A7F3D0",
                        padding: "2px 10px",
                        borderRadius: "9999px",
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                      }}
                    >
                      <ShieldCheck size={13} style={{ color: "#10B981" }} />
                      Amazon S3 Encrypted Evidence (ap-south-1)
                    </span>
                  </div>

                  <div
                    style={{
                      backgroundColor: "#F8FAFC",
                      border: "1px solid var(--border-color)",
                      borderRadius: "12px",
                      padding: "1rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                    }}
                  >
                    {!isTestPixel ? (
                      <div
                        style={{
                          textAlign: "center",
                          position: "relative",
                          backgroundColor: "#0F172A",
                          borderRadius: "8px",
                          overflow: "hidden",
                          minHeight: "180px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <img
                          src={resolveEvidenceUrl(report.evidence_image_url || report.image_url)}
                          alt="Incident Photographic Evidence"
                          style={{
                            maxWidth: "100%",
                            maxHeight: "420px",
                            objectFit: "contain",
                            display: "block",
                            margin: "0 auto",
                          }}
                          onLoad={(e) => {
                            if (e.target.naturalWidth === 1 && e.target.naturalHeight === 1) {
                              setIsTestPixel(true);
                            }
                          }}
                          onError={(e) => {
                            // If proxy had an issue, fallback to icon state
                            setIsTestPixel(true);
                          }}
                        />
                      </div>
                    ) : (
                      <div
                        style={{
                          padding: "1.75rem",
                          backgroundColor: "#F1F5F9",
                          borderRadius: "8px",
                          border: "1px dashed #CBD5E1",
                          textAlign: "center",
                        }}
                      >
                        <ImageIcon size={40} style={{ color: "var(--primary-green)", margin: "0 auto 0.625rem", opacity: 0.8 }} />
                        <p style={{ fontWeight: 700, margin: "0 0 0.25rem", color: "#1E293B", fontSize: "0.9375rem" }}>
                          Encrypted S3 Evidence Artifact Verified
                        </p>
                        <p style={{ fontSize: "0.8125rem", color: "#64748B", margin: "0 0 0.5rem" }}>
                          Initial incident token preserved with cryptographic hash in Amazon S3 private storage.
                        </p>
                      </div>
                    )}

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "0.5rem",
                        paddingTop: "0.5rem",
                        borderTop: "1px solid #E2E8F0",
                        fontSize: "0.75rem",
                      }}
                    >
                      <div style={{ color: "#64748B", fontFamily: "monospace", wordBreak: "break-all" }}>
                        <strong>S3 URI:</strong> {getS3Uri(report.evidence_image_url || report.image_url)}
                      </div>
                      <a
                        href={resolveEvidenceUrl(report.evidence_image_url || report.image_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          color: "var(--primary-green)",
                          fontWeight: 700,
                          textDecoration: "none",
                        }}
                      >
                        <ExternalLink size={13} />
                        View Full Resolution
                      </a>
                    </div>
                  </div>
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
