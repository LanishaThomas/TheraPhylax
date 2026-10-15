import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Radio,
  Shield,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Eye,
  Send,
  MapPin,
  Clock,
  Compass,
  Filter,
  Search,
  Plus,
  Phone,
  FileText,
  UserCheck,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { apiService } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { AlertMessage } from "../components/ui/AlertMessage";

export const OfficerDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // District and Station management
  const MUMBAI_DISTRICTS = [
    "Mumbai Suburban", "Mumbai City", "Thane", "Navi Mumbai", "Palghar", "Raigad"
  ];

  const defaultDistrict = user?.district || "Mumbai Suburban";
  const defaultOfficerStation =
    user?.assigned_station || "Sanjay Gandhi National Park (SGNP) Range Office (Borivali East)";

  const [selectedDistrict, setSelectedDistrict] = useState(defaultDistrict);
  const [districtsList, setDistrictsList] = useState(MUMBAI_DISTRICTS);
  const [selectedStation, setSelectedStation] = useState(defaultOfficerStation);
  const [availableStations, setAvailableStations] = useState([]);

  // Reports state
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterMode, setFilterMode] = useState("my_office"); // "my_office", "district", or "all"
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const loadData = async (targetDistrict = selectedDistrict) => {
    setLoading(true);
    setError("");
    try {
      const [reportsData, stationsData, remoteDistricts] = await Promise.all([
        apiService.getReports(),
        apiService.getForestStations(targetDistrict),
        apiService.getForestDistricts().catch(() => MUMBAI_DISTRICTS),
      ]);

      setReports(Array.isArray(reportsData) ? reportsData : []);
      if (Array.isArray(remoteDistricts) && remoteDistricts.length > 0) {
        setDistrictsList(remoteDistricts);
      }
      if (Array.isArray(stationsData) && stationsData.length > 0) {
        setAvailableStations(stationsData);
        // If current station isn't in this district's stations, switch to the first
        const hasCurrent = stationsData.some(
          (s) => s.name.toLowerCase() === selectedStation.toLowerCase()
        );
        if (!hasCurrent) {
          setSelectedStation(stationsData[0].name);
        }
      }
    } catch (err) {
      console.error("Error loading officer data:", err);
      setError("Failed to sync live reports from database. Showing cached records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedDistrict);
  }, [selectedDistrict]);

  // Update district and station if user profile updates
  useEffect(() => {
    if (user?.district && user.district !== selectedDistrict) {
      setSelectedDistrict(user.district);
    }
    if (user?.assigned_station) {
      setSelectedStation(user.assigned_station);
    }
  }, [user]);

  // Handle manual district change from dropdown
  const handleDistrictChange = (newDistrict) => {
    setSelectedDistrict(newDistrict);
  };

  // Filter reports
  const filteredReports = reports.filter((r) => {
    // 1. Station or District filter
    let matchesJurisdiction = true;
    if (filterMode === "my_office") {
      matchesJurisdiction =
        r.tagged_forest_officers &&
        r.tagged_forest_officers.some(
          (o) =>
            o.toLowerCase().includes(selectedStation.toLowerCase()) ||
            selectedStation.toLowerCase().includes(o.toLowerCase())
        );
    } else if (filterMode === "district") {
      // Matches if tagged to any station in this district, or location has district name
      const stationNamesInDistrict = availableStations.map((s) => s.name.toLowerCase());
      const taggedToDistrictStation =
        r.tagged_forest_officers &&
        r.tagged_forest_officers.some((o) =>
          stationNamesInDistrict.some(
            (stnName) => o.toLowerCase().includes(stnName) || stnName.includes(o.toLowerCase())
          )
        );
      const locationMentionsDistrict =
        r.location_name?.toLowerCase().includes(selectedDistrict.toLowerCase()) ||
        r.description?.toLowerCase().includes(selectedDistrict.toLowerCase()) ||
        r.forest_range?.toLowerCase().includes(selectedDistrict.toLowerCase());

      matchesJurisdiction = taggedToDistrictStation || locationMentionsDistrict;
    }

    // 2. Severity filter
    const matchesSeverity =
      severityFilter === "ALL" ||
      (r.severity || "").toLowerCase() === severityFilter.toLowerCase();

    // 3. Search query
    const matchesSearch =
      !searchQuery ||
      r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.location_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.category?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesJurisdiction && matchesSeverity && matchesSearch;
  });

  // Handle in-place status update by officer
  const handleUpdateStatus = async (reportId, newStatus, defaultNote) => {
    try {
      const note = prompt(
        `Enter officer action log for status "${newStatus}":`,
        defaultNote || `Action logged by Officer ${user?.name || "in charge"}`
      );
      if (note === null) return; // User cancelled

      await apiService.updateReportStatus(reportId, newStatus, note);
      setActionSuccess(`Report ${reportId} successfully updated to "${newStatus}".`);

      // Update local state
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId ? { ...r, status: newStatus, officer_notes: note } : r
        )
      );

      setTimeout(() => setActionSuccess(""), 4000);
    } catch (err) {
      alert("Failed to update status: " + err.message);
    }
  };

  const getSeverityColor = (sev = "Medium") => {
    const s = sev.toLowerCase();
    if (s === "critical") return "#EF4444";
    if (s === "high") return "#F97316";
    if (s === "medium") return "#F59E0B";
    return "#10B981";
  };

  const myOfficeTaggedCount = reports.filter(
    (r) =>
      r.tagged_forest_officers &&
      r.tagged_forest_officers.some(
        (o) =>
          o.toLowerCase().includes(selectedStation.toLowerCase()) ||
          selectedStation.toLowerCase().includes(o.toLowerCase())
      )
  ).length;

  const districtTaggedCount = reports.filter((r) => {
    const stationNamesInDistrict = availableStations.map((s) => s.name.toLowerCase());
    const taggedToDistrictStation =
      r.tagged_forest_officers &&
      r.tagged_forest_officers.some((o) =>
        stationNamesInDistrict.some(
          (stnName) => o.toLowerCase().includes(stnName) || stnName.includes(o.toLowerCase())
        )
      );
    const locationMentionsDistrict =
      r.location_name?.toLowerCase().includes(selectedDistrict.toLowerCase()) ||
      r.description?.toLowerCase().includes(selectedDistrict.toLowerCase()) ||
      r.forest_range?.toLowerCase().includes(selectedDistrict.toLowerCase());
    return taggedToDistrictStation || locationMentionsDistrict;
  }).length;

  return (
    <div style={{ maxWidth: "1340px", margin: "0 auto", paddingBottom: "5rem" }}>
      {/* COMMAND HEADER BANNER */}
      <div
        style={{
          background: "linear-gradient(135deg, #092116 0%, #133D29 60%, #1A4D35 100%)",
          color: "#FFFFFF",
          borderRadius: "20px",
          padding: "2.25rem 2.5rem",
          marginBottom: "2rem",
          boxShadow: "0 12px 35px rgba(9, 33, 22, 0.35)",
          border: "1px solid rgba(52, 211, 153, 0.25)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div className="flex-between" style={{ flexWrap: "wrap", gap: "1.5rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "#34D399",
                  backgroundColor: "rgba(52, 211, 153, 0.15)",
                  padding: "0.25rem 0.75rem",
                  borderRadius: "9999px",
                  border: "1px solid rgba(52, 211, 153, 0.3)",
                }}
              >
                <Radio size={13} style={{ animation: "pulse 2s infinite" }} /> Officer Command Station Active
              </span>
              <span style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.7)" }}>
                {user?.badge_number ? `Badge: ${user.badge_number}` : "Authorized Wildlife Patrol"}
              </span>
            </div>

            <h1
              style={{
                fontSize: "2.375rem",
                margin: "0 0 0.5rem",
                fontWeight: 800,
                color: "#FFFFFF",
                letterSpacing: "-0.02em",
              }}
            >
              Forest Officer Dispatch & Command Desk
            </h1>

            {/* DISTRICT & STATION CHOOSERS */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                <span style={{ fontSize: "0.875rem", color: "#E5C07B", fontWeight: 700 }}>
                  District:
                </span>
                <select
                  value={selectedDistrict}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.18)",
                    color: "#FFFFFF",
                    border: "1.5px solid rgba(229, 192, 123, 0.5)",
                    borderRadius: "8px",
                    padding: "0.35rem 0.75rem",
                    fontWeight: 700,
                    fontSize: "0.9375rem",
                    cursor: "pointer",
                  }}
                >
                  {districtsList.map((d) => (
                    <option key={d} value={d} style={{ color: "#000000" }}>
                      {d} District
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                <span style={{ fontSize: "0.875rem", color: "#E5C07B", fontWeight: 700 }}>
                  Station / Range:
                </span>
                <select
                  value={selectedStation}
                  onChange={(e) => setSelectedStation(e.target.value)}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.15)",
                    color: "#FFFFFF",
                    border: "1px solid rgba(255,255,255,0.3)",
                    borderRadius: "8px",
                    padding: "0.35rem 0.75rem",
                    fontWeight: 700,
                    fontSize: "0.9375rem",
                    cursor: "pointer",
                    maxWidth: "340px",
                  }}
                >
                  {availableStations.map((stn) => (
                    <option key={stn.id || stn.name} value={stn.name} style={{ color: "#000000" }}>
                      {stn.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* QUICK ACTION HEADER BUTTONS */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <Button
              variant="outline"
              icon={RefreshCw}
              onClick={loadData}
              disabled={loading}
              style={{
                color: "#FFFFFF",
                borderColor: "rgba(255,255,255,0.3)",
                backgroundColor: "rgba(255,255,255,0.06)",
              }}
            >
              Sync Live Reports
            </Button>

            <Link to="/officer/updates/create">
              <Button
                variant="primary"
                icon={Send}
                style={{
                  backgroundColor: "#34D399",
                  color: "#062215",
                  fontWeight: 700,
                  boxShadow: "0 4px 15px rgba(52, 211, 153, 0.4)",
                }}
              >
                Publish Safety Notice (AI Assisted)
              </Button>
            </Link>

            <Link to="/officer/alerts/create">
              <Button
                variant="primary"
                icon={Plus}
                style={{
                  backgroundColor: "#F59E0B",
                  borderColor: "#D97706",
                  color: "#FFFFFF",
                  fontWeight: 700,
                }}
              >
                Issue Geo-Alert
              </Button>
            </Link>
          </div>
        </div>

        {/* METRICS ROW */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
            marginTop: "2rem",
            paddingTop: "1.75rem",
            borderTop: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <div>
            <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.65)", textTransform: "uppercase", fontWeight: 700 }}>
              Tagged to Your Office
            </span>
            <p style={{ fontSize: "1.875rem", fontWeight: 800, margin: "0.25rem 0 0", color: "#34D399" }}>
              {myOfficeTaggedCount} Reports
            </p>
          </div>

          <div>
            <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.65)", textTransform: "uppercase", fontWeight: 700 }}>
              Pending Dispatches
            </span>
            <p style={{ fontSize: "1.875rem", fontWeight: 800, margin: "0.25rem 0 0", color: "#FBBF24" }}>
              {
                reports.filter(
                  (r) =>
                    r.status !== "Resolved" &&
                    r.tagged_forest_officers?.some((o) => o.includes(selectedStation))
                ).length
              }{" "}
              Active
            </p>
          </div>

          <div>
            <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.65)", textTransform: "uppercase", fontWeight: 700 }}>
              Critical / High Threats
            </span>
            <p style={{ fontSize: "1.875rem", fontWeight: 800, margin: "0.25rem 0 0", color: "#F87171" }}>
              {
                reports.filter(
                  (r) =>
                    (r.severity === "High" || r.severity === "Critical") &&
                    r.tagged_forest_officers?.some((o) => o.includes(selectedStation))
                ).length
              }{" "}
              Urgent
            </p>
          </div>

          <div>
            <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.65)", textTransform: "uppercase", fontWeight: 700 }}>
              Resolved by Office
            </span>
            <p style={{ fontSize: "1.875rem", fontWeight: 800, margin: "0.25rem 0 0", color: "#60A5FA" }}>
              {
                reports.filter(
                  (r) =>
                    r.status === "Resolved" &&
                    r.tagged_forest_officers?.some((o) => o.includes(selectedStation))
                ).length
              }{" "}
              Cases Closed
            </p>
          </div>
        </div>
      </div>

      {actionSuccess && <AlertMessage type="success" message={actionSuccess} style={{ marginBottom: "1.5rem" }} />}
      {error && <AlertMessage type="warning" message={error} style={{ marginBottom: "1.5rem" }} />}

      {/* FILTER CONTROLS & TOGGLE FOR STATION */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          padding: "1.25rem 1.5rem",
          borderRadius: "16px",
          border: "1px solid var(--border-color)",
          boxShadow: "0 4px 15px rgba(0,0,0,0.04)",
          marginBottom: "1.75rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <div className="flex-between" style={{ flexWrap: "wrap", gap: "1rem" }}>
          {/* PRIMARY TOGGLE: MY STATION vs DISTRICT vs ALL REPORTS */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setFilterMode("my_office")}
              style={{
                padding: "0.625rem 1.125rem",
                borderRadius: "10px",
                border: filterMode === "my_office" ? "2px solid var(--primary-green)" : "1px solid var(--border-color)",
                backgroundColor: filterMode === "my_office" ? "rgba(39, 103, 73, 0.12)" : "transparent",
                color: filterMode === "my_office" ? "var(--deep-forest)" : "var(--muted-text)",
                fontWeight: 800,
                fontSize: "0.875rem",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "all 0.15s ease",
              }}
            >
              <Shield size={16} style={{ color: "var(--primary-green)" }} />
              <span>Tagged to My Station ({myOfficeTaggedCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterMode("district")}
              style={{
                padding: "0.625rem 1.125rem",
                borderRadius: "10px",
                border: filterMode === "district" ? "2px solid #F59E0B" : "1px solid var(--border-color)",
                backgroundColor: filterMode === "district" ? "rgba(245, 158, 11, 0.12)" : "transparent",
                color: filterMode === "district" ? "#B45309" : "var(--muted-text)",
                fontWeight: 800,
                fontSize: "0.875rem",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "all 0.15s ease",
              }}
            >
              <Compass size={16} style={{ color: "#F59E0B" }} />
              <span>{selectedDistrict} District ({districtTaggedCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterMode("all")}
              style={{
                padding: "0.625rem 1.125rem",
                borderRadius: "10px",
                border: filterMode === "all" ? "2px solid #6366F1" : "1px solid var(--border-color)",
                backgroundColor: filterMode === "all" ? "rgba(99, 102, 241, 0.1)" : "transparent",
                color: filterMode === "all" ? "#4338CA" : "var(--muted-text)",
                fontWeight: 700,
                fontSize: "0.875rem",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "all 0.15s ease",
              }}
            >
              <span>All Reports ({reports.length})</span>
            </button>
          </div>

          {/* SEARCH & SEVERITY */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <div style={{ position: "relative", minWidth: "240px" }}>
              <Search
                size={16}
                style={{
                  position: "absolute",
                  left: "0.875rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#9CA3AF",
                }}
              />
              <input
                type="text"
                placeholder="Search reports by title or place..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  paddingLeft: "2.5rem",
                  height: "38px",
                  fontSize: "0.875rem",
                }}
              />
            </div>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              style={{ height: "38px", fontSize: "0.875rem", fontWeight: 600 }}
            >
              <option value="ALL">All Severities</option>
              <option value="Critical">Critical Threats</option>
              <option value="High">High Severity</option>
              <option value="Medium">Medium Severity</option>
              <option value="Low">Low Severity</option>
            </select>
          </div>
        </div>

        <div style={{ fontSize: "0.8125rem", color: "var(--muted-text)" }}>
          {filterMode === "my_office" ? (
            <span>
              Showing reports specifically routed to <strong>{selectedStation}</strong> by citizens or emergency control room.
            </span>
          ) : filterMode === "district" ? (
            <span>
              Showing all incidents tagged or reported within <strong>{selectedDistrict} District</strong> jurisdiction.
            </span>
          ) : (
            <span>Viewing all verified incident reports across the state emergency network.</span>
          )}
        </div>
      </div>

      {/* REPORTS LIST */}
      <div>
        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem 0" }}>
            <LoadingSpinner label="Loading officer incident records..." />
          </div>
        ) : filteredReports.length === 0 ? (
          <Card style={{ padding: "4rem 2rem", textAlign: "center" }}>
            <CheckCircle2 size={54} style={{ color: "var(--primary-green)", margin: "0 auto 1rem" }} />
            <h3 style={{ fontSize: "1.375rem", margin: "0 0 0.5rem" }}>
              {filterMode === "my_office"
                ? `No Active Incidents Tagged to ${selectedStation}`
                : "No Reports Match Current Filters"}
            </h3>
            <p className="text-muted" style={{ maxWidth: "500px", margin: "0 auto 1.5rem" }}>
              {filterMode === "my_office"
                ? "Your station patrol queue is currently all clear. Toggle to 'All District Reports' to inspect wider incidents."
                : "Try clearing search or severity filter settings to view more cases."}
            </p>
            {filterMode === "my_office" && (
              <Button variant="outline" onClick={() => setFilterMode("all")}>
                View All District Reports
              </Button>
            )}
          </Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {filteredReports.map((report) => {
              const sevColor = getSeverityColor(report.severity);
              const isTaggedToCurrent =
                report.tagged_forest_officers &&
                report.tagged_forest_officers.some((o) => o.includes(selectedStation));

              return (
                <Card
                  key={report.id}
                  style={{
                    padding: "1.75rem",
                    borderRadius: "16px",
                    border: isTaggedToCurrent
                      ? "1.5px solid rgba(52, 211, 153, 0.4)"
                      : "1px solid var(--border-color)",
                    boxShadow: isTaggedToCurrent
                      ? "0 4px 18px rgba(39, 103, 73, 0.08)"
                      : "0 2px 8px rgba(0,0,0,0.03)",
                  }}
                >
                  {/* TOP ROW: SEVERITY, STATUS, TIME */}
                  <div className="flex-between" style={{ flexWrap: "wrap", gap: "0.75rem", marginBottom: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          padding: "0.25rem 0.625rem",
                          borderRadius: "9999px",
                          backgroundColor: `${sevColor}15`,
                          color: sevColor,
                          border: `1px solid ${sevColor}44`,
                        }}
                      >
                        {report.severity || "Medium"} Severity
                      </span>

                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          backgroundColor: "var(--background-secondary, #F3F4F6)",
                          color: "var(--text-secondary)",
                          padding: "0.25rem 0.625rem",
                          borderRadius: "9999px",
                        }}
                      >
                        {report.category}
                      </span>

                      <Badge
                        variant={
                          report.status === "Resolved"
                            ? "resolved"
                            : report.status === "Forest Officer Dispatched"
                            ? "critical"
                            : report.status === "In Progress"
                            ? "high"
                            : "pending"
                        }
                      >
                        {report.status || "Under Review"}
                      </Badge>

                      {isTaggedToCurrent && (
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            backgroundColor: "#DCFCE7",
                            color: "#166534",
                            padding: "0.25rem 0.625rem",
                            borderRadius: "9999px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                          }}
                        >
                          <CheckCircle2 size={12} /> Assigned to Your Office
                        </span>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                      <Clock size={14} />
                      <span>{new Date(report.created_at || Date.now()).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* TITLE & DESCRIPTION */}
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 800, margin: "0 0 0.5rem", color: "var(--charcoal)" }}>
                    {report.title}
                  </h3>
                  <p style={{ fontSize: "0.9375rem", color: "var(--muted-text)", lineHeight: 1.6, margin: "0 0 1rem" }}>
                    {report.description}
                  </p>

                  {/* LOCATION & REPORTER DETAILS */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: "0.75rem",
                      padding: "0.875rem 1rem",
                      backgroundColor: "var(--background-secondary, #F9FAFB)",
                      borderRadius: "10px",
                      border: "1px solid var(--border-color)",
                      marginBottom: "1rem",
                      fontSize: "0.8125rem",
                    }}
                  >
                    <div>
                      <span style={{ color: "var(--muted-text)", display: "block" }}>📍 Incident Location</span>
                      <strong style={{ color: "var(--charcoal)" }}>{report.location_name || "GPS Mapped"}</strong>
                    </div>

                    <div>
                      <span style={{ color: "var(--muted-text)", display: "block" }}>👤 Filed By</span>
                      <strong style={{ color: "var(--charcoal)" }}>{report.reporter_name || "Citizen"}</strong>
                    </div>

                    <div>
                      <span style={{ color: "var(--muted-text)", display: "block" }}>🏷️ Tagged Forest Stations</span>
                      <strong style={{ color: "var(--primary-green)" }}>
                        {(report.tagged_forest_officers || ["Range General"]).join(", ")}
                      </strong>
                    </div>
                  </div>

                  {/* OFFICER NOTES IF PRESENT */}
                  {report.officer_notes && (
                    <div
                      style={{
                        padding: "0.75rem 1rem",
                        backgroundColor: "#FEF3C7",
                        borderLeft: "4px solid #D97706",
                        borderRadius: "6px",
                        marginBottom: "1rem",
                        fontSize: "0.8125rem",
                        color: "#92400E",
                      }}
                    >
                      <strong>Officer Action Log:</strong> {report.officer_notes}
                    </div>
                  )}

                  {/* IN-PLACE OFFICER ACTIONS */}
                  <div
                    className="flex-between"
                    style={{
                      paddingTop: "1rem",
                      borderTop: "1px solid var(--border-color)",
                      flexWrap: "wrap",
                      gap: "0.75rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted-text)" }}>
                        Dispatch Action:
                      </span>

                      {report.status !== "Forest Officer Dispatched" && (
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateStatus(
                              report.id,
                              "Forest Officer Dispatched",
                              `Rapid Response Team mobilized from ${selectedStation}. Flying squad on route.`
                            )
                          }
                          style={{
                            padding: "0.35rem 0.75rem",
                            borderRadius: "6px",
                            border: "1px solid #F59E0B",
                            backgroundColor: "#FEF3C7",
                            color: "#B45309",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Mobilize Patrol Squad
                        </button>
                      )}

                      {report.status !== "In Progress" && (
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateStatus(
                              report.id,
                              "In Progress",
                              `Patrol arrived on scene. Containment and clearance operations underway.`
                            )
                          }
                          style={{
                            padding: "0.35rem 0.75rem",
                            borderRadius: "6px",
                            border: "1px solid #3B82F6",
                            backgroundColor: "#EFF6FF",
                            color: "#1D4ED8",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Mark In Progress
                        </button>
                      )}

                      {report.status !== "Resolved" && (
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateStatus(
                              report.id,
                              "Resolved",
                              `Incident safely cleared and resolved by ${selectedStation} unit.`
                            )
                          }
                          style={{
                            padding: "0.35rem 0.75rem",
                            borderRadius: "6px",
                            border: "1px solid #10B981",
                            backgroundColor: "#ECFDF5",
                            color: "#047857",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Resolve & Close
                        </button>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Link
                        to={`/officer/updates/create?refTitle=${encodeURIComponent(report.title)}&refLoc=${encodeURIComponent(report.location_name || "")}&lat=${report.latitude || ""}&lng=${report.longitude || ""}`}
                      >
                        <Button variant="outline" size="sm" icon={Send}>
                          Issue Geofenced Notice
                        </Button>
                      </Link>

                      <Link to={`/reports/${report.id}`}>
                        <Button variant="outline" size="sm" icon={Eye}>
                          Full Report Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
