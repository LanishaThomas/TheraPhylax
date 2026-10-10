import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Compass, Search, MapPin, RefreshCw, FilePlus } from "lucide-react";
import { apiService } from "../services/api";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { AlertMessage } from "../components/ui/AlertMessage";

export const RisksPage = () => {
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");

  const fetchRisks = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiService.getRisks();
      setRisks(Array.isArray(data) ? data : data?.risks || []);
    } catch (err) {
      setError(err.message || "Failed to load risk data from backend API.");
      setRisks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRisks();
  }, []);

  const filteredRisks = risks.filter((r) => {
    const matchesSearch =
      r.title?.toLowerCase().includes(search.toLowerCase()) ||
      r.location?.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || r.category?.toLowerCase() === categoryFilter.toLowerCase();
    const matchesSeverity = severityFilter === "all" || r.severity?.toLowerCase() === severityFilter.toLowerCase();
    return matchesSearch && matchesCategory && matchesSeverity;
  });

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "2rem 1.5rem" }}>
      <div className="flex-between" style={{ flexWrap: "wrap", gap: "1.5rem", marginBottom: "2rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--primary-green)", fontWeight: 700, fontSize: "0.875rem", marginBottom: "0.25rem" }}>
            <Compass size={18} />
            <span>SPATIAL RISK ASSESSMENT & GEOFENCING</span>
          </div>
          <h1 style={{ fontSize: "2rem", margin: 0 }}>Disaster Risk Zones & Threat Intelligence</h1>
          <p className="text-muted" style={{ fontSize: "0.9375rem", marginTop: "0.25rem" }}>
            Rule-based risk assessments based on proximity to forest boundaries, historical sightings, and geofence activity.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Button variant="outline" icon={RefreshCw} onClick={fetchRisks} disabled={loading}>
            Refresh
          </Button>
          <Link to="/reports/new">
            <Button variant="primary" icon={FilePlus}>
              Report Wildlife Sighting
            </Button>
          </Link>
        </div>
      </div>

      <Card style={{ marginBottom: "2rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="Search risk zones or locations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: "2.5rem" }}
            />
            <Search
              size={18}
              style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "var(--muted-text)" }}
            />
          </div>

          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">All Categories</option>
            <option value="wildlife intrusion">Wildlife Intrusion</option>
            <option value="wildfire">Wildfire Risk</option>
            <option value="flood">Flood Risk</option>
            <option value="landslide">Landslide Zone</option>
          </select>

          <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
            <option value="all">All Severity Levels</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </Card>

      {error && (
        <AlertMessage
          type="warning"
          title="Backend Integration Status"
          message={error}
        />
      )}

      {loading ? (
        <LoadingSpinner label="Fetching active spatial risk evaluations..." />
      ) : filteredRisks.length > 0 ? (
        <div className="grid-cols-3" style={{ gap: "1.5rem" }}>
          {filteredRisks.map((risk, i) => (
            <Card key={risk.id || i} className="card-hover">
              <div className="flex-between" style={{ marginBottom: "0.875rem" }}>
                <Badge variant={risk.severity || "medium"}>
                  {risk.severity || "Moderate Risk"}
                </Badge>
                <span style={{ fontSize: "0.8125rem", color: "var(--muted-text)" }}>
                  Risk Score: {risk.risk_score || risk.score || "7.2/10"}
                </span>
              </div>

              <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>{risk.title || "Geofenced Risk Zone"}</h3>
              <p className="text-muted" style={{ fontSize: "0.875rem", lineHeight: 1.6, marginBottom: "1rem" }}>
                {risk.description || "Active monitoring around buffer zone with elevated activity level."}
              </p>

              <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "0.75rem", fontSize: "0.8125rem", display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                  <MapPin size={14} style={{ color: "var(--primary-green)" }} />
                  <span><strong>Location:</strong> {risk.location || "Forest Fringe Sector A"}</span>
                </div>
                {risk.category && (
                  <div><strong>Category:</strong> {risk.category}</div>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <Compass size={48} style={{ color: "var(--sage)", marginBottom: "1rem" }} />
          <h3 style={{ fontSize: "1.375rem", marginBottom: "0.5rem" }}>No Active Risk Records Found</h3>
          <p className="text-muted" style={{ maxWidth: "500px", margin: "0 auto 1.5rem" }}>
            {search || categoryFilter !== "all" || severityFilter !== "all"
              ? "No risk evaluations matched your filter criteria. Try resetting search filters."
              : "No high-risk zones currently recorded by the backend system."}
          </p>
          {(search || categoryFilter !== "all" || severityFilter !== "all") && (
            <Button variant="outline" onClick={() => { setSearch(""); setCategoryFilter("all"); setSeverityFilter("all"); }}>
              Reset Filters
            </Button>
          )}
        </Card>
      )}
    </div>
  );
};
