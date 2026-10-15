import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Info,
  Send,
  ArrowLeft,
  CheckCircle2,
  Radio,
  MapPin,
  Compass,
  AlertTriangle,
  Plus,
  X,
  Layers,
} from "lucide-react";
import { apiService } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { AlertMessage } from "../components/ui/AlertMessage";
import { AiWritingAssistant } from "../components/ui/AiWritingAssistant";

const AVAILABLE_REGIONS = [
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

const PRESET_LOCATIONS = [
  { name: "SGNP Borivali Main Gate Buffer", lat: 19.2288, lng: 72.8570 },
  { name: "Aarey Colony Unit 16 & JVLR Junction", lat: 19.1485, lng: 72.8718 },
  { name: "Ghodbunder Road Ghat Section", lat: 19.2785, lng: 72.9240 },
  { name: "Yeoor Hills Upvan Lake Foothills", lat: 19.2183, lng: 72.9463 },
  { name: "Thane Creek Flamingo Sanctuary Boardwalk", lat: 19.1623, lng: 72.9967 },
  { name: "Tulsi & Vihar Lake Spillway Buffer", lat: 19.1820, lng: 72.9350 },
];

export const CreatePublicUpdatePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: "",
    category: "Wildlife Hazard",
    severity: "High",
    message: "",
    location: "SGNP Borivali Main Gate Buffer",
    latitude: 19.2288,
    longitude: 72.8570,
    radius_km: 3.5,
    target_regions: ["SGNP Borivali Buffer", "WEH Green Belt"],
    author: user?.name ? `Officer ${user.name}` : "Officer S. Patil (SGNP Command)",
    author_role: user?.assigned_station || "Forest Range Officer",
  });

  const [customRegionInput, setCustomRegionInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Pre-fill from report action if navigated from Officer Dashboard
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refTitle = params.get("refTitle");
    const refLoc = params.get("refLoc");
    const lat = params.get("lat");
    const lng = params.get("lng");

    if (refTitle || refLoc) {
      setFormData((prev) => ({
        ...prev,
        title: refTitle ? `Advisory: ${refTitle}` : prev.title,
        location: refLoc || prev.location,
        latitude: lat ? parseFloat(lat) : prev.latitude,
        longitude: lng ? parseFloat(lng) : prev.longitude,
        message: refTitle
          ? `OFFICIAL GEOFENCED ADVISORY FOR ${refLoc ? refLoc.toUpperCase() : "AFFECTED ZONE"}:\n\nActive incident report "${refTitle}" is currently being responded to by forest patrol squads. Citizens in this perimeter are advised to exercise heightened caution and adhere to ranger directions.`
          : prev.message,
      }));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyAiMessage = ({ title, message, category, severity }) => {
    setFormData((prev) => ({
      ...prev,
      title: title || prev.title,
      message: message || prev.message,
      category: category || prev.category,
      severity: severity || prev.severity,
    }));
  };

  const toggleRegion = (region) => {
    setFormData((prev) => {
      const exists = prev.target_regions.includes(region);
      if (exists) {
        return {
          ...prev,
          target_regions: prev.target_regions.filter((r) => r !== region),
        };
      } else {
        return {
          ...prev,
          target_regions: [...prev.target_regions, region],
        };
      }
    });
  };

  const handleAddCustomRegion = (e) => {
    e.preventDefault();
    const trimmed = customRegionInput.trim();
    if (trimmed && !formData.target_regions.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        target_regions: [...prev.target_regions, trimmed],
      }));
      setCustomRegionInput("");
    }
  };

  const handleSelectPresetLocation = (preset) => {
    setFormData((prev) => ({
      ...prev,
      location: preset.name,
      latitude: preset.lat,
      longitude: preset.lng,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.title || !formData.message) {
      setError("Please fill in both the advisory title and message.");
      return;
    }

    if (formData.target_regions.length === 0) {
      setError("Please designate at least one target region to authorize broadcasts.");
      return;
    }

    setLoading(true);
    try {
      await apiService.createPublicUpdate({
        ...formData,
        radius_km: parseFloat(formData.radius_km) || 3.0,
        latitude: parseFloat(formData.latitude) || 11.6054,
        longitude: parseFloat(formData.longitude) || 76.083,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate("/updates");
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to publish geofenced public update.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "880px", margin: "0 auto", paddingBottom: "5rem" }}>
      {/* NAVIGATION BACK */}
      <div style={{ marginBottom: "1.5rem" }}>
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
            marginBottom: "0.75rem",
            fontSize: "0.875rem",
          }}
        >
          <ArrowLeft size={16} /> Back to Updates
        </button>

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
          Forest Officer Command & Safety Broadcast
        </span>
        <h1 style={{ fontSize: "2.25rem", margin: 0, fontWeight: 800, letterSpacing: "-0.01em" }}>
          Publish Geofenced Public Safety Update
        </h1>
        <p className="text-muted" style={{ fontSize: "0.9375rem", marginTop: "0.35rem" }}>
          Issue official wildlife hazard warnings, road closures, or flood notices. You control the target
          broadcast regions and the spatial risk geofence radius.
        </p>
      </div>

      {/* AI VOICE & TEXT ASSISTANT */}
      <AiWritingAssistant
        onApplyMessage={handleApplyAiMessage}
        initialCategory="Public Safety Advisory"
      />

      <Card style={{ padding: "2.25rem", borderRadius: "18px", border: "1px solid var(--border-color)" }}>
        {error && <AlertMessage type="error" message={error} style={{ marginBottom: "1.5rem" }} />}
        {success && (
          <AlertMessage
            type="success"
            title="Advisory Published Successfully!"
            message="Your notice and geofenced risk field have been broadcasted to the designated regions. Redirecting to updates feed..."
            style={{ marginBottom: "1.5rem" }}
          />
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
          {/* TITLE & CATEGORY */}
          <div className="grid-cols-2" style={{ gap: "1.25rem" }}>
            <div>
              <label htmlFor="title">Advisory Title *</label>
              <input
                id="title"
                name="title"
                type="text"
                placeholder="e.g. Wild Elephant Movement Across Highway 17 Corridor"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label htmlFor="category">Hazard Category *</label>
              <select id="category" name="category" value={formData.category} onChange={handleChange}>
                <option value="Wildlife Hazard">Wildlife Hazard / Animal Sighting</option>
                <option value="Flood Warning">Flash Flood / River Waterlogging</option>
                <option value="Road Accident Hazard">Road Accident / Highway Blockage</option>
                <option value="Cleanup Progress">Debris Clearance / Road Reopened</option>
                <option value="Weather Alert">Severe Monsoon / Landslide Warning</option>
                <option value="General Safety Advisory">General Forest Buffer Advisory</option>
              </select>
            </div>
          </div>

          {/* SEVERITY & GEOFENCE RADIUS */}
          <div className="grid-cols-2" style={{ gap: "1.25rem" }}>
            <div>
              <label htmlFor="severity">Risk Severity Level *</label>
              <select id="severity" name="severity" value={formData.severity} onChange={handleChange}>
                <option value="Critical">Critical (Immediate Danger / Red Zone)</option>
                <option value="High">High (Heightened Caution / Orange Zone)</option>
                <option value="Medium">Medium (Moderate Hazard / Amber Zone)</option>
                <option value="Low">Advisory / Low (Informational / Green Zone)</option>
              </select>
            </div>

            <div>
              <div className="flex-between">
                <label htmlFor="radius_km">Geofence Risk Perimeter Radius *</label>
                <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--primary-green)" }}>
                  {formData.radius_km} km
                </span>
              </div>
              <input
                id="radius_km"
                name="radius_km"
                type="range"
                min="0.5"
                max="15.0"
                step="0.5"
                value={formData.radius_km}
                onChange={handleChange}
                style={{ width: "100%", accentColor: "var(--primary-green)", cursor: "pointer" }}
              />
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.375rem" }}>
                {[1.5, 3.0, 5.0, 8.0, 10.0].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, radius_km: r }))}
                    style={{
                      fontSize: "0.75rem",
                      padding: "0.15rem 0.5rem",
                      borderRadius: "6px",
                      border: "1px solid var(--border-color)",
                      backgroundColor: formData.radius_km === r ? "var(--primary-green)" : "transparent",
                      color: formData.radius_km === r ? "#FFFFFF" : "var(--text-secondary)",
                      cursor: "pointer",
                    }}
                  >
                    {r} km
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* REGION CONTROL (OFFICER CONTROLLED TARGET REGIONS) */}
          <div
            style={{
              padding: "1.25rem",
              borderRadius: "14px",
              backgroundColor: "var(--background-secondary, #F9FAFB)",
              border: "1px solid var(--border-color)",
            }}
          >
            <div className="flex-between" style={{ marginBottom: "0.75rem" }}>
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "0.375rem", margin: 0, fontWeight: 700 }}>
                  <Compass size={16} style={{ color: "var(--primary-green)" }} />
                  Target Broadcast Regions (Officer Controlled) *
                </label>
                <p className="text-muted" style={{ fontSize: "0.8125rem", margin: "0.125rem 0 0" }}>
                  Select the administrative sectors or ranges authorized to receive this bulletin.
                </p>
              </div>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--primary-green)" }}>
                {formData.target_regions.length} Selected
              </span>
            </div>

            {/* PREDEFINED REGION CHECK CHIPS */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
              {AVAILABLE_REGIONS.map((region) => {
                const isSelected = formData.target_regions.includes(region);
                return (
                  <button
                    key={region}
                    type="button"
                    onClick={() => toggleRegion(region)}
                    style={{
                      fontSize: "0.8125rem",
                      padding: "0.375rem 0.875rem",
                      borderRadius: "9999px",
                      border: isSelected ? "1.5px solid var(--primary-green)" : "1px solid var(--border-color)",
                      backgroundColor: isSelected ? "rgba(22, 101, 52, 0.12)" : "#FFFFFF",
                      color: isSelected ? "var(--primary-green)" : "var(--text-secondary)",
                      fontWeight: isSelected ? 700 : 500,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.375rem",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {isSelected ? <CheckCircle2 size={14} style={{ color: "var(--primary-green)" }} /> : null}
                    {region}
                  </button>
                );
              })}
            </div>

            {/* CUSTOM REGION INPUT */}
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <input
                type="text"
                placeholder="Add custom range or village (e.g. Thirunelly Buffer Sector)"
                value={customRegionInput}
                onChange={(e) => setCustomRegionInput(e.target.value)}
                style={{ flex: 1, height: "38px", fontSize: "0.875rem" }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={Plus}
                onClick={handleAddCustomRegion}
              >
                Add Region
              </Button>
            </div>
          </div>

          {/* LOCATION & COORDINATES */}
          <div
            style={{
              padding: "1.25rem",
              borderRadius: "14px",
              backgroundColor: "var(--background-secondary, #F9FAFB)",
              border: "1px solid var(--border-color)",
            }}
          >
            <label style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "0.5rem", fontWeight: 700 }}>
              <MapPin size={16} style={{ color: "#EF4444" }} />
              Geofence Center Point & Location Landmark
            </label>

            {/* QUICK PRESETS */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", alignSelf: "center" }}>
                Presets:
              </span>
              {PRESET_LOCATIONS.map((loc) => (
                <button
                  key={loc.name}
                  type="button"
                  onClick={() => handleSelectPresetLocation(loc)}
                  style={{
                    fontSize: "0.75rem",
                    padding: "0.25rem 0.625rem",
                    borderRadius: "6px",
                    border: "1px solid var(--border-color)",
                    backgroundColor: formData.location === loc.name ? "#E0F2FE" : "#FFFFFF",
                    color: formData.location === loc.name ? "#0369A1" : "var(--text-secondary)",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  {loc.name}
                </button>
              ))}
            </div>

            <div className="grid-cols-2" style={{ gap: "1rem" }}>
              <div style={{ gridColumn: "span 2" }}>
                <input
                  name="location"
                  type="text"
                  placeholder="Location landmark (e.g. Highway 17 Sector 4 Buffer Zone)"
                  value={formData.location}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Latitude</label>
                <input
                  name="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Longitude</label>
                <input
                  name="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          {/* ADVISORY MESSAGE */}
          <div>
            <label htmlFor="message">Advisory Description & Citizen Instructions *</label>
            <textarea
              id="message"
              name="message"
              rows={4}
              placeholder="Enter detailed safety directions, detour routes, or wildlife caution instructions for citizens..."
              value={formData.message}
              onChange={handleChange}
              required
            />
          </div>

          {/* OFFICER CREDENTIALS */}
          <div className="grid-cols-2" style={{ gap: "1.25rem" }}>
            <div>
              <label htmlFor="author">Issuing Officer Name</label>
              <input
                id="author"
                name="author"
                type="text"
                value={formData.author}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="author_role">Officer Designation / Division</label>
              <input
                id="author_role"
                name="author_role"
                type="text"
                value={formData.author_role}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* FORM ACTIONS */}
          <div className="flex-between" style={{ paddingTop: "1rem", borderTop: "1px solid var(--border-color)" }}>
            <Button variant="outline" onClick={() => navigate(-1)} type="button">
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={loading}
              icon={Send}
              style={{
                backgroundColor: "var(--primary-green)",
                boxShadow: "0 4px 15px rgba(22, 101, 52, 0.35)",
              }}
            >
              Publish Geofenced Advisory
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
