import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Shield,
  User,
  Mail,
  Lock,
  ShieldCheck,
  Eye,
  EyeOff,
  Radio,
  Compass,
  MapPin,
  CheckCircle2,
  Building2,
  UserCheck,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { apiService } from "../services/api";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { AlertMessage } from "../components/ui/AlertMessage";

// Pre-seeded districts and default stations for instant responsiveness across Mumbai & MMR
const MUMBAI_DISTRICTS = [
  "Mumbai Suburban",
  "Mumbai City",
  "Thane",
  "Navi Mumbai",
  "Palghar",
  "Raigad",
];

const DEFAULT_STATIONS_BY_DISTRICT = {
  "Mumbai Suburban": [
    { name: "Sanjay Gandhi National Park (SGNP) Range Office (Borivali East)", range: "SGNP Core Wildlife Range" },
    { name: "Aarey Milk Colony Wildlife Leopard Rescue & Transit Post (Goregaon)", range: "Aarey Forest & Wildlife Transit Range" },
    { name: "Tulsi & Vihar Lake Catchment Protection Post (Mulund / Powai)", range: "Eastern Water Catchment Range" },
    { name: "Mumbai Mangrove Conservation Cell & Marine Rescue Post (Bandra / Versova)", range: "Coastal Mangrove Range" },
  ],
  "Mumbai City": [
    { name: "South Mumbai Mangrove & Coastal Patrol Center (Sewri / Dadar)", range: "South Mumbai Coastal Range" },
    { name: "Mahim Nature Park & Mithi River Patrol Post", range: "Central Mumbai Mangrove Range" },
  ],
  Thane: [
    { name: "Yeoor Hills Forest Range Station & Flying Squad (Thane West)", range: "Yeoor Wildlife Range" },
    { name: "Ghodbunder Road Forest Beat & Leopard Response Squad (Thane)", range: "Ghodbunder Wildlife Corridor" },
    { name: "Mumbra & Parsik Range Forest Station (Kalyan / Mumbra)", range: "Parsik Forest Range" },
  ],
  "Navi Mumbai": [
    { name: "Thane Creek Flamingo Sanctuary Command Post (Airoli / Vashi)", range: "Flamingo Sanctuary & Marine Biodiversity Range" },
    { name: "Kharghar Hills & Parsik Forest Range Post (Kharghar)", range: "Kharghar Valley Green Range" },
  ],
  Palghar: [
    { name: "Tungareshwar Wildlife Sanctuary Range Office (Vasai-Virar)", range: "Tungareshwar Range" },
    { name: "Manor Forest Beat Post & Flying Squad (Palghar)", range: "Palghar West Range" },
  ],
  Raigad: [
    { name: "Karnala Bird Sanctuary Forest Command & RRT (Panvel)", range: "Karnala Wildlife Range" },
    { name: "Matheran Eco-Sensitive Forest Range Post (Neral / Matheran)", range: "Matheran Hill Eco Range" },
  ],
};

const CITIZEN_MUMBAI_AREAS = [
  {
    name: "Borivali East / SGNP National Park Buffer",
    district: "Mumbai Suburban",
    address: "Kanheri Gate Enclave, Borivali East, Mumbai",
    lat: 19.2290,
    lng: 72.8600,
  },
  {
    name: "Aarey Milk Colony / Goregaon East (Wildlife Corridor)",
    district: "Mumbai Suburban",
    address: "Unit 16, Aarey Milk Colony, Goregaon East, Mumbai",
    lat: 19.1550,
    lng: 72.8750,
  },
  {
    name: "Thane West / Yeoor Hills & Upvan Lake Fringe",
    district: "Thane",
    address: "Upvan Lake Road, Yeoor Foothills, Thane West",
    lat: 19.2200,
    lng: 72.9480,
  },
  {
    name: "Ghodbunder Road Corridor (Ovala / Chena Creek)",
    district: "Thane",
    address: "Ghodbunder Road, Ovala Buffer Zone, Thane",
    lat: 19.2780,
    lng: 72.9250,
  },
  {
    name: "Navi Mumbai / Airoli & Thane Creek Buffer",
    district: "Navi Mumbai",
    address: "Sector 10, Airoli, Navi Mumbai",
    lat: 19.1623,
    lng: 72.9967,
  },
  {
    name: "Palghar / Vasai & Tungareshwar Sanctuary Buffer",
    district: "Palghar",
    address: "Pelhar Dam Road, Vasai East, Palghar",
    lat: 19.4350,
    lng: 72.8870,
  },
  {
    name: "Mumbai City / Colaba & South Mumbai",
    district: "Mumbai City",
    address: "Colaba Causeway, South Mumbai",
    lat: 18.9067,
    lng: 72.8147,
  },
  {
    name: "Custom Coordinates / Detect Current Location",
    district: "Mumbai Suburban",
    address: "Custom Resident Location, Mumbai",
    lat: 19.2288,
    lng: 72.8570,
  },
];

export const RegisterPage = ({ initialRole }) => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const queryRole = searchParams.get("role");

  // Only Citizen or Officer are supported
  const determineInitialRole = () => {
    if (initialRole) return initialRole === "Officer" ? "Officer" : "Citizen";
    if (queryRole?.toLowerCase() === "officer") return "Officer";
    return "Citizen";
  };

  const [activeRole, setActiveRole] = useState(determineInitialRole());

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Officer-specific District & Station selection
  const [selectedDistrict, setSelectedDistrict] = useState("Mumbai Suburban");
  const [stations, setStations] = useState(DEFAULT_STATIONS_BY_DISTRICT["Mumbai Suburban"] || []);
  const [assignedStation, setAssignedStation] = useState(
    DEFAULT_STATIONS_BY_DISTRICT["Mumbai Suburban"]?.[0]?.name || "Sanjay Gandhi National Park (SGNP) Range Office (Borivali East)"
  );
  const [customStation, setCustomStation] = useState("");
  const [badgeNumber, setBadgeNumber] = useState("");

  // Citizen-specific Residential Location & Coordinates
  const [selectedAreaIndex, setSelectedAreaIndex] = useState(0);
  const [citizenAddress, setCitizenAddress] = useState(CITIZEN_MUMBAI_AREAS[0].address);
  const [citizenDistrict, setCitizenDistrict] = useState(CITIZEN_MUMBAI_AREAS[0].district);
  const [citizenLat, setCitizenLat] = useState(CITIZEN_MUMBAI_AREAS[0].lat);
  const [citizenLng, setCitizenLng] = useState(CITIZEN_MUMBAI_AREAS[0].lng);
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsStatus, setGpsStatus] = useState("");

  const handleAreaSelect = (e) => {
    const idx = parseInt(e.target.value, 10);
    setSelectedAreaIndex(idx);
    const chosen = CITIZEN_MUMBAI_AREAS[idx];
    if (chosen) {
      setCitizenAddress(chosen.address);
      setCitizenDistrict(chosen.district);
      setCitizenLat(chosen.lat);
      setCitizenLng(chosen.lng);
    }
  };

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setDetectingGps(true);
    setGpsStatus("Acquiring GPS fix...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        setCitizenLat(lat);
        setCitizenLng(lng);
        setCitizenAddress(`GPS Pin (${lat}, ${lng})`);
        setSelectedAreaIndex(CITIZEN_MUMBAI_AREAS.length - 1);
        setGpsStatus("✓ Current GPS location pinned!");
        setDetectingGps(false);
        setTimeout(() => setGpsStatus(""), 3500);
      },
      (err) => {
        setGpsStatus("Could not acquire GPS: " + err.message);
        setDetectingGps(false);
        setTimeout(() => setGpsStatus(""), 4000);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const { register, cognitoActive } = useAuth();
  const navigate = useNavigate();

  // Synchronize role if query param changes
  useEffect(() => {
    if (queryRole?.toLowerCase() === "officer") {
      setActiveRole("Officer");
    } else if (queryRole?.toLowerCase() === "citizen") {
      setActiveRole("Citizen");
    }
  }, [queryRole]);

  // When selected district changes, fetch or load stations for that district
  useEffect(() => {
    let isMounted = true;
    const fetchDistrictStations = async () => {
      try {
        const data = await apiService.getForestStations(selectedDistrict);
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setStations(data);
          setAssignedStation(data[0].name);
          return;
        }
      } catch (err) {
        console.warn("Could not fetch remote stations for district, using local map:", err);
      }

      // Fallback to local district map
      const localStations = DEFAULT_STATIONS_BY_DISTRICT[selectedDistrict] || [
        { name: `${selectedDistrict} Wildlife Division HQ`, range: `${selectedDistrict} Range` },
        { name: `${selectedDistrict} Forest Range Station`, range: "Central Range" },
      ];
      if (isMounted) {
        setStations(localStations);
        setAssignedStation(localStations[0]?.name || `${selectedDistrict} Forest Office`);
      }
    };

    fetchDistrictStations();
    return () => {
      isMounted = false;
    };
  }, [selectedDistrict]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!name || !email || !password || !confirmPassword) {
      setError("Please complete all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 12) {
      setError("Password must be at least 12 characters long (Cognito policy).");
      return;
    }

    if (
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[^A-Za-z0-9]/.test(password)
    ) {
      setError("Password must contain uppercase, lowercase, numbers, and a special character.");
      return;
    }

    const finalStationName =
      assignedStation === "__CUSTOM__"
        ? customStation.trim() || `${selectedDistrict} Forest Station`
        : assignedStation;

    if (activeRole === "Officer" && !finalStationName) {
      setError("Please select or enter your assigned Forest Station.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name,
        email,
        password,
        role: activeRole, // "Officer" or "Citizen"
        ...(activeRole === "Officer"
          ? {
              district: selectedDistrict,
              assigned_station: finalStationName,
              badge_number: badgeNumber.trim() || `KL-FR-${selectedDistrict.toUpperCase().slice(0, 3)}-01`,
            }
          : {
              district: citizenDistrict,
              address: citizenAddress,
              city: "Mumbai",
              state: "Maharashtra",
              latitude: parseFloat(citizenLat),
              longitude: parseFloat(citizenLng),
            }),
      };

      const res = await register(payload);

      setSuccessMsg(
        res.message ||
          `${activeRole} account created successfully! Redirecting to sign in...`
      );

      setTimeout(() => {
        if (cognitoActive) {
          navigate(`/verify-email?email=${encodeURIComponent(email)}`);
        } else {
          navigate(activeRole === "Officer" ? "/login?role=officer" : "/login?role=citizen");
        }
      }, 1500);
    } catch (err) {
      setError(err.message || "Registration failed. Please check details and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 160px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "3rem 1.5rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: "520px" }}>
        {/* BRAND HEADER */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "18px",
              background:
                activeRole === "Officer"
                  ? "linear-gradient(135deg, #092116 0%, #153E2B 100%)"
                  : "linear-gradient(135deg, var(--deep-forest) 0%, #153E2B 100%)",
              color: activeRole === "Officer" ? "#34D399" : "#FFFFFF",
              display: "grid",
              placeItems: "center",
              margin: "0 auto 1rem",
              boxShadow: "0 6px 16px rgba(23, 61, 45, 0.25)",
              border: activeRole === "Officer" ? "1px solid rgba(52, 211, 153, 0.3)" : "none",
            }}
          >
            {activeRole === "Officer" ? <Radio size={30} /> : <Shield size={32} />}
          </div>
          <span
            style={{
              fontFamily: "'Dancing Script', cursive",
              fontSize: "1.75rem",
              color: activeRole === "Officer" ? "#166534" : "var(--primary-green)",
              fontWeight: 700,
              display: "block",
              marginBottom: "0.25rem",
            }}
          >
            {activeRole === "Officer" ? "Official Forest Officer Enrollment" : "TheraPhylax Citizen Network"}
          </span>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.375rem" }}>
            {activeRole === "Officer" ? "Register Forest Officer Account" : "Create Citizen Account"}
          </h1>
          <p className="text-muted" style={{ fontSize: "0.9375rem" }}>
            {activeRole === "Officer"
              ? "Official registration tied directly to your designated District and Forest Station"
              : "Join community disaster safety, emergency reporting & real-time hazard alerts"}
          </p>
        </div>

        <Card style={{ padding: "2.25rem", borderRadius: "18px" }}>
          {/* ROLE SWITCHER TABS: ONLY CITIZEN OR OFFICER */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              backgroundColor: "rgba(0, 0, 0, 0.05)",
              padding: "0.35rem",
              borderRadius: "14px",
              marginBottom: "1.5rem",
              border: "1px solid var(--border-color)",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setActiveRole("Citizen");
                setError("");
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.625rem 0.75rem",
                borderRadius: "10px",
                border: "none",
                fontWeight: 700,
                fontSize: "0.875rem",
                cursor: "pointer",
                transition: "all 0.2s ease",
                backgroundColor: activeRole === "Citizen" ? "#FFFFFF" : "transparent",
                color: activeRole === "Citizen" ? "var(--deep-forest)" : "var(--muted-text)",
                boxShadow:
                  activeRole === "Citizen" ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
              }}
            >
              <UserCheck size={16} />
              <span>Citizen Account</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveRole("Officer");
                setError("");
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.625rem 0.75rem",
                borderRadius: "10px",
                border: "none",
                fontWeight: 700,
                fontSize: "0.875rem",
                cursor: "pointer",
                transition: "all 0.2s ease",
                backgroundColor: activeRole === "Officer" ? "#166534" : "transparent",
                color: activeRole === "Officer" ? "#FFFFFF" : "var(--muted-text)",
                boxShadow:
                  activeRole === "Officer" ? "0 2px 8px rgba(22, 101, 52, 0.3)" : "none",
              }}
            >
              <Radio size={16} />
              <span>Forest Officer</span>
            </button>
          </div>

          {cognitoActive && (
            <div
              style={{
                backgroundColor: "var(--sage-light)",
                border: "1px solid var(--sage)",
                color: "var(--deep-forest)",
                padding: "0.625rem 0.875rem",
                borderRadius: "10px",
                fontSize: "0.8125rem",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "1.25rem",
              }}
            >
              <ShieldCheck size={16} style={{ color: "var(--primary-green)" }} />
              <span>Amazon Cognito (ap-south-1) Auth Security Enforced</span>
            </div>
          )}

          {error && <AlertMessage type="error" message={error} style={{ marginBottom: "1.25rem" }} />}
          {successMsg && (
            <AlertMessage
              type="success"
              title="Account Created!"
              message={successMsg}
              style={{ marginBottom: "1.25rem" }}
            />
          )}

          <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}>
            {/* FULL NAME */}
            <div>
              <label htmlFor="name">
                {activeRole === "Officer" ? "Officer Full Name *" : "Full Name *"}
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="name"
                  type="text"
                  placeholder={activeRole === "Officer" ? "e.g. Officer V. Kumar" : "e.g. Rahul Sharma"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ paddingLeft: "2.5rem" }}
                  required
                />
                <User
                  size={18}
                  style={{
                    position: "absolute",
                    left: "0.875rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--muted-text)",
                  }}
                />
              </div>
            </div>

            {/* EMAIL */}
            <div>
              <label htmlFor="email">
                {activeRole === "Officer" ? "Official Officer Email Address *" : "Email Address *"}
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="email"
                  type="email"
                  placeholder={
                    activeRole === "Officer"
                      ? "officer.name@forest.gov or officer@domain.com"
                      : "name@example.com"
                  }
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: "2.5rem" }}
                  required
                />
                <Mail
                  size={18}
                  style={{
                    position: "absolute",
                    left: "0.875rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--muted-text)",
                  }}
                />
              </div>
            </div>

            {/* OFFICER-ONLY: DISTRICT SELECTION & ASSIGNED FOREST STATION */}
            {activeRole === "Officer" && (
              <div
                style={{
                  backgroundColor: "rgba(22, 101, 52, 0.06)",
                  border: "1.5px solid rgba(22, 101, 52, 0.25)",
                  borderRadius: "14px",
                  padding: "1.125rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.875rem",
                }}
              >
                {/* 1. CHOOSE A PARTICULAR DISTRICT */}
                <div>
                  <label
                    htmlFor="district"
                    style={{
                      fontWeight: 800,
                      color: "#166534",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.375rem",
                      margin: 0,
                      fontSize: "0.875rem",
                    }}
                  >
                    <Compass size={16} /> Choose Assigned District *
                  </label>
                  <p style={{ fontSize: "0.75rem", color: "#15803D", margin: "0.2rem 0 0.5rem" }}>
                    Select your operational jurisdiction district. Forest stations below will dynamically update.
                  </p>
                  <div style={{ position: "relative" }}>
                    <select
                      id="district"
                      value={selectedDistrict}
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                      style={{
                        height: "44px",
                        borderRadius: "10px",
                        border: "1.5px solid rgba(22, 101, 52, 0.4)",
                        fontWeight: 700,
                        backgroundColor: "#FFFFFF",
                        paddingLeft: "2.25rem",
                        width: "100%",
                      }}
                      required
                    >
                      {MUMBAI_DISTRICTS.map((dist) => (
                        <option key={dist} value={dist}>
                          {dist} District
                        </option>
                      ))}
                    </select>
                    <MapPin
                      size={16}
                      style={{
                        position: "absolute",
                        left: "0.75rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#166534",
                        pointerEvents: "none",
                      }}
                    />
                  </div>
                </div>

                {/* 2. CHOOSE ASSIGNED FOREST STATION */}
                <div>
                  <label
                    htmlFor="assignedStation"
                    style={{
                      fontWeight: 700,
                      color: "#166534",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.375rem",
                      fontSize: "0.8125rem",
                      marginBottom: "0.35rem",
                    }}
                  >
                    <Building2 size={15} /> Assigned Forest Office / Station in {selectedDistrict} *
                  </label>
                  <select
                    id="assignedStation"
                    value={assignedStation}
                    onChange={(e) => setAssignedStation(e.target.value)}
                    style={{
                      height: "44px",
                      borderRadius: "10px",
                      border: "1.5px solid rgba(22, 101, 52, 0.4)",
                      fontWeight: 600,
                      backgroundColor: "#FFFFFF",
                      width: "100%",
                      fontSize: "0.875rem",
                    }}
                    required
                  >
                    {stations.map((stn) => (
                      <option key={stn.id || stn.name} value={stn.name}>
                        {stn.name} {stn.range ? `(${stn.range})` : ""}
                      </option>
                    ))}
                    <option value="__CUSTOM__">+ Other Station in {selectedDistrict}...</option>
                  </select>

                  {assignedStation === "__CUSTOM__" && (
                    <input
                      type="text"
                      placeholder={`Enter custom station / beat post name in ${selectedDistrict}`}
                      value={customStation}
                      onChange={(e) => setCustomStation(e.target.value)}
                      style={{ marginTop: "0.5rem", height: "40px", backgroundColor: "#FFFFFF" }}
                      required
                    />
                  )}
                </div>

                {/* 3. OFFICER BADGE / CALL-SIGN */}
                <div>
                  <label htmlFor="badge" style={{ fontSize: "0.75rem", color: "#166534", fontWeight: 700 }}>
                    Officer Badge ID / Range Call-Sign (Optional)
                  </label>
                  <input
                    id="badge"
                    type="text"
                    placeholder={`e.g. KL-FR-${selectedDistrict.toUpperCase().slice(0, 3)}-02`}
                    value={badgeNumber}
                    onChange={(e) => setBadgeNumber(e.target.value)}
                    style={{ height: "38px", fontSize: "0.8125rem", backgroundColor: "#FFFFFF" }}
                  />
                </div>
              </div>
            )}

            {/* CITIZEN-ONLY: RESIDENTIAL AREA & LOCATION PIN */}
            {activeRole === "Citizen" && (
              <div
                style={{
                  backgroundColor: "rgba(16, 185, 129, 0.06)",
                  border: "1.5px solid rgba(16, 185, 129, 0.25)",
                  borderRadius: "14px",
                  padding: "1.125rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.875rem",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                    <label
                      htmlFor="citizen-area"
                      style={{
                        fontWeight: 800,
                        color: "#065F46",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.375rem",
                        margin: 0,
                        fontSize: "0.875rem",
                      }}
                    >
                      <MapPin size={16} /> Residential Area / Geofence Zone *
                    </label>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#059669" }}>
                      {citizenDistrict}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.75rem", color: "#047857", margin: "0.15rem 0 0.5rem" }}>
                    Select your neighborhood so the system and officer command can dispatch geofenced warnings to your residence.
                  </p>

                  <select
                    id="citizen-area"
                    value={selectedAreaIndex}
                    onChange={handleAreaSelect}
                    style={{
                      height: "44px",
                      borderRadius: "10px",
                      border: "1.5px solid rgba(16, 185, 129, 0.4)",
                      fontWeight: 700,
                      backgroundColor: "#FFFFFF",
                      width: "100%",
                      fontSize: "0.875rem",
                    }}
                    required
                  >
                    {CITIZEN_MUMBAI_AREAS.map((area, idx) => (
                      <option key={idx} value={idx}>
                        {area.name} ({area.district})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="citizen-address" style={{ fontSize: "0.8125rem", color: "#065F46", fontWeight: 700 }}>
                    Local Address / Society / Road
                  </label>
                  <input
                    id="citizen-address"
                    type="text"
                    placeholder="e.g. Kanheri Gate Enclave, Borivali East"
                    value={citizenAddress}
                    onChange={(e) => setCitizenAddress(e.target.value)}
                    style={{ height: "40px", fontSize: "0.875rem", backgroundColor: "#FFFFFF" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div>
                    <label htmlFor="citizen-lat" style={{ fontSize: "0.75rem", color: "#065F46", fontWeight: 700 }}>
                      Latitude
                    </label>
                    <input
                      id="citizen-lat"
                      type="number"
                      step="any"
                      value={citizenLat}
                      onChange={(e) => setCitizenLat(parseFloat(e.target.value) || 0)}
                      style={{ height: "36px", fontSize: "0.8125rem", backgroundColor: "#FFFFFF" }}
                    />
                  </div>
                  <div>
                    <label htmlFor="citizen-lng" style={{ fontSize: "0.75rem", color: "#065F46", fontWeight: 700 }}>
                      Longitude
                    </label>
                    <input
                      id="citizen-lng"
                      type="number"
                      step="any"
                      value={citizenLng}
                      onChange={(e) => setCitizenLng(parseFloat(e.target.value) || 0)}
                      style={{ height: "36px", fontSize: "0.8125rem", backgroundColor: "#FFFFFF" }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={handleDetectGps}
                    disabled={detectingGps}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.375rem",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "#065F46",
                      backgroundColor: "#FFFFFF",
                      border: "1.5px solid #10B981",
                      padding: "0.4rem 0.75rem",
                      borderRadius: "8px",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Compass size={13} style={{ color: "#10B981" }} />
                    {detectingGps ? "Acquiring GPS..." : "Pin My Current GPS Location"}
                  </button>

                  {gpsStatus && (
                    <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#047857" }}>
                      {gpsStatus}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* PASSWORD */}
            <div>
              <label htmlFor="password">
                {activeRole === "Officer" ? "Officer Password *" : "Password *"}
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 12 chars, upper, lower, number, symbol"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: "2.5rem", paddingRight: "2.5rem" }}
                  required
                />
                <Lock
                  size={18}
                  style={{
                    position: "absolute",
                    left: "0.875rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--muted-text)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "0.875rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--muted-text)",
                    cursor: "pointer",
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* CONFIRM PASSWORD */}
            <div>
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <div style={{ position: "relative" }}>
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ paddingLeft: "2.5rem" }}
                  required
                />
                <Lock
                  size={18}
                  style={{
                    position: "absolute",
                    left: "0.875rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--muted-text)",
                  }}
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              style={{
                width: "100%",
                marginTop: "0.5rem",
                backgroundColor: activeRole === "Officer" ? "#166534" : "var(--primary-green)",
                borderColor: activeRole === "Officer" ? "#15803D" : "var(--primary-green)",
                boxShadow:
                  activeRole === "Officer"
                    ? "0 4px 15px rgba(22, 101, 52, 0.35)"
                    : "0 4px 15px rgba(47, 133, 90, 0.25)",
              }}
            >
              {activeRole === "Officer"
                ? `Complete Officer Registration (${selectedDistrict})`
                : "Create Citizen Account"}
            </Button>
          </form>

          {/* DEDICATED SIGN IN LINK */}
          <div
            style={{
              marginTop: "1.5rem",
              paddingTop: "1.25rem",
              borderTop: "1px solid var(--border-color)",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              textAlign: "center",
              fontSize: "0.875rem",
            }}
          >
            {activeRole === "Officer" ? (
              <div>
                <span className="text-muted">Already registered as a forest officer? </span>
                <Link to="/login?role=officer" style={{ fontWeight: 700, color: "#166534" }}>
                  Officer Sign In &rarr;
                </Link>
              </div>
            ) : (
              <div>
                <span className="text-muted">Already have a citizen account? </span>
                <Link to="/login?role=citizen" style={{ fontWeight: 700, color: "var(--primary-green)" }}>
                  Citizen Sign In &rarr;
                </Link>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
