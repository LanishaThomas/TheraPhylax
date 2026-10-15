import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FilePlus,
  MapPin,
  Upload,
  ArrowLeft,
  PhoneCall,
  ShieldAlert,
  Shield,
  Radio,
  Heart,
} from "lucide-react";
import { apiService } from "../services/api";
import { LocationPickerMap } from "../components/ui/LocationPickerMap";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { AlertMessage } from "../components/ui/AlertMessage";

export const NewReportPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    category: "Road Accident",
    severity: "Medium",
    date: new Date().toISOString().split("T")[0],
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }),
    location_name: "",
    latitude: "",
    longitude: "",
    description: "",
    // Road accident specific
    injuries_count: "0",
    vehicles_involved: "1",
    emergency_contacted: "no",
    // Animal incident specific
    animal_type: "",
    animal_status: "injured",
    reporter_safe: "yes",
  });

  const [dbStations, setDbStations] = useState([]);
  const [loadingStations, setLoadingStations] = useState(true);
  const [taggedOfficers, setTaggedOfficers] = useState([]);
  const [customOfficerTag, setCustomOfficerTag] = useState("");

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const data = await apiService.getForestStations();
        if (Array.isArray(data) && data.length > 0) {
          setDbStations(data);
          // Default tag the first station from the database
          setTaggedOfficers([data[0].name]);
        }
      } catch (err) {
        console.error("Error fetching database forest offices:", err);
      } finally {
        setLoadingStations(false);
      }
    };
    fetchStations();
  }, []);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData((prev) => ({
            ...prev,
            latitude: pos.coords.latitude.toFixed(6),
            longitude: pos.coords.longitude.toFixed(6),
            location_name: prev.location_name || `GPS (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`,
          }));
        },
        () => {
          setError("Unable to retrieve current location. Please enter address manually.");
        }
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.title || !formData.location_name || !formData.description) {
      setError("Please complete all required fields (*).");
      return;
    }

    setLoading(true);
    try {
      const finalTagged = [
        ...taggedOfficers,
        ...(customOfficerTag.trim() ? [customOfficerTag.trim()] : []),
      ];

      const payload = {
        title: formData.title,
        category: formData.category,
        severity: formData.severity,
        incident_date: `${formData.date}T${formData.time}:00`,
        location_name: formData.location_name,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        description: formData.description,
        injuries_count: parseInt(formData.injuries_count || "0", 10),
        vehicles_involved: parseInt(formData.vehicles_involved || "1", 10),
        emergency_services_contacted: formData.emergency_contacted === "yes",
        animal_type: formData.animal_type || null,
        animal_status: formData.animal_status || null,
        reporter_safe: formData.reporter_safe === "yes",
        tagged_forest_officers: finalTagged,
        forest_range: "SGNP Core Wildlife Range",
      };

      await apiService.createReport(payload);
      setSuccess(true);
      setTimeout(() => {
        navigate("/accidents/my-reports");
      }, 1800);
    } catch (err) {
      setError(err.message || "Failed to submit report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "1.5rem 1rem 4rem" }}>
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
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        <span
          style={{
            fontFamily: "'Dancing Script', cursive",
            fontSize: "1.625rem",
            color: "var(--primary-green)",
            fontWeight: 700,
            display: "block",
            marginBottom: "0.25rem",
          }}
        >
          ~ Emergency & Incident Reporting ~
        </span>
        <h1 style={{ fontSize: "2.125rem", margin: 0, fontWeight: 800 }}>Report an Incident or Accident</h1>
        <p className="text-muted" style={{ fontSize: "0.9375rem", marginTop: "0.25rem" }}>
          Log a disaster hazard, road accident, or injured animal observation for official verification & immediate response.
        </p>
      </div>

      {/* PROMINENT EMERGENCY HELPLINES PANEL (KEEPING HELPLINES EXCLUSIVELY IN REPORT ACCIDENT PAGE) */}
      <Card
        style={{
          background: "linear-gradient(135deg, #7F1D1D 0%, #991B1B 100%)",
          color: "#FFFFFF",
          padding: "1.75rem 2rem",
          borderRadius: "18px",
          marginBottom: "2rem",
          boxShadow: "0 10px 25px rgba(127, 29, 29, 0.3)",
          border: "1px solid rgba(254, 202, 202, 0.3)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", marginBottom: "0.875rem" }}>
          <div
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              padding: "0.625rem",
              borderRadius: "12px",
              display: "flex",
            }}
          >
            <PhoneCall size={28} style={{ color: "#FFFFFF" }} />
          </div>
          <div>
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 800, color: "#FECACA", letterSpacing: "0.08em" }}>
              IMMEDIATE LIFE-THREATENING EMERGENCY HELPLINES
            </span>
            <h2 style={{ fontSize: "1.375rem", color: "#FFFFFF", margin: 0, fontWeight: 800 }}>
              Official India Emergency Contacts
            </h2>
          </div>
        </div>

        <p style={{ fontSize: "0.9375rem", color: "rgba(255,255,255,0.9)", lineHeight: 1.5, marginBottom: "1.25rem" }}>
          If you or an animal are in immediate physical danger, call emergency services directly right now instead of waiting for an online response.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
            gap: "0.875rem",
          }}
        >
          {[
            { name: "National Emergency", number: "112", desc: "All-in-one Helpline" },
            { name: "Ambulance / Medical", number: "108", desc: "Medical Response" },
            { name: "Police Assistance", number: "100", desc: "Police Emergency" },
            { name: "Fire & Rescue", number: "101", desc: "Fire Service" },
            { name: "Animal Ambulance", number: "1962", desc: "Veterinary Rescue" },
          ].map((h, i) => (
            <a
              key={i}
              href={`tel:${h.number}`}
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                borderRadius: "12px",
                padding: "0.75rem 1rem",
                color: "#FFFFFF",
                textDecoration: "none",
                display: "flex",
                flexDirection: "column",
                gap: "0.25rem",
                transition: "transform 0.2s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#FECACA" }}>{h.name}</span>
                <PhoneCall size={14} style={{ color: "#FFFFFF" }} />
              </div>
              <span style={{ fontSize: "1.375rem", fontWeight: 900, letterSpacing: "1px" }}>{h.number}</span>
              <span style={{ fontSize: "0.6875rem", color: "rgba(255, 255, 255, 0.75)" }}>{h.desc}</span>
            </a>
          ))}
        </div>
      </Card>

      <Card style={{ padding: "2.25rem" }}>
        {error && <AlertMessage type="error" message={error} />}
        {success && (
          <AlertMessage
            type="success"
            title="Report Submitted!"
            message="Your incident report has been submitted to the TheraPhylax backend. Redirecting to your reports..."
          />
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="grid-cols-2" style={{ gap: "1.25rem" }}>
            <div>
              <label htmlFor="title">Incident Title *</label>
              <input
                id="title"
                name="title"
                type="text"
                placeholder="e.g. Car collision on Highway 4 / Leopard spotted near village border"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label htmlFor="category">Incident Category *</label>
              <select id="category" name="category" value={formData.category} onChange={handleChange}>
                <option value="Road Accident">Road Accident / Vehicle Crash</option>
                <option value="Injured Animal">Injured / Trapped Wildlife or Domestic Animal</option>
                <option value="Wildfire">Wildfire / Smoke Sighting</option>
                <option value="Flood">Flooding / Waterlogging</option>
                <option value="Fallen Tree">Fallen Tree / Blocked Road</option>
                <option value="Infrastructure Hazard">Infrastructure / Electrical Hazard</option>
                <option value="Other">Other Public Safety Emergency</option>
              </select>
            </div>
          </div>

          <div className="grid-cols-3" style={{ gap: "1.25rem" }}>
            <div>
              <label htmlFor="severity">Severity Level *</label>
              <select id="severity" name="severity" value={formData.severity} onChange={handleChange}>
                <option value="Low">Low — Minor observation</option>
                <option value="Medium">Medium — Caution required</option>
                <option value="High">High — Urgent response needed</option>
                <option value="Critical">Critical — Severe Emergency / Life Threat</option>
              </select>
            </div>

            <div>
              <label htmlFor="date">Date of Incident</label>
              <input id="date" name="date" type="date" value={formData.date} onChange={handleChange} required />
            </div>

            <div>
              <label htmlFor="time">Time of Incident</label>
              <input id="time" name="time" type="time" value={formData.time} onChange={handleChange} required />
            </div>
          </div>

          {/* DYNAMIC FIELD SET: ROAD ACCIDENTS */}
          {formData.category === "Road Accident" && (
            <div
              style={{
                backgroundColor: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: "14px",
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#991B1B", fontWeight: 700 }}>
                <ShieldAlert size={18} />
                <span>Road Accident Contextual Questions</span>
              </div>
              <div className="grid-cols-3" style={{ gap: "1rem" }}>
                <div>
                  <label htmlFor="injuries_count">Injuries Count</label>
                  <input
                    id="injuries_count"
                    name="injuries_count"
                    type="number"
                    min="0"
                    value={formData.injuries_count}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="vehicles_involved">Vehicles Involved</label>
                  <input
                    id="vehicles_involved"
                    name="vehicles_involved"
                    type="number"
                    min="1"
                    value={formData.vehicles_involved}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="emergency_contacted">Emergency Services Contacted?</label>
                  <select
                    id="emergency_contacted"
                    name="emergency_contacted"
                    value={formData.emergency_contacted}
                    onChange={handleChange}
                  >
                    <option value="no">No — Need Assistance</option>
                    <option value="yes">Yes — Already Dialed 112/108</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* DYNAMIC FIELD SET: ANIMAL INCIDENTS */}
          {formData.category === "Injured Animal" && (
            <div
              style={{
                backgroundColor: "#FEF3C7",
                border: "1px solid #FDE68A",
                borderRadius: "14px",
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#92400E", fontWeight: 700 }}>
                <Heart size={18} />
                <span>Wildlife & Animal Emergency Context (Triggers Forest Patrol & Wildlife Rapid Response)</span>
              </div>
              <div className="grid-cols-3" style={{ gap: "1rem" }}>
                <div>
                  <label htmlFor="animal_type">Animal Species / Type</label>
                  <input
                    id="animal_type"
                    name="animal_type"
                    type="text"
                    placeholder="e.g. Leopard, Spotted Deer, Elephant, Wild Boar"
                    value={formData.animal_type}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="animal_status">Animal Condition</label>
                  <select
                    id="animal_status"
                    name="animal_status"
                    value={formData.animal_status}
                    onChange={handleChange}
                  >
                    <option value="injured">Injured / Bleeding</option>
                    <option value="trapped">Trapped / Stuck in Fence</option>
                    <option value="sick">Sick / Dehydrated</option>
                    <option value="in_danger">In Danger / High Human Conflict</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="reporter_safe">Can reporter safely stay nearby?</label>
                  <select
                    id="reporter_safe"
                    name="reporter_safe"
                    value={formData.reporter_safe}
                    onChange={handleChange}
                  >
                    <option value="yes">Yes — Staying at safe distance</option>
                    <option value="no">No — Area unsafe / Leaving</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAG FOREST OFFICERS & STATIONS SECTION */}
          <div
            style={{
              backgroundColor: "var(--sage-light)",
              border: "1.5px solid var(--sage)",
              borderRadius: "14px",
              padding: "1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.875rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--deep-forest)", fontWeight: 700 }}>
                <Shield size={18} style={{ color: "var(--primary-green)" }} />
                <span>Tag Forest Officers & Forest Range Stations (Immediate Dispatch Alert) *</span>
              </div>
              <span style={{ fontSize: "0.75rem", color: "var(--primary-green)", fontWeight: 700 }}>
                {taggedOfficers.length} Station(s) Tagged
              </span>
            </div>

            <p style={{ fontSize: "0.8125rem", color: "var(--muted-text)", margin: 0 }}>
              Tag the responsible Forest Range stations or wildlife flying squads. A prioritized dispatch notification will be transmitted directly to their command dashboard.
            </p>

            {loadingStations ? (
              <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--muted-text)", fontSize: "0.875rem" }}>
                Connecting to Forest Department Database stations...
              </div>
            ) : dbStations.length === 0 ? (
              <div style={{ padding: "1rem", color: "var(--muted-text)", fontSize: "0.875rem" }}>
                No registered Forest Stations found in database.
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "0.75rem" }}>
                {dbStations.map((stn) => {
                  const isTagged = taggedOfficers.includes(stn.name);
                  return (
                    <label
                      key={stn.id || stn.name}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.75rem",
                        padding: "0.75rem 0.875rem",
                        borderRadius: "12px",
                        backgroundColor: isTagged ? "#FFFFFF" : "rgba(255,255,255,0.7)",
                        border: isTagged ? "2px solid var(--primary-green)" : "1px solid var(--border-color)",
                        boxShadow: isTagged ? "0 4px 12px rgba(39, 103, 73, 0.15)" : "none",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isTagged}
                        onChange={() => {
                          if (isTagged) {
                            setTaggedOfficers(taggedOfficers.filter((n) => n !== stn.name));
                          } else {
                            setTaggedOfficers([...taggedOfficers, stn.name]);
                          }
                        }}
                        style={{ marginTop: "0.25rem", accentColor: "var(--primary-green)", width: "16px", height: "16px" }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--charcoal)", lineHeight: 1.3 }}>
                          {stn.name}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", marginTop: "0.25rem" }}>
                          <span style={{ fontSize: "0.6875rem", color: "var(--primary-green)", fontWeight: 600 }}>
                            {stn.range}
                          </span>
                          {stn.radio_frequency && (
                            <span style={{ fontSize: "0.6875rem", color: "#B45309", backgroundColor: "#FEF3C7", padding: "0.1rem 0.35rem", borderRadius: "4px", fontWeight: 600 }}>
                              Radio: {stn.radio_frequency}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--muted-text)", marginTop: "0.2rem" }}>
                          📞 {stn.phone}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
              <input
                type="text"
                placeholder="Or type specific Beat Officer Call Sign / Range Station..."
                value={customOfficerTag}
                onChange={(e) => setCustomOfficerTag(e.target.value)}
                style={{ fontSize: "0.8125rem", padding: "0.5rem 0.75rem" }}
              />
            </div>
          </div>

          <LocationPickerMap
            locationName={formData.location_name}
            latitude={formData.latitude}
            longitude={formData.longitude}
            onLocationChange={({ locationName, latitude, longitude }) => {
              setFormData((prev) => ({
                ...prev,
                location_name: locationName,
                latitude,
                longitude,
              }));
            }}
            label="Incident Location / Address"
          />

          <div>
            <label htmlFor="description">Detailed Description *</label>
            <textarea
              id="description"
              name="description"
              rows={4}
              placeholder="Describe what happened, injuries, hazard details, or assistance needed..."
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label>Photographic Evidence (Optional)</label>
            <div
              style={{
                border: "2px dashed var(--border-color)",
                borderRadius: "12px",
                padding: "1.5rem",
                textAlign: "center",
                backgroundColor: "var(--bg-warm)",
              }}
            >
              {imagePreview ? (
                <div>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{ maxHeight: "200px", borderRadius: "8px", marginBottom: "0.75rem" }}
                  />
                  <br />
                  <Button variant="outline" size="sm" onClick={() => { setImageFile(null); setImagePreview(""); }}>
                    Remove Photo
                  </Button>
                </div>
              ) : (
                <div>
                  <Upload size={32} style={{ color: "var(--muted-text)", marginBottom: "0.5rem" }} />
                  <p style={{ fontSize: "0.875rem", color: "var(--muted-text)", marginBottom: "0.75rem" }}>
                    Upload photo for officer evidence verification (JPEG/PNG)
                  </p>
                  <label htmlFor="file-upload" className="btn btn-secondary btn-sm" style={{ cursor: "pointer" }}>
                    Select Image File
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: "none" }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex-between" style={{ paddingTop: "1rem", borderTop: "1px solid var(--border-color)" }}>
            <Button variant="outline" onClick={() => navigate(-1)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={loading} icon={FilePlus}>
              Submit Official Report
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
