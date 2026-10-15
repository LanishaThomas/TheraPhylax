import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  ShieldAlert,
  Radio,
  MapPin,
  Compass,
  AlertTriangle,
  RefreshCw,
  Plus,
  Send,
  Eye,
  CheckCircle,
  Filter,
  Search,
  Clock,
  Layers,
  Map as MapIcon,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { apiService } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { AlertMessage } from "../components/ui/AlertMessage";

export const PublicSafetyUpdatesPage = () => {
  const { user, role } = useAuth();
  const isOfficerOrAdmin = ["officer", "responder", "admin"].includes(
    (role || "").toLowerCase()
  );

  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("ALL");
  const [selectedSeverity, setSelectedSeverity] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [focusedUpdateId, setFocusedUpdateId] = useState(null);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);

  // Predefined regions in Mumbai Metropolitan Region & surrounding forest buffer zones
  const availableRegions = [
    "ALL",
    "All Regions",
    "SGNP Borivali Buffer",
    "Aarey Units 1-32",
    "Film City Perimeter",
    "WEH Green Belt",
    "JVLR Transit Corridor",
    "Yeoor Hills Range",
    "Upvan Lake Buffer",
    "Ghodbunder Ghat Road",
    "Thane Creek Flamingo Sanctuary",
    "Tungareshwar Sanctuary Buffer",
    "Karnala Bird Sanctuary Corridor",
    "Sewri & Mahim Coastal Belt",
  ];

  const fetchUpdates = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiService.getPublicUpdates();
      setUpdates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching public safety updates:", err);
      setError("Unable to retrieve public safety updates. Using regional station cache.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, []);

  // Filter updates based on region, severity, search
  const filteredUpdates = updates.filter((u) => {
    const matchesRegion =
      selectedRegion === "ALL" ||
      (u.target_regions &&
        (u.target_regions.includes("All Regions") ||
          u.target_regions.includes(selectedRegion))) ||
      (u.location && u.location.toLowerCase().includes(selectedRegion.toLowerCase()));

    const matchesSeverity =
      selectedSeverity === "ALL" ||
      (u.severity || "Medium").toLowerCase() === selectedSeverity.toLowerCase();

    const matchesSearch =
      !searchQuery ||
      u.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.author?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesRegion && matchesSeverity && matchesSearch;
  });

  // Severity style helper
  const getSeverityColor = (sev) => {
    const s = (sev || "Medium").toLowerCase();
    if (s === "critical") return "#EF4444";
    if (s === "high") return "#F97316";
    if (s === "medium") return "#F59E0B";
    return "#10B981";
  };

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean up existing map instance if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    if (mapContainerRef.current._leaflet_id) {
      delete mapContainerRef.current._leaflet_id;
    }

    // Default center on Sanjay Gandhi National Park / Mumbai Metropolitan Region
    const defaultCenter = [19.2288, 72.9106];
    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView(defaultCenter, 11);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | TheraPhylax Forest Geofence',
      maxZoom: 18,
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      if (mapContainerRef.current && mapContainerRef.current._leaflet_id) {
        delete mapContainerRef.current._leaflet_id;
      }
    };
  }, []);

  // Sync Geofenced circles and markers with filtered updates
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;

    const layerGroup = layerGroupRef.current;
    layerGroup.clearLayers();

    const bounds = [];

    filteredUpdates.forEach((update) => {
      const lat = update.latitude || 11.6054;
      const lng = update.longitude || 76.083;
      const radiusKm = update.radius_km || 3.0;
      const radiusMeters = radiusKm * 1000;
      const color = getSeverityColor(update.severity);

      bounds.push([lat, lng]);

      // 1. Draw circular geofenced risk zone
      const circle = L.circle([lat, lng], {
        radius: radiusMeters,
        color: color,
        weight: 2,
        opacity: 0.85,
        fillColor: color,
        fillOpacity: 0.22,
      }).addTo(layerGroup);

      // 2. Center Icon Marker with Pulse effect
      const markerHtml = `
        <div style="
          position: relative;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            position: absolute;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background-color: ${color};
            opacity: 0.35;
            animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>
          <div style="
            position: relative;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background-color: ${color};
            border: 2.5px solid #FFFFFF;
            box-shadow: 0 2px 8px rgba(0,0,0,0.35);
          "></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: "custom-geofence-marker",
        html: markerHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(layerGroup);

      const popupContent = `
        <div style="font-family: inherit; font-size: 13px; max-width: 260px; line-height: 1.4;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
              padding: 2px 6px;
              border-radius: 9999px;
              background-color: ${color}22;
              color: ${color};
              border: 1px solid ${color}44;
            ">${update.severity || "Medium"} RISK</span>
            <span style="font-size: 11px; color: #6B7280; font-weight: 600;">${radiusKm} km Geofence</span>
          </div>
          <h4 style="margin: 4px 0 6px; font-size: 14px; font-weight: 700; color: #111827;">${update.title}</h4>
          <p style="margin: 0 0 6px; color: #374151; font-size: 12px;">${update.message}</p>
          <div style="border-top: 1px solid #E5E7EB; padding-top: 5px; font-size: 11px; color: #6B7280;">
            <strong>Officer:</strong> ${update.author || "Forest Command"}<br/>
            <strong>Regions:</strong> ${(update.target_regions || ["Mumbai & MMR"]).join(", ")}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      circle.bindPopup(popupContent);
    });

    if (bounds.length > 0 && mapInstanceRef.current) {
      try {
        mapInstanceRef.current.fitBounds(L.latLngBounds(bounds), {
          padding: [50, 50],
          maxZoom: 13,
        });
      } catch (e) {
        // Fallback silently if bounds single point
      }
    }
  }, [filteredUpdates]);

  const handleFocusOnMap = (update) => {
    setFocusedUpdateId(update.id);
    if (mapInstanceRef.current && update.latitude && update.longitude) {
      mapInstanceRef.current.flyTo([update.latitude, update.longitude], 13, {
        duration: 1.2,
      });
      // Scroll to map smoothly
      if (mapContainerRef.current) {
        mapContainerRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", paddingBottom: "5rem" }}>
      {/* HEADER SECTION */}
      <div
        style={{
          background: "linear-gradient(135deg, #0A2218 0%, #153D2A 50%, #1D543A 100%)",
          color: "#FFFFFF",
          borderRadius: "20px",
          padding: "2.25rem 2.5rem",
          marginBottom: "2rem",
          boxShadow: "0 12px 35px rgba(10, 34, 24, 0.25)",
          border: "1px solid rgba(52, 211, 153, 0.2)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: "-40px",
            top: "-40px",
            width: "240px",
            height: "240px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(52, 211, 153, 0.15) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div className="flex-between" style={{ flexWrap: "wrap", gap: "1.25rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "#34D399",
                  backgroundColor: "rgba(52, 211, 153, 0.15)",
                  padding: "0.25rem 0.75rem",
                  borderRadius: "9999px",
                  border: "1px solid rgba(52, 211, 153, 0.3)",
                }}
              >
                <Radio size={13} style={{ animation: "pulse 2s infinite" }} /> Live Field Broadcasts
              </span>
              <span style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.7)" }}>
                Mumbai & MMR Forest Fringe Range
              </span>
            </div>
            <h1
              style={{
                fontSize: "2.25rem",
                margin: "0 0 0.5rem",
                fontWeight: 800,
                color: "#FFFFFF",
                letterSpacing: "-0.02em",
              }}
            >
              Public Safety Updates & Risk Geofences
            </h1>
            <p
              style={{
                fontSize: "1rem",
                color: "rgba(255,255,255,0.85)",
                margin: 0,
                maxWidth: "750px",
                lineHeight: 1.6,
              }}
            >
              Real-time advisories, wild elephant sightings, and flash hazards published directly by Forest
              Officers. Active risk fields are geofenced on the map below with designated danger radiuses.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <Button
              variant="outline"
              onClick={fetchUpdates}
              disabled={loading}
              icon={RefreshCw}
              style={{
                color: "#FFFFFF",
                borderColor: "rgba(255,255,255,0.3)",
                backgroundColor: "rgba(255,255,255,0.06)",
              }}
            >
              Refresh
            </Button>

            {isOfficerOrAdmin && (
              <Link to="/officer/updates/create">
                <Button
                  variant="primary"
                  icon={Plus}
                  style={{
                    backgroundColor: "#34D399",
                    color: "#062215",
                    fontWeight: 700,
                    boxShadow: "0 4px 15px rgba(52, 211, 153, 0.4)",
                  }}
                >
                  Publish Geofenced Advisory
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* STATS STRIP */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "1rem",
            marginTop: "1.75rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <div>
            <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", fontWeight: 600 }}>
              Active Advisories
            </span>
            <p style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0.25rem 0 0", color: "#34D399" }}>
              {updates.length}
            </p>
          </div>
          <div>
            <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", fontWeight: 600 }}>
              Geofenced Danger Zones
            </span>
            <p style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0.25rem 0 0", color: "#FBBF24" }}>
              {updates.filter((u) => (u.radius_km || 0) > 0).length} Circles
            </p>
          </div>
          <div>
            <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", fontWeight: 600 }}>
              Protected Wildlife Ranges
            </span>
            <p style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0.25rem 0 0", color: "#60A5FA" }}>
              4 Sectors Active
            </p>
          </div>
          <div>
            <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", fontWeight: 600 }}>
              Emergency Broadcast
            </span>
            <p style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0.25rem 0 0", color: "#F87171" }}>
              Unified 112 / Forest 1800
            </p>
          </div>
        </div>
      </div>

      {error && <AlertMessage type="warning" message={error} style={{ marginBottom: "1.5rem" }} />}

      {/* INTERACTIVE GEOFENCED RISK MAP SECTION */}
      <Card
        style={{
          padding: "1.5rem",
          marginBottom: "2.25rem",
          borderRadius: "18px",
          border: "1px solid var(--border-color)",
          boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
        }}
      >
        <div className="flex-between" style={{ marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(239, 68, 68, 0.12)",
                  color: "#EF4444",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <MapPin size={17} />
              </div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0 }}>
                Interactive Geofenced Risk Fields
              </h2>
            </div>
            <p className="text-muted" style={{ fontSize: "0.875rem", margin: "0.25rem 0 0" }}>
              Colored circular buffer zones indicate active risk fields issued by Forest Patrol. Click any
              zone to inspect broadcast limits.
            </p>
          </div>

          {/* MAP LEGEND */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              background: "var(--background-secondary, #F9FAFB)",
              padding: "0.5rem 0.875rem",
              borderRadius: "10px",
              border: "1px solid var(--border-color)",
              fontSize: "0.75rem",
              fontWeight: 600,
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#EF4444" }} />
              Critical
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#F97316" }} />
              High
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#F59E0B" }} />
              Medium
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#10B981" }} />
              Advisory
            </span>
          </div>
        </div>

        {/* MAP CONTAINER */}
        <div
          ref={mapContainerRef}
          style={{
            height: "440px",
            width: "100%",
            borderRadius: "14px",
            overflow: "hidden",
            border: "1px solid var(--border-color)",
            boxShadow: "inset 0 2px 6px rgba(0,0,0,0.08)",
            zIndex: 1,
          }}
        />
      </Card>

      {/* FILTER & REGION SELECTION TOOLBAR */}
      <div
        style={{
          background: "var(--card-bg, #FFFFFF)",
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
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "1rem",
            alignItems: "center",
          }}
        >
          {/* SEARCH INPUT */}
          <div style={{ position: "relative" }}>
            <Search
              size={18}
              style={{
                position: "absolute",
                left: "1rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#9CA3AF",
              }}
            />
            <input
              type="text"
              placeholder="Search by keyword, officer, or hazard..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                paddingLeft: "2.75rem",
                borderRadius: "10px",
                height: "42px",
                border: "1px solid var(--border-color)",
              }}
            />
          </div>

          {/* REGION FILTER DROPDOWN */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <Compass size={18} style={{ color: "var(--primary-green)", flexShrink: 0 }} />
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              style={{
                width: "100%",
                borderRadius: "10px",
                height: "42px",
                border: "1px solid var(--border-color)",
                fontWeight: 600,
              }}
            >
              <option value="ALL">All Broadcast Regions</option>
              {availableRegions
                .filter((r) => r !== "ALL")
                .map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
            </select>
          </div>

          {/* SEVERITY FILTER */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <Filter size={18} style={{ color: "#F59E0B", flexShrink: 0 }} />
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              style={{
                width: "100%",
                borderRadius: "10px",
                height: "42px",
                border: "1px solid var(--border-color)",
                fontWeight: 600,
              }}
            >
              <option value="ALL">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Advisory / Low</option>
            </select>
          </div>
        </div>

        {/* QUICK REGION CHIPS */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", paddingTop: "0.5rem" }}>
          <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-muted)" }}>
            Quick Region Filter:
          </span>
          {["ALL", "SGNP Borivali Buffer", "Aarey Units 1-32", "Ghodbunder Ghat Road", "Yeoor Hills Range"].map(
            (reg) => (
              <button
                key={reg}
                onClick={() => setSelectedRegion(reg)}
                style={{
                  fontSize: "0.75rem",
                  padding: "0.25rem 0.75rem",
                  borderRadius: "9999px",
                  border:
                    selectedRegion === reg
                      ? "1px solid var(--primary-green)"
                      : "1px solid var(--border-color)",
                  backgroundColor:
                    selectedRegion === reg ? "var(--primary-green)" : "transparent",
                  color: selectedRegion === reg ? "#FFFFFF" : "var(--text-secondary)",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {reg === "ALL" ? "All Sectors" : reg}
              </button>
            )
          )}
        </div>
      </div>

      {/* SAFETY UPDATES FEED */}
      <div>
        <div className="flex-between" style={{ marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.375rem", fontWeight: 800, margin: 0 }}>
            Official Bulletins ({filteredUpdates.length})
          </h2>
          <span className="text-muted" style={{ fontSize: "0.875rem" }}>
            Controlled by Designated Forest Range Officers
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem 0" }}>
            <div className="spinner" style={{ margin: "0 auto 1rem" }} />
            <p className="text-muted">Loading geofenced safety bulletins...</p>
          </div>
        ) : filteredUpdates.length === 0 ? (
          <Card style={{ padding: "3.5rem 2rem", textAlign: "center" }}>
            <ShieldAlert size={48} style={{ color: "#9CA3AF", margin: "0 auto 1rem" }} />
            <h3 style={{ fontSize: "1.25rem", margin: "0 0 0.5rem" }}>No Safety Updates Found</h3>
            <p className="text-muted" style={{ maxWidth: "460px", margin: "0 auto 1.5rem" }}>
              No public advisories match your current region and severity filter criteria. Try selecting "All
              Broadcast Regions".
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedRegion("ALL");
                setSelectedSeverity("ALL");
                setSearchQuery("");
              }}
            >
              Reset Filters
            </Button>
          </Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {filteredUpdates.map((update) => {
              const sevColor = getSeverityColor(update.severity);
              const isFocused = focusedUpdateId === update.id;

              return (
                <Card
                  key={update.id}
                  style={{
                    padding: "1.75rem",
                    borderRadius: "16px",
                    border: isFocused
                      ? `2px solid ${sevColor}`
                      : "1px solid var(--border-color)",
                    boxShadow: isFocused
                      ? `0 8px 25px ${sevColor}25`
                      : "0 4px 15px rgba(0,0,0,0.03)",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div
                    className="flex-between"
                    style={{ flexWrap: "wrap", gap: "0.75rem", marginBottom: "0.75rem" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flexWrap: "wrap" }}>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          padding: "0.25rem 0.625rem",
                          borderRadius: "9999px",
                          backgroundColor: `${sevColor}18`,
                          color: sevColor,
                          border: `1px solid ${sevColor}44`,
                        }}
                      >
                        {update.severity || "Medium"} Severity
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
                        {update.category}
                      </span>

                      {update.radius_km && (
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            color: "#D97706",
                            backgroundColor: "#FEF3C7",
                            padding: "0.25rem 0.625rem",
                            borderRadius: "9999px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                          }}
                        >
                          <Radio size={12} /> {update.radius_km} km Geofenced Risk
                        </span>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                      <Clock size={14} />
                      <span>{new Date(update.created_at || Date.now()).toLocaleString()}</span>
                    </div>
                  </div>

                  <h3
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: 800,
                      margin: "0 0 0.5rem",
                      color: "var(--text-primary)",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {update.title}
                  </h3>

                  <p
                    style={{
                      fontSize: "0.9375rem",
                      color: "var(--text-secondary)",
                      lineHeight: 1.6,
                      margin: "0 0 1rem",
                    }}
                  >
                    {update.message}
                  </p>

                  {/* TARGET REGIONS CONTROLS DISPLAY */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      flexWrap: "wrap",
                      marginBottom: "1.25rem",
                      padding: "0.75rem 1rem",
                      background: "var(--background-secondary, #F9FAFB)",
                      borderRadius: "10px",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)" }}>
                      Broadcast Authorized For:
                    </span>
                    {(update.target_regions || [update.location || "Mumbai & MMR"]).map((reg) => (
                      <span
                        key={reg}
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          backgroundColor: "#E0F2FE",
                          color: "#0369A1",
                          padding: "0.125rem 0.5rem",
                          borderRadius: "6px",
                        }}
                      >
                        {reg}
                      </span>
                    ))}
                  </div>

                  {/* CARD FOOTER */}
                  <div
                    className="flex-between"
                    style={{
                      paddingTop: "1rem",
                      borderTop: "1px solid var(--border-color)",
                      flexWrap: "wrap",
                      gap: "0.75rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "50%",
                          background: "linear-gradient(135deg, #166534 0%, #15803D 100%)",
                          color: "#FFFFFF",
                          display: "grid",
                          placeItems: "center",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                        }}
                      >
                        FO
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: "0.8125rem", fontWeight: 700 }}>
                          {update.author || "Forest Command"}
                        </p>
                        <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {update.author_role || "Range Officer"} • Verified Bulletin
                        </p>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFocusOnMap(update)}
                        icon={MapPin}
                        style={{
                          color: sevColor,
                          borderColor: `${sevColor}66`,
                          backgroundColor: `${sevColor}0A`,
                        }}
                      >
                        Locate on Geofence Map
                      </Button>
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
