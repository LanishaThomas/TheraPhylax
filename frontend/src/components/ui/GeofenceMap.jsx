import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Compass, User } from "lucide-react";

export const GeofenceMap = ({
  latitude = 19.2288,
  longitude = 72.8570,
  radiusKm = 5.0,
  severity = "High",
  locationName = "SGNP Borivali Buffer Zone, Mumbai",
  onLocationChange,
  onRadiusChange,
  residents = [],
  previewCitizens,
  interactive = true,
  height = "420px",
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const residentsLayerRef = useRef(null);

  const [lat, setLat] = useState(parseFloat(latitude) || 19.2288);
  const [lng, setLng] = useState(parseFloat(longitude) || 72.8570);
  const [radius, setRadius] = useState(parseFloat(radiusKm) || 5.0);

  // Normalise incoming residents list
  const activeResidents = Array.isArray(residents) && residents.length > 0
    ? residents
    : (Array.isArray(previewCitizens) ? previewCitizens : []);

  // Synchronize incoming props
  useEffect(() => {
    if (latitude && parseFloat(latitude) !== lat) {
      setLat(parseFloat(latitude));
    }
  }, [latitude]);

  useEffect(() => {
    if (longitude && parseFloat(longitude) !== lng) {
      setLng(parseFloat(longitude));
    }
  }, [longitude]);

  useEffect(() => {
    if (radiusKm && parseFloat(radiusKm) !== radius) {
      setRadius(parseFloat(radiusKm));
    }
  }, [radiusKm]);

  // Color-coded styling based on severity
  const getSeverityStyle = () => {
    const sev = (severity || "High").toLowerCase();
    if (sev === "low") {
      return {
        color: "#10B981",
        fillColor: "#10B981",
        fillOpacity: 0.16,
        dashArray: "6, 6",
        weight: 2.5,
        badgeBg: "#D1FAE5",
        badgeText: "#065F46",
        label: "Low Advisory Geofence (Green / Informational)",
      };
    }
    if (sev === "medium") {
      return {
        color: "#F59E0B",
        fillColor: "#F59E0B",
        fillOpacity: 0.20,
        dashArray: "6, 6",
        weight: 3.0,
        badgeBg: "#FEF3C7",
        badgeText: "#92400E",
        label: "Medium Hazard Geofence (Amber Zone)",
      };
    }
    if (sev === "high") {
      return {
        color: "#EA580C",
        fillColor: "#EA580C",
        fillOpacity: 0.22,
        dashArray: "8, 6",
        weight: 3.2,
        badgeBg: "#FFEDD5",
        badgeText: "#C2410C",
        label: "High Caution Geofence (Orange Zone)",
      };
    }
    return {
      color: "#DC2626",
      fillColor: "#DC2626",
      fillOpacity: 0.25,
      dashArray: "8, 6",
      weight: 3.5,
      badgeBg: "#FEE2E2",
      badgeText: "#991B1B",
      label: "Critical Danger Geofence (Red Zone)",
    };
  };

  const currentStyle = getSeverityStyle();

  // Create custom pulsing epicenter icon
  const createEpicenterIcon = () => {
    const color = currentStyle.color;
    return L.divIcon({
      className: "geofence-epicenter-marker",
      html: `
        <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: ${color}; opacity: 0.35; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 22px; height: 22px; border-radius: 50%; background: ${color}; border: 3px solid #FFFFFF; box-shadow: 0 2px 8px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center;">
            <div style="width: 6px; height: 6px; border-radius: 50%; background: #FFFFFF;"></div>
          </div>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    if (mapContainerRef.current._leaflet_id) {
      delete mapContainerRef.current._leaflet_id;
    }

    const map = L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom: 12,
      scrollWheelZoom: interactive,
      zoomControl: interactive,
      dragging: interactive,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap | TheraPhylax Geofence Engine',
      maxZoom: 18,
    }).addTo(map);

    // Add Circle with Exact Fenced Border
    const circle = L.circle([lat, lng], {
      radius: radius * 1000,
      color: currentStyle.color,
      fillColor: currentStyle.fillColor,
      fillOpacity: currentStyle.fillOpacity,
      weight: currentStyle.weight,
      dashArray: currentStyle.dashArray,
    }).addTo(map);

    circle.bindTooltip(
      `<strong>Exact Fenced Perimeter:</strong> ${radius} km radius<br/><span style="font-size:11px;">${currentStyle.label}</span>`,
      { permanent: false, direction: "top" }
    );

    // Add Epicenter Marker
    const marker = L.marker([lat, lng], {
      draggable: interactive,
      icon: createEpicenterIcon(),
    }).addTo(map);

    marker.bindPopup(
      `<div style="font-family: sans-serif; font-size: 12px; padding: 4px;">
        <strong style="color: ${currentStyle.color}; font-size: 13px;">🚨 Geofence Epicenter</strong><br/>
        <span>${locationName}</span><br/>
        <span style="color: #6B7280;">Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}</span><br/>
        <strong>Perimeter:</strong> ${radius} km
      </div>`
    );

    // Layer for real created residents in the area
    const residentsLayer = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    markerRef.current = marker;
    circleRef.current = circle;
    residentsLayerRef.current = residentsLayer;

    // Handle Map Clicks
    if (interactive) {
      map.on("click", (e) => {
        const { lat: newLat, lng: newLng } = e.latlng;
        setLat(newLat);
        setLng(newLng);
        marker.setLatLng([newLat, newLng]);
        circle.setLatLng([newLat, newLng]);

        if (onLocationChange) {
          onLocationChange({
            latitude: newLat.toFixed(6),
            longitude: newLng.toFixed(6),
            locationName: `Custom Pin (${newLat.toFixed(4)}, ${newLng.toFixed(4)})`,
          });
        }
      });

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        setLat(pos.lat);
        setLng(pos.lng);
        circle.setLatLng([pos.lat, pos.lng]);

        if (onLocationChange) {
          onLocationChange({
            latitude: pos.lat.toFixed(6),
            longitude: pos.lng.toFixed(6),
            locationName: `Custom Pin (${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)})`,
          });
        }
      });
    }

    // Invalidate map size after rendering to ensure complete tile coverage
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Circle Position, Radius and Styling dynamically
  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setLatLng([lat, lng]);
      circleRef.current.setRadius(radius * 1000);
      circleRef.current.setStyle({
        color: currentStyle.color,
        fillColor: currentStyle.fillColor,
        fillOpacity: currentStyle.fillOpacity,
        weight: currentStyle.weight,
        dashArray: currentStyle.dashArray,
      });
      circleRef.current.setTooltipContent(
        `<strong>Exact Fenced Perimeter:</strong> ${radius} km radius<br/><span style="font-size:11px;">${currentStyle.label}</span>`
      );
    }
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      markerRef.current.setIcon(createEpicenterIcon());
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo([lat, lng]);
    }
  }, [lat, lng, radius, severity]);

  const calculateDistanceKm = (cLat, cLng, centerLat, centerLng) => {
    if (isNaN(cLat) || isNaN(cLng) || isNaN(centerLat) || isNaN(centerLng)) return 999;
    const R = 6371; // Earth radius in km
    const dLat = (centerLat - cLat) * (Math.PI / 180);
    const dLng = (centerLng - cLng) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(cLat * (Math.PI / 180)) *
        Math.cos(centerLat * (Math.PI / 180)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 100) / 100;
  };

  // Render real created residents on map
  useEffect(() => {
    if (!residentsLayerRef.current) return;
    residentsLayerRef.current.clearLayers();

    if (activeResidents.length > 0) {
      activeResidents.forEach((c) => {
        const cLat = parseFloat(c.latitude);
        const cLng = parseFloat(c.longitude);
        if (!isNaN(cLat) && !isNaN(cLng)) {
          const distKm = calculateDistanceKm(cLat, cLng, lat, lng);
          const inFence = distKm <= radius;
          const pinColor = inFence ? "#10B981" : "#94A3B8";

          const residentIcon = L.divIcon({
            className: "resident-pin-marker",
            html: `
              <div style="position: relative; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                ${inFence ? `<div style="position: absolute; width: 26px; height: 26px; border-radius: 50%; background: #10B981; opacity: 0.45; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ''}
                <div style="width: 18px; height: 18px; border-radius: 50%; background: ${pinColor}; border: 2.5px solid #FFFFFF; box-shadow: 0 2px 7px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;">
                  <div style="width: 6px; height: 6px; border-radius: 50%; background: #FFFFFF;"></div>
                </div>
              </div>
            `,
            iconSize: [26, 26],
            iconAnchor: [13, 13],
          });

          const m = L.marker([cLat, cLng], { icon: residentIcon });
          m.bindTooltip(
            `<div style="font-family: sans-serif; font-size: 11px; padding: 4px; min-width: 160px;">
              <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 3px;">
                <span style="font-size: 13px;">👤</span>
                <strong style="color: ${inFence ? '#059669' : '#1F2937'}; font-size: 12px;">${c.name || 'Resident'}</strong>
              </div>
              <div style="color: #64748B; font-size: 10px; margin-bottom: 2px;">${c.email}</div>
              ${c.address ? `<div style="color: #475569; font-size: 11px; margin-bottom: 2px;">📍 ${c.address}</div>` : ''}
              <div style="margin-top: 4px; font-weight: 600; color: #374151;">
                <strong>Distance:</strong> ${distKm.toFixed(2)} km
              </div>
              <div style="margin-top: 4px; font-weight: 700; font-size: 10px; padding: 2px 6px; border-radius: 4px; display: inline-block; ${inFence ? 'background: #D1FAE5; color: #065F46;' : 'background: #F1F5F9; color: #64748B;'}">
                ${inFence ? '● INSIDE GEOFENCE (Will Receive Alert)' : '○ Outside Perimeter (Will NOT be Alerted)'}
              </div>
            </div>`,
            { direction: "top", offset: [0, -10] }
          );
          residentsLayerRef.current.addLayer(m);
        }
      });
    }
  }, [activeResidents, radius, lat, lng]);

  const handleSliderChange = (e) => {
    const val = parseFloat(e.target.value);
    setRadius(val);
    if (onRadiusChange) {
      onRadiusChange(val);
    }
  };

  const insideResidents = activeResidents.filter((c) => {
    const cLat = parseFloat(c.latitude);
    const cLng = parseFloat(c.longitude);
    return calculateDistanceKm(cLat, cLng, lat, lng) <= radius;
  });

  return (
    <div style={{ position: "relative", width: "100%", borderRadius: "14px", overflow: "hidden", border: "1.5px solid var(--border-color)", boxShadow: "0 4px 15px rgba(0,0,0,0.06)" }}>
      {/* MAP CANVAS */}
      <div ref={mapContainerRef} style={{ height, width: "100%", zIndex: 1 }} />

      {/* TOP OVERLAY: LIVE GEOFENCE METRICS */}
      <div
        style={{
          position: "absolute",
          top: "12px",
          left: "12px",
          right: "12px",
          zIndex: 10,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(17, 24, 39, 0.88)",
            color: "#FFFFFF",
            backdropFilter: "blur(6px)",
            padding: "6px 14px",
            borderRadius: "9999px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
            pointerEvents: "auto",
            fontSize: "0.8125rem",
            fontWeight: 600,
          }}
        >
          <div style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: currentStyle.color, animation: "pulse 1.8s infinite" }}></div>
          <span>Exact Fence Border: <strong>{radius.toFixed(1)} km</strong></span>
          <span style={{ opacity: 0.5 }}>|</span>
          <span style={{ color: currentStyle.color, fontWeight: 700 }}>{severity.toUpperCase()} PRIORITY</span>
        </div>

        {activeResidents.length > 0 && (
          <div
            style={{
              backgroundColor: "rgba(17, 24, 39, 0.88)",
              color: "#FFFFFF",
              backdropFilter: "blur(6px)",
              padding: "6px 14px",
              borderRadius: "9999px",
              display: "flex",
              alignItems: "center",
              gap: "7px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
              pointerEvents: "auto",
              fontSize: "0.8125rem",
              fontWeight: 600,
            }}
          >
            <User size={14} style={{ color: insideResidents.length > 0 ? "#34D399" : "#94A3B8" }} />
            <span>
              Residents in Fence:{" "}
              <strong style={{ color: insideResidents.length > 0 ? "#34D399" : "#FFFFFF" }}>
                {insideResidents.length}
              </strong>{" "}
              / {activeResidents.length}
            </span>
          </div>
        )}
      </div>

      {/* BOTTOM CONTROLS OVERLAY: RADIUS SLIDER */}
      {interactive && (
        <div
          style={{
            position: "absolute",
            bottom: "12px",
            left: "12px",
            right: "12px",
            zIndex: 10,
            backgroundColor: "rgba(255, 255, 255, 0.94)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(0, 0, 0, 0.1)",
            padding: "10px 16px",
            borderRadius: "12px",
            boxShadow: "0 4px 15px rgba(0,0,0,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: "220px", flex: 1 }}>
            <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--charcoal)", whiteSpace: "nowrap" }}>
              Geofence Radius:
            </span>
            <input
              type="range"
              min="1.0"
              max="25.0"
              step="0.5"
              value={radius}
              onChange={handleSliderChange}
              style={{
                flex: 1,
                cursor: "pointer",
                accentColor: currentStyle.color,
              }}
            />
            <span
              style={{
                fontSize: "0.875rem",
                fontWeight: 800,
                color: currentStyle.color,
                minWidth: "62px",
                textAlign: "right",
              }}
            >
              {radius.toFixed(1)} km
            </span>
          </div>

          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
            <Compass size={13} style={{ color: currentStyle.color }} />
            <span>Click map or drag center marker to relocate epicenter</span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};
