import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  User,
  Shield,
  LogOut,
  Save,
  MapPin,
  Compass,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Radio,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { apiService } from "../services/api";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { AlertMessage } from "../components/ui/AlertMessage";

// Create custom red teardrop pin with smooth drop shadow
const createCustomPinIcon = () =>
  L.divIcon({
    className: "custom-leaflet-marker-pin",
    html: `<div style="
      width: 32px;
      height: 32px;
      background: #DC2626;
      border: 3px solid #FFFFFF;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 4px 14px rgba(0,0,0,0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: grab;
    ">
      <div style="
        width: 10px;
        height: 10px;
        background: #FFFFFF;
        border-radius: 50%;
        transform: rotate(45deg);
      "></div>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });

export const ProfilePage = () => {
  const { user, role, logout, updateUser, cognitoActive } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");

  // Officer & Forest Station States
  const initialRole =
    (role || user?.role || "").toLowerCase() === "officer" ||
    (role || user?.role || "").toLowerCase() === "responder" ||
    Boolean(user?.assigned_station)
      ? "Officer"
      : "Citizen";
  const [accountRole, setAccountRole] = useState(initialRole);
  const isOfficer = accountRole === "Officer";

  const MUMBAI_DISTRICTS = [
    "Mumbai Suburban", "Mumbai City", "Thane", "Navi Mumbai", "Palghar", "Raigad"
  ];

  const DEFAULT_STATIONS_FALLBACK = [
    { id: "fs-1", name: "Sanjay Gandhi National Park (SGNP) Range Office (Borivali East)", range: "SGNP Core Wildlife Range", district: "Mumbai Suburban" },
    { id: "fs-2", name: "Aarey Milk Colony Wildlife Leopard Rescue & Transit Post (Goregaon)", range: "Aarey Forest & Wildlife Transit Range", district: "Mumbai Suburban" },
    { id: "fs-3", name: "Tulsi & Vihar Lake Catchment Protection Post (Mulund / Powai)", range: "Eastern Water Catchment Range", district: "Mumbai Suburban" },
    { id: "fs-4", name: "Mumbai Mangrove Conservation Cell & Marine Rescue Post (Bandra / Versova)", range: "Coastal Mangrove Range", district: "Mumbai Suburban" },
    { id: "fs-5", name: "Yeoor Hills Forest Range Station & Flying Squad (Thane West)", range: "Yeoor Wildlife Range", district: "Thane" },
    { id: "fs-6", name: "Ghodbunder Road Forest Beat & Leopard Response Squad (Thane)", range: "Ghodbunder Wildlife Corridor", district: "Thane" },
  ];

  const cleanInitialDistrict = (user?.district || "Mumbai Suburban").replace(/\s+District$/i, "").trim() || "Mumbai Suburban";
  const [district, setDistrict] = useState(cleanInitialDistrict);
  const [assignedStation, setAssignedStation] = useState(
    user?.assigned_station || "Sanjay Gandhi National Park (SGNP) Range Office (Borivali East)"
  );
  const [badgeNumber, setBadgeNumber] = useState(user?.badge_number || "");
  const [stations, setStations] = useState(DEFAULT_STATIONS_FALLBACK);
  const [loadingStations, setLoadingStations] = useState(false);
  const [showOfficerStationEdit, setShowOfficerStationEdit] = useState(
    !Boolean(user?.assigned_station)
  );

  // Address & Location States
  const [address, setAddress] = useState(user?.address || user?.location_name || "");
  const [city, setCity] = useState(user?.city || "Mumbai");
  const [state, setState] = useState(user?.state || "Maharashtra");
  const [pincode, setPincode] = useState(user?.pincode || "");
  const [latitude, setLatitude] = useState(user?.latitude ? String(user.latitude) : "19.2288");
  const [longitude, setLongitude] = useState(user?.longitude ? String(user.longitude) : "72.9106");

  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoStatus, setGeoStatus] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  // Load database forest stations on mount and when district changes
  useEffect(() => {
    let isMounted = true;
    const fetchStations = async () => {
      setLoadingStations(true);
      try {
        const cleanD = (district || "").replace(/\s+District$/i, "").trim() || "Mumbai Suburban";
        let data = await apiService.getForestStations(cleanD);
        if (!Array.isArray(data) || data.length === 0) {
          data = await apiService.getForestStations("");
        }
        if (!Array.isArray(data) || data.length === 0) {
          data = DEFAULT_STATIONS_FALLBACK.filter((s) =>
            s.district.toLowerCase().includes(cleanD.toLowerCase()) || cleanD.toLowerCase().includes(s.district.toLowerCase())
          );
          if (data.length === 0) data = DEFAULT_STATIONS_FALLBACK;
        }

        if (isMounted && Array.isArray(data) && data.length > 0) {
          setStations(data);
          const hasCurrent = data.some((s) => s.name === assignedStation);
          if (!hasCurrent && isOfficer && data[0]?.name) {
            setAssignedStation(data[0].name);
          }
        }
      } catch (err) {
        console.warn("Could not fetch forest stations:", err);
        if (isMounted) setStations(DEFAULT_STATIONS_FALLBACK);
      } finally {
        if (isMounted) setLoadingStations(false);
      }
    };
    fetchStations();
    return () => {
      isMounted = false;
    };
  }, [district, isOfficer]);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  // Flag to differentiate between user manual typing vs programmatic reverse-geocode updates
  const isPinSourceRef = useRef(false);
  const searchTimeoutRef = useRef(null);

  // 1. REVERSE GEOCODE: (lat, lng) -> Auto-fill Street Address, City, State, PIN
  const reverseGeocodeCoords = async (lat, lng) => {
    setGeoLoading(true);
    setGeoStatus("Resolving address details from pinned location...");

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    try {
      // Primary: Nominatim with granular address components
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&lat=${latNum}&lon=${lngNum}`
      );
      const data = await res.json();

      if (data && data.address) {
        const a = data.address;

        // Extract street name / landmark
        const streetComponents = [
          a.road || a.pedestrian || a.suburb,
          a.neighbourhood || a.hamlet || a.quarter,
          a.house_number ? `#${a.house_number}` : null,
        ].filter(Boolean);

        const resolvedStreet =
          streetComponents.length > 0
            ? streetComponents.join(", ")
            : a.town || a.village || a.city_district || `Location (${latNum.toFixed(4)}, ${lngNum.toFixed(4)})`;

        // Extract City / District
        const resolvedCity = a.state_district || a.county || a.city || a.town || a.village || "Mumbai";

        // Extract State
        const resolvedState = a.state || "Maharashtra";

        // Extract Postal code
        const resolvedPincode = a.postcode || "";

        // Mark as programmatic update so it does not trigger forward-geocoding loop
        isPinSourceRef.current = true;
        setAddress(resolvedStreet);
        setCity(resolvedCity);
        setState(resolvedState);
        if (resolvedPincode) setPincode(resolvedPincode);

        setGeoStatus("Address details updated automatically!");
        setTimeout(() => setGeoStatus(""), 3500);
        return;
      }
    } catch (err) {
      console.warn("Nominatim reverse geocode fallback:", err);
    }

    try {
      // Fallback: BigDataCloud Reverse Geocoding API
      const bdcRes = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latNum}&longitude=${lngNum}&localityLanguage=en`
      );
      const bdcData = await bdcRes.json();

      if (bdcData) {
        const resolvedStreet = bdcData.locality || bdcData.city || `Location (${latNum.toFixed(4)}, ${lngNum.toFixed(4)})`;
        const resolvedCity = bdcData.city || bdcData.principalSubdivision || "Mumbai";
        const resolvedState = bdcData.principalSubdivision || "Maharashtra";
        const resolvedPincode = bdcData.postcode || "";

        isPinSourceRef.current = true;
        setAddress(resolvedStreet);
        setCity(resolvedCity);
        setState(resolvedState);
        if (resolvedPincode) setPincode(resolvedPincode);

        setGeoStatus("Address details updated automatically!");
        setTimeout(() => setGeoStatus(""), 3500);
      }
    } catch (err) {
      console.warn("BigDataCloud fallback failed:", err);
    } finally {
      setGeoLoading(false);
      setTimeout(() => setGeoStatus(""), 3500);
    }
  };

  // 2. FORWARD GEOCODE: Typed Address -> Auto-point Red Pin on Map
  const geocodeAddressToMap = async (addressQuery) => {
    const q = (addressQuery || [address, city, state, pincode].filter(Boolean).join(", ")).trim();
    if (!q || q.length < 2) return;

    setGeoLoading(true);
    setGeoStatus("Locating address on map...");

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(q)}`
      );
      const data = await res.json();

      if (data && data.length > 0) {
        const item = data[0];
        const newLat = parseFloat(item.lat).toFixed(6);
        const newLng = parseFloat(item.lon).toFixed(6);

        setLatitude(newLat);
        setLongitude(newLng);

        // Move the red pin marker immediately & pan the map
        if (markerRef.current) {
          markerRef.current.setLatLng([item.lat, item.lon]);
        }
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([item.lat, item.lon], 14);
        }

        // Fill supplementary city/state/pin if empty
        const a = item.address || {};
        const matchedCity = a.state_district || a.county || a.city || a.town || a.village;
        const matchedState = a.state;
        const matchedPin = a.postcode;

        if (matchedCity && (!city || city === "Mumbai")) setCity(matchedCity);
        if (matchedState && (!state || state === "Maharashtra")) setState(matchedState);
        if (matchedPin && !pincode) setPincode(matchedPin);

        setGeoStatus("Map pinpointed to matching address!");
        setTimeout(() => setGeoStatus(""), 3500);
      } else {
        setGeoStatus("Could not find exact location for typed address.");
        setTimeout(() => setGeoStatus(""), 3500);
      }
    } catch (err) {
      console.warn("Geocoding lookup error:", err);
      setGeoStatus("");
    } finally {
      setGeoLoading(false);
    }
  };

  // Debounced auto-pointing whenever user types into the address or city text fields
  useEffect(() => {
    // If the address update came from clicking/dragging the pin or GPS, do not trigger a forward search
    if (isPinSourceRef.current) {
      isPinSourceRef.current = false;
      return;
    }

    if (!address || address.trim().length < 3) return;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      geocodeAddressToMap([address, city, state, pincode].filter(Boolean).join(", "));
    }, 750);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [address, city, state, pincode]);

  // 3. FETCH CURRENT GPS: Auto-point Red Pin & Auto-fill Address Fields
  const handleDetectGps = () => {
    if (navigator.geolocation) {
      setGeoLoading(true);
      setGeoStatus("Detecting current GPS coordinates...");

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const latStr = lat.toFixed(6);
          const lngStr = lng.toFixed(6);

          setLatitude(latStr);
          setLongitude(lngStr);

          // Position red pin marker and center map
          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          }
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([lat, lng], 15);
          }

          // Mark as pin source to prevent search loop and auto-fill address fields
          isPinSourceRef.current = true;
          reverseGeocodeCoords(lat, lng);
        },
        (err) => {
          setGeoLoading(false);
          setError("Unable to retrieve GPS coordinates. Permission denied or unavailable.");
          setTimeout(() => setError(""), 4500);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  // INITIALIZE INTERACTIVE LEAFLET MAP
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean up any existing map instance on this container (safe for React StrictMode)
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    if (mapContainerRef.current._leaflet_id) {
      delete mapContainerRef.current._leaflet_id;
    }

    const initLat = parseFloat(latitude) || 11.6054;
    const initLng = parseFloat(longitude) || 76.0830;

    const map = L.map(mapContainerRef.current, {
      center: [initLat, initLng],
      zoom: 14,
      zoomControl: true,
      doubleClickZoom: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const pinIcon = createCustomPinIcon();
    const marker = L.marker([initLat, initLng], {
      draggable: true,
      icon: pinIcon,
    }).addTo(map);

    mapInstanceRef.current = map;
    markerRef.current = marker;

    // CLICK MAP: Instantly move red pointer & auto-fill address text fields!
    map.on("click", (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      setLatitude(lat.toFixed(6));
      setLongitude(lng.toFixed(6));
      isPinSourceRef.current = true;
      reverseGeocodeCoords(lat, lng);
    });

    // DRAG MARKER: Move red pointer & auto-fill address text fields!
    marker.on("dragend", () => {
      const { lat, lng } = marker.getLatLng();
      setLatitude(lat.toFixed(6));
      setLongitude(lng.toFixed(6));
      isPinSourceRef.current = true;
      reverseGeocodeCoords(lat, lng);
    });

    // Recalculate dimensions after container renders
    const resizeTimer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 200);

    return () => {
      clearTimeout(resizeTimer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // Update marker position when manual latitude/longitude input boxes are edited
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      const latNum = parseFloat(latitude);
      const lngNum = parseFloat(longitude);
      if (!isNaN(latNum) && !isNaN(lngNum)) {
        const cur = markerRef.current.getLatLng();
        if (Math.abs(cur.lat - latNum) > 0.00001 || Math.abs(cur.lng - lngNum) > 0.00001) {
          markerRef.current.setLatLng([latNum, lngNum]);
          mapInstanceRef.current.panTo([latNum, lngNum]);
        }
      }
    }
  }, [latitude, longitude]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    setError("");

    const updatedProfile = {
      email: user?.email,
      name,
      role: accountRole,
      phone,
      address,
      city,
      state,
      pincode,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      location_name: address || `${city}, ${state}`,
      district: district || (isOfficer ? "Mumbai Suburban" : undefined),
      assigned_station: isOfficer ? assignedStation : undefined,
      badge_number: isOfficer ? badgeNumber : undefined,
    };

    try {
      const res = await apiService.updateUserProfile(updatedProfile);
      updateUser(updatedProfile);
      setMsg(res?.message || "Profile details & interactive address saved to AWS (RDS & DynamoDB) successfully!");
    } catch (err) {
      console.error("Save profile error:", err);
      setError(err?.message || "Failed to save profile to AWS database. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", paddingBottom: "4rem" }}>
      <div style={{ marginBottom: "2rem" }}>
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
          User Account & Location Profile
        </span>
        <h1 style={{ fontSize: "2.25rem", margin: 0, fontWeight: 800 }}>Account Settings & Location</h1>
        <p className="text-muted" style={{ fontSize: "1rem", marginTop: "0.25rem" }}>
          Manage your personal details, interactive map address, emergency contacts, and role authorization.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
        {/* HEADER USER BADGE */}
        <Card style={{ background: "linear-gradient(135deg, #173D2D 0%, #0D261B 100%)", color: "#FFFFFF", borderRadius: "20px" }}>
          <div className="flex-between" style={{ flexWrap: "wrap", gap: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  backgroundColor: "var(--primary-green)",
                  color: "#FFFFFF",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "1.875rem",
                  fontWeight: 800,
                  border: "2px solid var(--sage)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                }}
              >
                {user?.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div>
                <h3 style={{ fontSize: "1.5rem", color: "#FFFFFF", margin: 0, fontWeight: 800 }}>{user?.name || "User Account"}</h3>
                <p style={{ color: "var(--sage)", fontSize: "0.9375rem", marginTop: "0.25rem" }}>{user?.email}</p>
                {address && (
                  <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.8125rem", marginTop: "0.25rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                    <MapPin size={14} style={{ color: "#34D399" }} /> {address}, {city}, {state}
                  </p>
                )}
                {assignedStation && isOfficer && (
                  <p style={{ color: "#FBBF24", fontSize: "0.8125rem", marginTop: "0.25rem", display: "flex", alignItems: "center", gap: "0.375rem", fontWeight: 700 }}>
                    <Radio size={14} style={{ color: "#34D399" }} /> Station: {assignedStation} {badgeNumber ? `(${badgeNumber})` : ""}
                  </p>
                )}
              </div>
            </div>

            <Badge variant={role === "Admin" ? "critical" : role === "Responder" || role === "Officer" ? "high" : "pending"}>
              {role || "Citizen"} Account
            </Badge>
          </div>
        </Card>

        {msg && <AlertMessage type="success" message={msg} />}
        {error && <AlertMessage type="error" message={error} />}
        {/* ACCOUNT AUTHORIZATION ROLE SELECTOR */}
        <Card style={{ padding: "1.25rem 1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <strong style={{ fontSize: "0.9375rem", color: "var(--charcoal)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Shield size={18} style={{ color: "var(--primary-green)" }} />
                Account Authorization Type:
              </strong>
              <p style={{ margin: "0.25rem 0 0", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                Currently active as: <strong style={{ color: isOfficer ? "#059669" : "var(--charcoal)" }}>{accountRole}</strong>. Switch below to activate officer commands or resident mode.
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                onClick={() => setAccountRole("Citizen")}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "8px",
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  border: accountRole === "Citizen" ? "2px solid var(--primary-green)" : "1px solid var(--border-color)",
                  backgroundColor: accountRole === "Citizen" ? "var(--sage-light)" : "#FFFFFF",
                  color: accountRole === "Citizen" ? "var(--primary-green)" : "var(--charcoal)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  transition: "all 0.15s ease",
                }}
              >
                <User size={15} /> Citizen Account
              </button>
              <button
                type="button"
                onClick={() => setAccountRole("Officer")}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "8px",
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  border: accountRole === "Officer" ? "2px solid #059669" : "1px solid var(--border-color)",
                  backgroundColor: accountRole === "Officer" ? "#ECFDF5" : "#FFFFFF",
                  color: accountRole === "Officer" ? "#059669" : "var(--charcoal)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  transition: "all 0.15s ease",
                }}
              >
                <Radio size={15} /> Forest Officer Command
              </button>
            </div>
          </div>
        </Card>

        {/* PERSONAL DETAILS & LOCATION FORM */}
        <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
          

          <Card title="Personal Information">
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div className="grid-cols-2" style={{ gap: "1.25rem" }}>
                <div>
                  <label htmlFor="name">Full Name *</label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email">Email Address</label>
                  <input id="email" type="email" value={user?.email || ""} disabled style={{ opacity: 0.7, cursor: "not-allowed" }} />
                </div>
              </div>

              <div className={!isOfficer ? "grid-cols-2" : ""} style={{ gap: "1.25rem" }}>
                <div>
                  <label htmlFor="phone">Phone / Emergency Contact</label>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                {!isOfficer && (
                  <div>
                    <label htmlFor="nearestStation">Nearest Forest Station (Optional)</label>
                    <select
                      id="nearestStation"
                      value={assignedStation}
                      onChange={(e) => setAssignedStation(e.target.value)}
                      style={{
                        height: "42px",
                        borderRadius: "8px",
                        border: "1px solid var(--border-color)",
                        backgroundColor: "#FFFFFF",
                        fontSize: "0.875rem",
                      }}
                    >
                      <option value="">Select Nearest Station (Optional)</option>
                      {stations.map((stn) => (
                        <option key={stn.id || stn.name} value={stn.name}>
                          {stn.name} ({stn.range})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* INTERACTIVE LOCATION & PRIMARY ADDRESS SECTION */}
          <Card title="Interactive Location & Primary Address">
            <p className="text-muted" style={{ fontSize: "0.875rem", marginBottom: "1.25rem" }}>
              TheraPhylax emergency dispatches, nearby Forest Officer station matching, and spatial risk warnings are tailored to your address coordinates. Click anywhere on the map to drop a pin or type an address below.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* STREET ADDRESS WITH DETECT GPS & SEARCH BUTTONS */}
              <div>
                <div className="flex-between" style={{ marginBottom: "0.375rem" }}>
                  <label htmlFor="address" style={{ margin: 0, fontWeight: 700 }}>
                    Street Address / Landmark *
                  </label>
                  <button
                    type="button"
                    onClick={handleDetectGps}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--primary-green)",
                      fontSize: "0.8125rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                    }}
                  >
                    <Compass size={15} /> Detect Current GPS
                  </button>
                </div>

                <div style={{ position: "relative" }}>
                  <input
                    id="address"
                    type="text"
                    placeholder="e.g. House No. 42, Forest Buffer Road, Sector 4 (or click map to pin)"
                    value={address}
                    onChange={(e) => {
                      isPinSourceRef.current = false;
                      setAddress(e.target.value);
                    }}
                    onBlur={() => geocodeAddressToMap(address)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        geocodeAddressToMap(address);
                      }
                    }}
                    style={{ paddingRight: "6.5rem" }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => geocodeAddressToMap(address)}
                    style={{
                      position: "absolute",
                      right: "0.5rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      backgroundColor: "var(--primary-green)",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: "8px",
                      padding: "0.375rem 0.75rem",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                    }}
                  >
                    <Search size={13} /> Find on Map
                  </button>
                </div>

                {geoStatus && (
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--primary-green)",
                      marginTop: "0.375rem",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "0.375rem",
                    }}
                  >
                    {geoLoading ? <RefreshCw size={12} className="spin" /> : <CheckCircle2 size={12} />}
                    <span>{geoStatus}</span>
                  </div>
                )}
              </div>

              {/* CITY, STATE, PINCODE */}
              <div className="grid-cols-3" style={{ gap: "1.25rem" }}>
                <div>
                  <label htmlFor="city">City / District *</label>
                  <input
                    id="city"
                    type="text"
                    value={city}
                    onChange={(e) => {
                      isPinSourceRef.current = false;
                      setCity(e.target.value);
                    }}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="state">State *</label>
                  <input
                    id="state"
                    type="text"
                    value={state}
                    onChange={(e) => {
                      isPinSourceRef.current = false;
                      setState(e.target.value);
                    }}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="pincode">PIN / Postal Code</label>
                  <input
                    id="pincode"
                    type="text"
                    value={pincode}
                    onChange={(e) => {
                      isPinSourceRef.current = false;
                      setPincode(e.target.value);
                    }}
                    placeholder="673121"
                  />
                </div>
              </div>

              {/* LATITUDE & LONGITUDE INPUTS */}
              <div className="grid-cols-2" style={{ gap: "1.25rem" }}>
                <div>
                  <label htmlFor="latitude">Latitude Coordinate</label>
                  <input
                    id="latitude"
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="longitude">Longitude Coordinate</label>
                  <input
                    id="longitude"
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                  />
                </div>
              </div>

              {/* INTERACTIVE PINPOINT MAP CONTAINER */}
              <div>
                <div className="flex-between" style={{ marginBottom: "0.375rem" }}>
                  <label style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--deep-forest)", display: "flex", alignItems: "center", gap: "0.375rem", margin: 0 }}>
                    <MapPin size={15} style={{ color: "#DC2626" }} /> Interactive Pinpoint Map (Click anywhere to place red pin | Drag pin to adjust)
                  </label>
                  <span style={{ fontSize: "0.75rem", color: "var(--muted-text)" }}>
                    Pinned: {parseFloat(latitude || "0").toFixed(4)}, {parseFloat(longitude || "0").toFixed(4)}
                  </span>
                </div>

                <div
                  ref={mapContainerRef}
                  style={{
                    height: "300px",
                    width: "100%",
                    borderRadius: "14px",
                    border: "2px solid var(--border-color)",
                    overflow: "hidden",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    zIndex: 1,
                    cursor: "crosshair",
                  }}
                />
              </div>

{/* OFFICER SPECIFIC FOREST STATION CARD */}
          {isOfficer && (
            <Card
              title="Assigned Forest Range Station & Officer Credentials"
              style={{
                border: "1.5px solid rgba(52, 211, 153, 0.5)",
                backgroundColor: "#F0FDF4",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {!showOfficerStationEdit && (assignedStation || user?.assigned_station) ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "1rem",
                      backgroundColor: "#FFFFFF",
                      padding: "1rem 1.25rem",
                      borderRadius: "12px",
                      border: "1.5px solid #A7F3D0",
                      boxShadow: "0 2px 8px rgba(16, 185, 129, 0.08)",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#047857", fontWeight: 800, letterSpacing: "0.05em" }}>
                        Active Wildlife Patrol Duty Post
                      </span>
                      <h4 style={{ margin: "0.25rem 0", color: "#065F46", fontSize: "1.0625rem", fontWeight: 800 }}>
                        {assignedStation || user?.assigned_station}
                      </h4>
                      <p style={{ margin: 0, fontSize: "0.8125rem", color: "#047857" }}>
                        Jurisdiction District: <strong>{district}</strong> {badgeNumber ? `| Call-Sign / Badge: ${badgeNumber}` : ""}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowOfficerStationEdit(true)}
                      style={{
                        borderColor: "#059669",
                        color: "#065F46",
                        fontWeight: 700,
                      }}
                    >
                      Change / Transfer Station
                    </Button>
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <p style={{ fontSize: "0.8125rem", color: "#15803D", margin: 0 }}>
                        Officer Duty Station Setup: Incidents and emergency dispatches tagged to this station will route to your command desk.
                      </p>
                      {user?.assigned_station && (
                        <button
                          type="button"
                          onClick={() => setShowOfficerStationEdit(false)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#059669",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            textDecoration: "underline",
                          }}
                        >
                          Keep Current Station
                        </button>
                      )}
                    </div>

                    {/* DISTRICT SELECTION */}
                    <div>
                      <label
                        htmlFor="officerDistrict"
                        style={{
                          fontWeight: 800,
                          color: "#166534",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.375rem",
                          margin: "0 0 0.25rem",
                        }}
                      >
                        <Compass size={16} /> Operational District
                      </label>
                      <select
                        id="officerDistrict"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value.replace(/\s+District$/i, "").trim())}
                        style={{
                          height: "44px",
                          fontWeight: 700,
                          borderRadius: "10px",
                          border: "1.5px solid rgba(22, 101, 52, 0.4)",
                          backgroundColor: "#FFFFFF",
                          fontSize: "0.9375rem",
                        }}
                      >
                        {MUMBAI_DISTRICTS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="assignedStation"
                        style={{
                          fontWeight: 800,
                          color: "#166534",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.375rem",
                          margin: "0 0 0.25rem",
                        }}
                      >
                        <Compass size={16} /> Designated Forest Office / Station in {district}
                      </label>

                      {loadingStations ? (
                        <p style={{ fontSize: "0.8125rem", color: "var(--muted-text)" }}>Connecting to database stations...</p>
                      ) : (
                        <select
                          id="assignedStation"
                          value={assignedStation}
                          onChange={(e) => setAssignedStation(e.target.value)}
                          style={{
                            height: "44px",
                            fontWeight: 700,
                            borderRadius: "10px",
                            border: "1.5px solid rgba(22, 101, 52, 0.4)",
                            backgroundColor: "#FFFFFF",
                            fontSize: "0.9375rem",
                          }}
                        >
                          {stations.map((stn) => (
                            <option key={stn.id || stn.name} value={stn.name}>
                              {stn.name} {stn.range ? `(${stn.range})` : ""}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div>
                      <label htmlFor="badgeNumber" style={{ fontWeight: 700, color: "#166534" }}>
                        Officer Badge ID / Patrol Call-Sign
                      </label>
                      <input
                        id="badgeNumber"
                        type="text"
                        placeholder="e.g. KL-FR-RRT-01"
                        value={badgeNumber}
                        onChange={(e) => setBadgeNumber(e.target.value)}
                        style={{ backgroundColor: "#FFFFFF" }}
                      />
                    </div>
                  </>
                )}
              </div>
            </Card>
          )}

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                <Button type="submit" variant="primary" size="lg" loading={loading} icon={Save}>
                  Save Profile & Address Settings
                </Button>
              </div>
            </div>
          </Card>
        </form>

        {/* SECURITY & PROTOCOL */}
        <Card title="Security & Authentication Protocol">
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", fontSize: "0.875rem" }}>
            <div className="flex-between">
              <div>
                <strong>Authentication Provider:</strong>
                <div className="text-muted">{cognitoActive ? "AWS Amazon Cognito (ap-south-1 Mumbai)" : "Backend JWT Service"}</div>
              </div>
              <Badge variant="resolved">Active</Badge>
            </div>

            <div className="flex-between" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
              <div>
                <strong>Role Authorization Level:</strong>
                <div className="text-muted">Verified Role: {role}</div>
              </div>
              <Shield size={20} style={{ color: "var(--primary-green)" }} />
            </div>

            {cognitoActive && (
              <div className="flex-between" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
                <div>
                  <strong>AWS Cognito User Group:</strong>
                  <div className="text-muted">
                    {user?.groups?.length ? user.groups.join(", ") : (role === "Officer" ? "Officers" : "Citizens")}
                  </div>
                </div>
                <Badge variant="in_progress">{user?.groups?.[0] || (role === "Officer" ? "Officers" : "Citizens")}</Badge>
              </div>
            )}
          </div>
        </Card>

        {/* LOGOUT SESSION */}
        <Card style={{ border: "1px solid rgba(220,38,38,0.3)", backgroundColor: "#FEF2F2" }}>
          <div className="flex-between" style={{ flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h4 style={{ color: "var(--red-critical)", margin: 0 }}>Sign Out of Session</h4>
              <p className="text-muted" style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}>
                Clears your current authentication token from browser session.
              </p>
            </div>
            <Button variant="danger" icon={LogOut} onClick={logout}>
              Sign Out Now
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
