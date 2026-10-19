import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  AlertTriangle,
  Send,
  ArrowLeft,
  Radio,
  CheckCircle2,
  Mail,
  BellRing,
  ShieldAlert,
  Sparkles,
  Layers,
  Info,
  ExternalLink,
  Users,
  UserCheck,
  RefreshCw,
  UserPlus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { apiService } from "../services/api";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { AlertMessage } from "../components/ui/AlertMessage";
import { AiWritingAssistant } from "../components/ui/AiWritingAssistant";
import { GeofenceMap } from "../components/ui/GeofenceMap";
import { useAuth } from "../contexts/AuthContext";

const MUMBAI_PRESETS = [
  {
    name: "SGNP Borivali Main Gate Buffer",
    district: "Mumbai Suburban",
    lat: 19.2288,
    lng: 72.8570,
    defaultRadius: 5.0,
  },
  {
    name: "Aarey Milk Colony Unit 16 & JVLR Corridor",
    district: "Mumbai Suburban",
    lat: 19.1485,
    lng: 72.8718,
    defaultRadius: 4.5,
  },
  {
    name: "Ghodbunder Road Ghat & Chena Creek",
    district: "Thane",
    lat: 19.2785,
    lng: 72.9240,
    defaultRadius: 5.5,
  },
  {
    name: "Yeoor Hills & Upvan Lake Buffer",
    district: "Thane",
    lat: 19.2183,
    lng: 72.9463,
    defaultRadius: 4.0,
  },
  {
    name: "Thane Creek Flamingo Sanctuary & Airoli",
    district: "Navi Mumbai",
    lat: 19.1623,
    lng: 72.9967,
    defaultRadius: 6.0,
  },
  {
    name: "Tungareshwar Sanctuary Buffer (Vasai)",
    district: "Palghar",
    lat: 19.4350,
    lng: 72.8870,
    defaultRadius: 6.5,
  },
];

export const CreateGeographicAlertPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: "",
    severity: "High", // "Low", "Medium", "High", "Critical"
    alert_type: "Wildlife Hazard",
    target_latitude: 19.2288,
    target_longitude: 72.8570,
    radius_km: 5.0,
    region_name: "SGNP Borivali Main Gate Buffer",
    message: "",
  });

  const [awsSettings, setAwsSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dispatchResult, setDispatchResult] = useState(null);

  // Real Registered Residents & Audience Targeting State
  const [audienceData, setAudienceData] = useState({
    matched_count: 0,
    total_registered_citizens: 0,
    matched_citizens: [],
    all_citizens: [],
  });
  const [audienceLoading, setAudienceLoading] = useState(false);
  const [showOutsideResidents, setShowOutsideResidents] = useState(false);

  // Quick Add Resident into this active Area State
  const [showQuickAddResident, setShowQuickAddResident] = useState(false);
  const [newResidentForm, setNewResidentForm] = useState({
    name: "",
    email: "",
    address: "",
    district: "Mumbai Suburban",
    latitude: 19.2288,
    longitude: 72.8570,
  });
  const [quickAddLoading, setQuickAddLoading] = useState(false);
  const [quickAddMsg, setQuickAddMsg] = useState("");

  // Load AWS settings on mount
  useEffect(() => {
    apiService
      .getAwsSettings()
      .then((data) => setAwsSettings(data))
      .catch((err) => console.warn("AWS settings fetch:", err));
  }, []);

  // Fetch real created residents inside/outside active geofence
  const fetchAudience = async () => {
    setAudienceLoading(true);
    try {
      const data = await apiService.previewGeofenceAudience({
        latitude: parseFloat(formData.target_latitude),
        longitude: parseFloat(formData.target_longitude),
        radius_km: parseFloat(formData.radius_km),
      });
      if (data) {
        setAudienceData({
          matched_count: data.matched_count || 0,
          total_registered_citizens: data.total_registered_citizens || 0,
          matched_citizens: data.matched_citizens || [],
          all_citizens: data.all_citizens || [],
        });
      }
    } catch (err) {
      console.warn("Could not preview geofence audience:", err);
    } finally {
      setAudienceLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchAudience, 250);
    return () => clearTimeout(timer);
  }, [formData.target_latitude, formData.target_longitude, formData.radius_km]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleApplyPreset = (preset) => {
    setFormData((prev) => ({
      ...prev,
      region_name: preset.name,
      target_latitude: preset.lat,
      target_longitude: preset.lng,
      radius_km: preset.defaultRadius,
    }));
  };

  const handleMapLocationChange = ({ latitude, longitude, locationName }) => {
    setFormData((prev) => ({
      ...prev,
      target_latitude: parseFloat(latitude),
      target_longitude: parseFloat(longitude),
      region_name: locationName || prev.region_name,
    }));
  };

  const handleMapRadiusChange = (newRadius) => {
    setFormData((prev) => ({
      ...prev,
      radius_km: parseFloat(newRadius),
    }));
  };

  const handleApplyAiMessage = ({ title, message }) => {
    setFormData((prev) => ({
      ...prev,
      title: title || prev.title,
      message: message || prev.message,
    }));
  };

  const handleQuickAddResident = async (e) => {
    e.preventDefault();
    if (!newResidentForm.name || !newResidentForm.email) {
      setQuickAddMsg("Please provide resident name and email.");
      return;
    }
    setQuickAddLoading(true);
    setQuickAddMsg("");
    try {
      await apiService.createCitizen({
        name: newResidentForm.name,
        email: newResidentForm.email,
        address: newResidentForm.address || `${formData.region_name} Enclave`,
        district: newResidentForm.district || "Mumbai Suburban",
        latitude: parseFloat(newResidentForm.latitude || formData.target_latitude),
        longitude: parseFloat(newResidentForm.longitude || formData.target_longitude),
      });
      setQuickAddMsg("✓ Resident created successfully! Pin is now visible on the map.");
      setShowQuickAddResident(false);
      setNewResidentForm({
        name: "",
        email: "",
        address: "",
        district: "Mumbai Suburban",
        latitude: formData.target_latitude,
        longitude: formData.target_longitude,
      });
      await fetchAudience();
      setTimeout(() => setQuickAddMsg(""), 4500);
    } catch (err) {
      setQuickAddMsg("Error creating resident: " + err.message);
    } finally {
      setQuickAddLoading(false);
    }
  };

  const isHighSeverity =
    formData.severity === "High" || formData.severity === "Critical";

  // Priority color-coding
  const getPriorityTheme = () => {
    if (formData.severity === "Low") {
      return {
        color: "#10B981",
        bg: "#ECFDF5",
        border: "#A7F3D0",
        label: "Low Priority",
        channelText: "In-App Notification Only",
        badge: "📱 App Push",
      };
    }
    if (formData.severity === "Medium") {
      return {
        color: "#F59E0B",
        bg: "#FFFBEB",
        border: "#FDE68A",
        label: "Medium Priority",
        channelText: "In-App Notification Only",
        badge: "📱 App Push",
      };
    }
    return {
      color: "#EF4444",
      bg: "#FEF2F2",
      border: "#FECACA",
      label: "High Priority (Critical)",
      channelText: "In-App Push + Email / Gmail via AWS SES/SNS",
      badge: "📱 App + ✉️ Gmail (AWS SES/SNS)",
    };
  };

  const theme = getPriorityTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setDispatchResult(null);

    if (!formData.title.trim() || !formData.message.trim() || !formData.region_name.trim()) {
      setError("Please complete all required fields (Title, Location, Message).");
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.createGeographicAlert({
        title: formData.title,
        severity: formData.severity,
        alert_type: formData.alert_type,
        message: formData.message,
        location: formData.region_name,
        latitude: parseFloat(formData.target_latitude),
        longitude: parseFloat(formData.target_longitude),
        radius_km: parseFloat(formData.radius_km),
        source: user?.assigned_station
          ? `${user.assigned_station} (Officer ${user.name || "Command"})`
          : "Mumbai Forest Command & Disaster Management (MMR)",
      });

      setDispatchResult(response);
    } catch (err) {
      setError(err.message || "Failed to broadcast geofenced alert.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "1160px", margin: "0 auto", paddingBottom: "4rem" }}>
      {/* HEADER SECTION */}
      <div style={{ marginBottom: "1.75rem" }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "none",
            border: "none",
            color: "var(--primary-green)",
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.375rem",
            marginBottom: "0.5rem",
            fontSize: "0.875rem",
          }}
        >
          <ArrowLeft size={16} /> Back to Officer Command
        </button>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  backgroundColor: "#DC2626",
                  color: "#FFFFFF",
                  padding: "0.2rem 0.625rem",
                  borderRadius: "9999px",
                  letterSpacing: "0.5px",
                }}
              >
                OFFICER DISPATCH ENGINE
              </span>
              <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: 600 }}>
                Mumbai Metropolitan Region
              </span>
            </div>
            <h1 style={{ fontSize: "2.125rem", margin: 0, fontWeight: 800, letterSpacing: "-0.02em" }}>
              Geofenced Notification & Safety Broadcast
            </h1>
            <p className="text-muted" style={{ fontSize: "0.9375rem", margin: "0.375rem 0 0" }}>
              Issue a perimeter-fenced emergency warning. Targeted citizens strictly within the geofence receive app notifications, plus email via AWS SES/SNS for high severity.
            </p>
          </div>

          {/* AWS STATUS PILL */}
          {awsSettings && (
            <div
              style={{
                backgroundColor: "#F0FDF4",
                border: "1px solid #BBF7D0",
                padding: "0.625rem 1rem",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                gap: "0.625rem",
                fontSize: "0.8125rem",
                color: "#166534",
              }}
            >
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#16A34A", animation: "pulse 2s infinite" }} />
              <div>
                <strong>AWS SES & SNS Active:</strong> <span style={{ fontFamily: "monospace" }}>{awsSettings.region}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DISPATCH SUCCESS MODAL / BANNER */}
      {dispatchResult && (
        <Card
          style={{
            padding: "1.75rem",
            marginBottom: "2rem",
            backgroundColor: "#ECFDF5",
            border: "2px solid #10B981",
            boxShadow: "0 8px 24px rgba(16, 185, 129, 0.15)",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
            <div
              style={{
                backgroundColor: "#10B981",
                color: "#FFFFFF",
                borderRadius: "50%",
                padding: "0.5rem",
                display: "grid",
                placeItems: "center",
              }}
            >
              <CheckCircle2 size={24} />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                <h3 style={{ margin: 0, color: "#065F46", fontSize: "1.25rem", fontWeight: 800 }}>
                  Geofenced Notification Successfully Dispatched!
                </h3>
                <span
                  style={{
                    backgroundColor: theme.color,
                    color: "#FFFFFF",
                    padding: "0.25rem 0.75rem",
                    borderRadius: "9999px",
                    fontWeight: 700,
                    fontSize: "0.75rem",
                  }}
                >
                  {dispatchResult.alert?.priority_label}
                </span>
              </div>

              <p style={{ margin: "0.5rem 0 1rem", color: "#047857", fontSize: "0.9375rem" }}>
                {dispatchResult.message}
              </p>

              {/* METRICS ROW */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem", marginBottom: "1rem" }}>
                <div style={{ backgroundColor: "#FFFFFF", padding: "0.75rem 1rem", borderRadius: "10px", border: "1px solid #A7F3D0" }}>
                  <div style={{ fontSize: "0.75rem", color: "#6B7280", fontWeight: 600 }}>Active Geofence Border</div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#065F46" }}>
                    {dispatchResult.alert?.radius_km || formData.radius_km} km Perimeter
                  </div>
                </div>

                <div style={{ backgroundColor: "#FFFFFF", padding: "0.75rem 1rem", borderRadius: "10px", border: "1px solid #A7F3D0" }}>
                  <div style={{ fontSize: "0.75rem", color: "#6B7280", fontWeight: 600 }}>Delivery Channels Used</div>
                  <div style={{ fontSize: "1rem", fontWeight: 800, color: "#065F46", marginTop: "0.25rem" }}>
                    {dispatchResult.channels_used?.map((c) => c.toUpperCase()).join(" + ")}
                  </div>
                </div>

                <div style={{ backgroundColor: "#FFFFFF", padding: "0.75rem 1rem", borderRadius: "10px", border: "1px solid #A7F3D0" }}>
                  <div style={{ fontSize: "0.75rem", color: "#6B7280", fontWeight: 600 }}>AWS Notification Dispatch</div>
                  <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#065F46", marginTop: "0.25rem" }}>
                    {isHighSeverity ? "Dispatched via AWS SES / SNS" : "App Broadcast Active"}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate("/alerts")}
                  style={{ backgroundColor: "#059669", borderColor: "#047857" }}
                >
                  View Alerts Board
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDispatchResult(null)}
                >
                  Create Another Alert
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* AI ASSISTANT EXPANDER */}
      <AiWritingAssistant
        onApplyMessage={handleApplyAiMessage}
        initialCategory="Geographic Emergency Alert"
      />

      {/* MAIN TWO-COLUMN FORM LAYOUT */}
      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: "1.75rem", alignItems: "start" }}>
          
          {/* LEFT COLUMN: INTERACTIVE GEOFENCE MAP & PERIMETER SETTINGS */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <Card style={{ padding: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.875rem", flexWrap: "wrap", gap: "0.5rem" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 800 }}>
                    1. Define Exact Geofence Border on Map
                  </h3>
                  <p style={{ margin: "0.25rem 0 0", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                    The dashed border is the exact boundary. Only citizens inside this perimeter will be alerted.
                  </p>
                </div>

                {/* ACTIVE PERIMETER BADGE */}
                <div
                  style={{
                    backgroundColor: theme.bg,
                    border: `1.5px solid ${theme.border}`,
                    color: theme.color,
                    padding: "0.375rem 0.875rem",
                    borderRadius: "9999px",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontWeight: 700,
                    fontSize: "0.8125rem",
                  }}
                >
                  <Radio size={14} />
                  <span>{formData.radius_km.toFixed(1)} km Perimeter Active</span>
                </div>
              </div>

              {/* GEOFENCE MAP COMPONENT */}
              <GeofenceMap
                latitude={formData.target_latitude}
                longitude={formData.target_longitude}
                radiusKm={formData.radius_km}
                severity={formData.severity}
                locationName={formData.region_name}
                residents={audienceData.all_citizens}
                onLocationChange={handleMapLocationChange}
                onRadiusChange={handleMapRadiusChange}
                height="450px"
              />

              {/* MUMBAI HOTSPOT PRESET BUTTONS */}
              <div style={{ marginTop: "1rem" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Quick Mumbai Hotspot Presets:
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
                  {MUMBAI_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(p)}
                      style={{
                        fontSize: "0.75rem",
                        padding: "0.35rem 0.75rem",
                        borderRadius: "8px",
                        border:
                          formData.region_name === p.name
                            ? `1.5px solid ${theme.color}`
                            : "1px solid var(--border-color)",
                        backgroundColor:
                          formData.region_name === p.name ? theme.bg : "#FFFFFF",
                        color:
                          formData.region_name === p.name
                            ? theme.color
                            : "var(--charcoal)",
                        fontWeight: formData.region_name === p.name ? 700 : 500,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* COORDINATES & MANUAL RADIUS INPUTS */}
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "0.875rem", marginTop: "1.25rem", paddingTop: "1.25rem", borderTop: "1px solid var(--border-color)" }}>
                <div>
                  <label htmlFor="region_name" style={{ fontSize: "0.8125rem", fontWeight: 700 }}>
                    Location / Sector Label *
                  </label>
                  <input
                    id="region_name"
                    name="region_name"
                    type="text"
                    value={formData.region_name}
                    onChange={handleChange}
                    required
                    style={{ fontSize: "0.875rem" }}
                  />
                </div>

                <div>
                  <label htmlFor="target_latitude" style={{ fontSize: "0.8125rem", fontWeight: 700 }}>
                    Center Latitude
                  </label>
                  <input
                    id="target_latitude"
                    name="target_latitude"
                    type="number"
                    step="any"
                    value={formData.target_latitude}
                    onChange={handleChange}
                    required
                    style={{ fontSize: "0.875rem" }}
                  />
                </div>

                <div>
                  <label htmlFor="target_longitude" style={{ fontSize: "0.8125rem", fontWeight: 700 }}>
                    Center Longitude
                  </label>
                  <input
                    id="target_longitude"
                    name="target_longitude"
                    type="number"
                    step="any"
                    value={formData.target_longitude}
                    onChange={handleChange}
                    required
                    style={{ fontSize: "0.875rem" }}
                  />
                </div>
              </div>
            </Card>

            {/* PERIMETER COVERAGE & REAL REGISTERED RESIDENTS */}
            <Card style={{ padding: "1.25rem", backgroundColor: "var(--bg-warm)" }}>
              {/* HEADER WITH RESIDENTS COUNTER & ACTIONS */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                  <Users size={18} style={{ color: "var(--primary-green)" }} />
                  <div>
                    <h4 style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 800 }}>
                      Residents Located in this Area
                    </h4>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      Real registered residents within this {formData.radius_km.toFixed(1)} km circle
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={fetchAudience}
                    title="Refresh residents from database"
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid var(--border-color)",
                      borderRadius: "8px",
                      padding: "0.35rem 0.65rem",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--charcoal)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                    }}
                  >
                    <RefreshCw size={13} style={{ animation: audienceLoading ? "spin 1s linear infinite" : "none" }} />
                    <span>Refresh</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowQuickAddResident(!showQuickAddResident);
                      setNewResidentForm((prev) => ({
                        ...prev,
                        latitude: formData.target_latitude,
                        longitude: formData.target_longitude,
                        address: `${formData.region_name} Enclave`,
                      }));
                    }}
                    style={{
                      background: showQuickAddResident ? "var(--charcoal)" : "var(--primary-green)",
                      border: "none",
                      color: "#FFFFFF",
                      borderRadius: "8px",
                      padding: "0.35rem 0.75rem",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                    }}
                  >
                    <UserPlus size={13} />
                    <span>{showQuickAddResident ? "Close" : "+ Add Resident in Area"}</span>
                  </button>
                </div>
              </div>

              {/* QUICK ADD RESIDENT IN GEOFENCE FORM */}
              {showQuickAddResident && (
                <div
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1.5px solid var(--primary-green)",
                    borderRadius: "10px",
                    padding: "1rem",
                    marginBottom: "1rem",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <strong style={{ fontSize: "0.8125rem", color: "var(--primary-green)" }}>
                      Quick Add & Pin Resident to This Exact Area
                    </strong>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      Will instantly appear on officer map
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <div>
                      <label style={{ fontSize: "0.6875rem", fontWeight: 700, display: "block", marginBottom: "0.15rem" }}>
                        Resident Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Rahul Sharma"
                        value={newResidentForm.name}
                        onChange={(e) => setNewResidentForm({ ...newResidentForm, name: e.target.value })}
                        style={{ fontSize: "0.8125rem", padding: "0.35rem 0.5rem" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.6875rem", fontWeight: 700, display: "block", marginBottom: "0.15rem" }}>
                        Email (Receives Alert) *
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. rahul@example.com"
                        value={newResidentForm.email}
                        onChange={(e) => setNewResidentForm({ ...newResidentForm, email: e.target.value })}
                        style={{ fontSize: "0.8125rem", padding: "0.35rem 0.5rem" }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: "0.5rem" }}>
                    <label style={{ fontSize: "0.6875rem", fontWeight: 700, display: "block", marginBottom: "0.15rem" }}>
                      Address / Locality
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Kanheri Gate Enclave, Borivali East"
                      value={newResidentForm.address}
                      onChange={(e) => setNewResidentForm({ ...newResidentForm, address: e.target.value })}
                      style={{ fontSize: "0.8125rem", padding: "0.35rem 0.5rem" }}
                    />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
                      📍 Coordinates: {newResidentForm.latitude}, {newResidentForm.longitude}
                    </span>
                    <button
                      type="button"
                      disabled={quickAddLoading}
                      onClick={handleQuickAddResident}
                      style={{
                        backgroundColor: "var(--primary-green)",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: "6px",
                        padding: "0.4rem 0.85rem",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {quickAddLoading ? "Saving Resident..." : "Save Resident & Pin on Map"}
                    </button>
                  </div>
                  {quickAddMsg && (
                    <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: quickAddMsg.startsWith("✓") ? "#059669" : "#DC2626", fontWeight: 600 }}>
                      {quickAddMsg}
                    </div>
                  )}
                </div>
              )}

              {/* AUDIENCE METRIC TILES */}
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "0.625rem", marginBottom: "0.875rem" }}>
                <div style={{ backgroundColor: "#FFFFFF", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                  <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Residents in Fence</div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 800, color: audienceData.matched_count > 0 ? "#10B981" : "var(--charcoal)", marginTop: "0.15rem" }}>
                    {audienceData.matched_count}{" "}
                    <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)" }}>
                      / {audienceData.total_registered_citizens} total
                    </span>
                  </div>
                </div>

                <div style={{ backgroundColor: "#FFFFFF", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                  <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Boundary Radius</div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 800, color: theme.color, marginTop: "0.15rem" }}>
                    {formData.radius_km.toFixed(1)} km
                  </div>
                </div>

                <div style={{ backgroundColor: "#FFFFFF", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                  <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Calculated Area</div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--charcoal)", marginTop: "0.15rem" }}>
                    {(Math.PI * Math.pow(formData.radius_km, 2)).toFixed(1)} km²
                  </div>
                </div>
              </div>

              {/* RESIDENTS IN GEOFENCE LIST */}
              <div style={{ backgroundColor: "#FFFFFF", borderRadius: "10px", border: "1px solid var(--border-color)", overflow: "hidden" }}>
                <div style={{ padding: "0.625rem 0.875rem", backgroundColor: "#F8FAFC", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--charcoal)" }}>
                    Residents Targeted by this Alert Perimeter:
                  </span>
                  <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: audienceData.matched_count > 0 ? "#059669" : "#64748B" }}>
                    {audienceData.matched_count} in range
                  </span>
                </div>

                {audienceData.matched_citizens.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {audienceData.matched_citizens.map((cit, idx) => (
                      <div
                        key={cit.id || idx}
                        style={{
                          padding: "0.75rem 0.875rem",
                          borderBottom: idx < audienceData.matched_citizens.length - 1 ? "1px solid #F1F5F9" : "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "0.75rem",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                          <div
                            style={{
                              width: "30px",
                              height: "30px",
                              borderRadius: "50%",
                              backgroundColor: "#ECFDF5",
                              border: "1.5px solid #10B981",
                              color: "#059669",
                              display: "grid",
                              placeItems: "center",
                              fontSize: "0.75rem",
                              fontWeight: 800,
                              flexShrink: 0,
                            }}
                          >
                            👤
                          </div>
                          <div>
                            <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--charcoal)" }}>
                              {cit.name}
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                              {cit.email} {cit.address ? `• ${cit.address}` : ""}
                            </div>
                          </div>
                        </div>

                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <span
                            style={{
                              fontSize: "0.6875rem",
                              fontWeight: 700,
                              backgroundColor: "#ECFDF5",
                              color: "#065F46",
                              padding: "0.2rem 0.5rem",
                              borderRadius: "9999px",
                              border: "1px solid #A7F3D0",
                              display: "inline-block",
                              marginBottom: "0.2rem",
                            }}
                          >
                            ● Inside ({cit.distance_km} km)
                          </span>
                          <div style={{ fontSize: "0.6875rem", color: theme.color, fontWeight: 600 }}>
                            {theme.badge}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: "1.25rem", textAlign: "center" }}>
                    <div style={{ fontSize: "1.25rem", marginBottom: "0.25rem" }}>📍</div>
                    <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--charcoal)" }}>
                      No registered residents found inside this {formData.radius_km.toFixed(1)} km perimeter
                    </div>
                    <p style={{ margin: "0.25rem 0 0.75rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      Only residents you created appear here. Move the map center or increase radius, or click "+ Add Resident in Area" above.
                    </p>
                  </div>
                )}
              </div>

              {/* OUTSIDE GEOFENCE COLLAPSIBLE LIST */}
              {audienceData.all_citizens.length > audienceData.matched_citizens.length && (
                <div style={{ marginTop: "0.75rem" }}>
                  <button
                    type="button"
                    onClick={() => setShowOutsideResidents(!showOutsideResidents)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      padding: 0,
                    }}
                  >
                    {showOutsideResidents ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    <span>
                      {audienceData.all_citizens.length - audienceData.matched_citizens.length} registered resident(s) outside perimeter (will NOT be alerted)
                    </span>
                  </button>

                  {showOutsideResidents && (
                    <div style={{ marginTop: "0.5rem", backgroundColor: "#FFFFFF", borderRadius: "8px", border: "1px solid var(--border-color)", padding: "0.5rem" }}>
                      {audienceData.all_citizens
                        .filter((c) => !c.in_geofence)
                        .map((cit, idx) => (
                          <div
                            key={cit.id || idx}
                            style={{
                              padding: "0.35rem 0.5rem",
                              fontSize: "0.75rem",
                              display: "flex",
                              justifyContent: "space-between",
                              color: "#64748B",
                              borderBottom: "1px solid #F1F5F9",
                            }}
                          >
                            <span>👤 {cit.name} ({cit.email})</span>
                            <span style={{ color: "#94A3B8" }}>{cit.distance_km} km away</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              <div style={{ marginTop: "0.75rem", padding: "0.625rem 0.75rem", borderRadius: "8px", backgroundColor: theme.bg, border: `1px solid ${theme.border}`, fontSize: "0.75rem", color: theme.color, fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Info size={14} />
                <span>Delivery Policy: {theme.channelText}</span>
              </div>
            </Card>
          </div>

          {/* RIGHT COLUMN: PRIORITY POLICY, CONTENT & DISPATCH */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <Card style={{ padding: "1.5rem" }}>
              <h3 style={{ margin: "0 0 1rem", fontSize: "1.125rem", fontWeight: 800 }}>
                2. Notification Severity & Delivery Policy
              </h3>

              {/* SEVERITY SELECTION CARDS */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.25rem" }}>
                {[
                  {
                    level: "Low",
                    name: "Low Priority — Caution",
                    color: "#10B981",
                    channels: "In-App Push Only",
                    desc: "Advisories, minor trail warnings, controlled burns.",
                  },
                  {
                    level: "Medium",
                    name: "Medium Priority — Elevated Risk",
                    color: "#F59E0B",
                    channels: "In-App Push Only",
                    desc: "Wildlife transit near fringes, heavy rainfall watch.",
                  },
                  {
                    level: "High",
                    name: "High Priority — Critical Emergency",
                    color: "#EF4444",
                    channels: "In-App Push + Email (Gmail) via AWS",
                    desc: "Flash flood, active predator intrusion, road collapse.",
                  },
                ].map((s) => {
                  const isSelected = formData.severity === s.level;
                  return (
                    <div
                      key={s.level}
                      onClick={() => setFormData((prev) => ({ ...prev, severity: s.level }))}
                      style={{
                        padding: "0.875rem 1rem",
                        borderRadius: "10px",
                        border: isSelected
                          ? `2px solid ${s.color}`
                          : "1px solid var(--border-color)",
                        backgroundColor: isSelected ? "#FFFFFF" : "var(--bg-warm)",
                        cursor: "pointer",
                        boxShadow: isSelected ? `0 4px 12px ${s.color}22` : "none",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <div
                            style={{
                              width: "12px",
                              height: "12px",
                              borderRadius: "50%",
                              backgroundColor: s.color,
                            }}
                          />
                          <strong style={{ fontSize: "0.875rem", color: "var(--charcoal)" }}>
                            {s.name}
                          </strong>
                        </div>

                        <span
                          style={{
                            fontSize: "0.6875rem",
                            fontWeight: 800,
                            padding: "0.15rem 0.5rem",
                            borderRadius: "9999px",
                            backgroundColor: isSelected ? s.color : "#E5E7EB",
                            color: isSelected ? "#FFFFFF" : "#4B5563",
                          }}
                        >
                          {s.channels}
                        </span>
                      </div>
                      <p style={{ margin: "0.35rem 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {s.desc}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* CHANNELS ACTIVE SUMMARY BANNER */}
              <div
                style={{
                  backgroundColor: theme.bg,
                  border: `1.5px solid ${theme.border}`,
                  padding: "0.75rem 1rem",
                  borderRadius: "10px",
                  marginBottom: "1.25rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: theme.color, fontWeight: 800, fontSize: "0.875rem" }}>
                  {isHighSeverity ? <Mail size={16} /> : <BellRing size={16} />}
                  <span>{theme.label} Notification Rule Active</span>
                </div>
                <div style={{ fontSize: "0.8125rem", color: "var(--charcoal)", marginTop: "0.25rem", lineHeight: 1.5 }}>
                  {isHighSeverity ? (
                    <>
                      Residents inside the {formData.radius_km} km geofence will receive both an <strong>In-App Alert</strong> and an official <strong>Gmail / Email Emergency Alert</strong> via AWS SES & SNS.
                    </>
                  ) : (
                    <>
                      Residents inside the {formData.radius_km} km geofence will receive an <strong>In-App Push Notification</strong> only.
                    </>
                  )}
                </div>
              </div>

              {/* ALERT TITLE & CATEGORY */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label htmlFor="title" style={{ fontSize: "0.8125rem", fontWeight: 700 }}>
                    Alert Headline / Title *
                  </label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    placeholder="e.g. CRITICAL: Flash Waterlogging on WEH Borivali Fringes"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    style={{ fontSize: "0.9375rem", fontWeight: 600 }}
                  />
                </div>

                <div>
                  <label htmlFor="alert_type" style={{ fontSize: "0.8125rem", fontWeight: 700 }}>
                    Alert Category *
                  </label>
                  <select
                    id="alert_type"
                    name="alert_type"
                    value={formData.alert_type}
                    onChange={handleChange}
                    style={{ fontSize: "0.875rem", fontWeight: 600 }}
                  >
                    <option value="Wildlife Hazard">Wildlife Hazard / Active Leopard Transit</option>
                    <option value="Flood Warning">Flash Flood / High Tide Waterlogging</option>
                    <option value="Road Blockade">Highway Blockade / Fallen Banyan Tree</option>
                    <option value="Landslide Debris">Landslide & Ghat Boulder Obstruction</option>
                    <option value="Evacuation Order">Immediate Evacuation Directive</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" style={{ fontSize: "0.8125rem", fontWeight: 700 }}>
                    Safety Instructions & Directives *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    placeholder="State exact safety instructions, emergency evacuation routes, and caution directives..."
                    value={formData.message}
                    onChange={handleChange}
                    required
                    style={{ fontSize: "0.875rem", lineHeight: 1.5 }}
                  />
                </div>
              </div>

              {/* LIVE MESSAGE CARD PREVIEW */}
              <div style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid var(--border-color)" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                  Live Notification Card Preview:
                </span>

                <div
                  style={{
                    marginTop: "0.5rem",
                    backgroundColor: theme.bg,
                    border: `1.5px solid ${theme.border}`,
                    borderLeft: `5px solid ${theme.color}`,
                    borderRadius: "10px",
                    padding: "0.875rem 1rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                    <span
                      style={{
                        fontSize: "0.6875rem",
                        fontWeight: 800,
                        backgroundColor: theme.color,
                        color: "#FFFFFF",
                        padding: "0.15rem 0.5rem",
                        borderRadius: "9999px",
                      }}
                    >
                      {formData.severity.toUpperCase()} PRIORITY
                    </span>
                    <span style={{ fontSize: "0.6875rem", color: theme.color, fontWeight: 700 }}>
                      {theme.badge}
                    </span>
                  </div>

                  <strong style={{ display: "block", fontSize: "0.9375rem", color: "var(--charcoal)", marginTop: "0.25rem" }}>
                    {formData.title || "Alert Title Will Appear Here"}
                  </strong>
                  <p style={{ margin: "0.25rem 0 0.5rem", fontSize: "0.8125rem", color: "#374151" }}>
                    {formData.message || "Safety instructions and evacuation directives will appear here..."}
                  </p>
                  <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
                    <span>📍 {formData.region_name}</span>
                    <span>Exact Fence: {formData.radius_km} km</span>
                  </div>
                </div>
              </div>

              {error && <div style={{ marginTop: "1rem" }}><AlertMessage type="error" message={error} /></div>}

              {/* SUBMIT BUTTON */}
              <div style={{ marginTop: "1.5rem" }}>
                <Button
                  variant="primary"
                  type="submit"
                  loading={loading}
                  icon={Send}
                  style={{
                    width: "100%",
                    height: "48px",
                    backgroundColor: theme.color,
                    borderColor: theme.color,
                    fontSize: "1rem",
                    fontWeight: 700,
                    boxShadow: `0 4px 14px ${theme.color}44`,
                  }}
                >
                  {loading
                    ? "Broadcasting via Geofence & AWS..."
                    : `Broadcast Geofenced Alert (${audienceData.matched_count} Resident${audienceData.matched_count === 1 ? "" : "s"} in Fence)`}
                </Button>
              </div>
            </Card>
          </div>

        </div>
      </form>
    </div>
  );
};
