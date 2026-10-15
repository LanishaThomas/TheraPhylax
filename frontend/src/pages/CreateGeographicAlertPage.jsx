import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, AlertTriangle, Send, ArrowLeft, Radio, CheckCircle2 } from "lucide-react";
import { apiService } from "../services/api";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { AlertMessage } from "../components/ui/AlertMessage";
import { AiWritingAssistant } from "../components/ui/AiWritingAssistant";

export const CreateGeographicAlertPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    severity: "High",
    alert_type: "Wildfire Advisory",
    target_latitude: "11.6054",
    target_longitude: "76.0830",
    radius_km: "5.0",
    region_name: "Sector 4 Buffer & Highway Crossing",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyAiMessage = ({ title, message }) => {
    setFormData((prev) => ({
      ...prev,
      title: title || prev.title,
      message: message || prev.message,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.title || !formData.message || !formData.region_name) {
      setError("Please complete all required alert fields.");
      return;
    }

    setLoading(true);
    try {
      await apiService.createGeographicAlert({
        title: formData.title,
        severity: formData.severity,
        alert_type: formData.alert_type,
        target_latitude: parseFloat(formData.target_latitude),
        target_longitude: parseFloat(formData.target_longitude),
        radius_km: parseFloat(formData.radius_km),
        region_name: formData.region_name,
        message: formData.message,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate("/alerts");
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to broadcast alert.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", paddingBottom: "4rem" }}>
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
          <ArrowLeft size={16} /> Back to Officer Command
        </button>
        <span
          style={{
            fontFamily: "'Dancing Script', cursive",
            fontSize: "1.75rem",
            color: "var(--amber-warning)",
            fontWeight: 700,
            display: "block",
            marginBottom: "0.25rem",
          }}
        >
          Officer Geographic Alert System
        </span>
        <h1 style={{ fontSize: "2.125rem", margin: 0, fontWeight: 800 }}>Create Radius Geo-Targeted Alert</h1>
        <p className="text-muted" style={{ fontSize: "0.9375rem", marginTop: "0.25rem" }}>
          Target a specific geographic epicenter & broadcast urgent emergency warnings to citizens in the affected zone.
        </p>
      </div>

      {/* AI VOICE & TEXT ASSISTANT */}
      <AiWritingAssistant
        onApplyMessage={handleApplyAiMessage}
        initialCategory="Geographic Emergency Alert"
      />

      <Card style={{ padding: "2.25rem" }}>
        {error && <AlertMessage type="error" message={error} />}
        {success && (
          <AlertMessage
            type="success"
            title="Alert Issued!"
            message="Geographic alert broadcasted to backend & stored in active alerts registry."
          />
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="grid-cols-2" style={{ gap: "1.25rem" }}>
            <div>
              <label htmlFor="title">Alert Headline / Title *</label>
              <input
                id="title"
                name="title"
                type="text"
                placeholder="e.g. EVACUATION ADVISORY: Flash Flood Rise near Sector 4"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label htmlFor="alert_type">Alert Category *</label>
              <select id="alert_type" name="alert_type" value={formData.alert_type} onChange={handleChange}>
                <option value="Wildfire Advisory">Wildfire / Smoke Advisory</option>
                <option value="Flood Warning">Flash Flood / High Water Level</option>
                <option value="Wildlife Hazard">Wildlife Intrusion / Leopard Sighting</option>
                <option value="Road Blockade">Road Closure / Fallen Tree</option>
                <option value="Evacuation Order">Emergency Evacuation Order</option>
              </select>
            </div>
          </div>

          <div className="grid-cols-3" style={{ gap: "1.25rem" }}>
            <div>
              <label htmlFor="severity">Severity Rating *</label>
              <select id="severity" name="severity" value={formData.severity} onChange={handleChange}>
                <option value="Low">Low — Caution Advisory</option>
                <option value="Medium">Medium — High Awareness</option>
                <option value="High">High — Immediate Threat</option>
                <option value="Critical">Critical — Urgent Danger</option>
              </select>
            </div>

            <div>
              <label htmlFor="radius_km">Target Radius (Kilometers)</label>
              <input
                id="radius_km"
                name="radius_km"
                type="number"
                step="0.1"
                value={formData.radius_km}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label htmlFor="region_name">Region / Sector Name *</label>
              <input
                id="region_name"
                name="region_name"
                type="text"
                placeholder="e.g. River Basin Sector 4"
                value={formData.region_name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid-cols-2" style={{ gap: "1.25rem" }}>
            <div>
              <label htmlFor="target_latitude">Epicenter Latitude</label>
              <input
                id="target_latitude"
                name="target_latitude"
                type="number"
                step="any"
                value={formData.target_latitude}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label htmlFor="target_longitude">Epicenter Longitude</label>
              <input
                id="target_longitude"
                name="target_longitude"
                type="number"
                step="any"
                value={formData.target_longitude}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="message">Full Alert Message & Safety Instructions *</label>
            <textarea
              id="message"
              name="message"
              rows={5}
              placeholder="State emergency instructions, evacuation routes, helpline numbers (112 / 108)..."
              value={formData.message}
              onChange={handleChange}
              required
            />
          </div>

          <div className="flex-between" style={{ paddingTop: "1rem", borderTop: "1px solid var(--border-color)" }}>
            <Button variant="outline" onClick={() => navigate(-1)} type="button">
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={loading}
              icon={Send}
              style={{ backgroundColor: "#D97706", borderColor: "#B45309" }}
            >
              Broadcast Geo-Targeted Alert
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
