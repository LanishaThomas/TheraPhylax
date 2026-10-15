import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Compass, Search, RefreshCw, Check } from "lucide-react";

// Create custom red teardrop pin with clean centering
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

export const LocationPickerMap = ({
  locationName = "",
  latitude = "",
  longitude = "",
  onLocationChange,
  label = "Incident Location / Address",
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const onLocationChangeRef = useRef(onLocationChange);

  const [addressInput, setAddressInput] = useState(locationName);
  const [latVal, setLatVal] = useState(latitude || "19.2288");
  const [lngVal, setLngVal] = useState(longitude || "72.9106");
  const [loadingGeo, setLoadingGeo] = useState(false);
  const [geoMsg, setGeoMsg] = useState("");

  const isPinSourceRef = useRef(false);
  const debounceTimerRef = useRef(null);

  // Keep latest onLocationChange callback in ref to prevent stale closures
  useEffect(() => {
    onLocationChangeRef.current = onLocationChange;
  }, [onLocationChange]);

  // Sync external props to internal state
  useEffect(() => {
    if (locationName && locationName !== addressInput) {
      setAddressInput(locationName);
    }
  }, [locationName]);

  useEffect(() => {
    if (latitude && latitude !== latVal) {
      setLatVal(latitude);
    }
  }, [latitude]);

  useEffect(() => {
    if (longitude && longitude !== lngVal) {
      setLngVal(longitude);
    }
  }, [longitude]);

  // Reverse Geocode: (lat, lng) -> Place Name
  const reverseGeocode = async (lat, lng, latStr, lngStr) => {
    setLoadingGeo(true);
    setGeoMsg("Resolving address name...");

    try {
      // 1. Try BigDataCloud Reverse Geocoding API
      const bdcRes = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );
      const bdcData = await bdcRes.json();

      if (bdcData && (bdcData.locality || bdcData.city || bdcData.principalSubdivision)) {
        const parts = [bdcData.locality || bdcData.city, bdcData.principalSubdivision, bdcData.countryName].filter(Boolean);
        const resolvedAddress = parts.join(", ");

        isPinSourceRef.current = true;
        setAddressInput(resolvedAddress);
        setGeoMsg("Address updated in input field!");

        if (onLocationChangeRef.current) {
          onLocationChangeRef.current({
            locationName: resolvedAddress,
            latitude: latStr,
            longitude: lngStr,
          });
        }
        setLoadingGeo(false);
        setTimeout(() => setGeoMsg(""), 3500);
        return;
      }
    } catch (err) {
      console.warn("BigDataCloud fallback to Nominatim:", err);
    }

    try {
      // 2. Fallback to Nominatim Reverse Geocoding API
      const nomRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const nomData = await nomRes.json();

      if (nomData && nomData.display_name) {
        const resolvedAddress = nomData.display_name;
        isPinSourceRef.current = true;
        setAddressInput(resolvedAddress);
        setGeoMsg("Address updated in input field!");

        if (onLocationChangeRef.current) {
          onLocationChangeRef.current({
            locationName: resolvedAddress,
            latitude: latStr,
            longitude: lngStr,
          });
        }
      } else {
        const fallbackStr = `GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
        isPinSourceRef.current = true;
        setAddressInput(fallbackStr);
        if (onLocationChangeRef.current) {
          onLocationChangeRef.current({
            locationName: fallbackStr,
            latitude: latStr,
            longitude: lngStr,
          });
        }
      }
    } catch {
      const fallbackStr = `GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
      isPinSourceRef.current = true;
      setAddressInput(fallbackStr);
      if (onLocationChangeRef.current) {
        onLocationChangeRef.current({
          locationName: fallbackStr,
          latitude: latStr,
          longitude: lngStr,
        });
      }
    } finally {
      setLoadingGeo(false);
      setTimeout(() => setGeoMsg(""), 3500);
    }
  };

  // Immediate pin placement handler
  const handlePinPlaced = (lat, lng) => {
    const latStr = Number(lat).toFixed(6);
    const lngStr = Number(lng).toFixed(6);

    setLatVal(latStr);
    setLngVal(lngStr);

    const initialGpsLabel = `GPS Location (${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)})`;
    isPinSourceRef.current = true;
    setAddressInput(initialGpsLabel);

    if (onLocationChangeRef.current) {
      onLocationChangeRef.current({
        locationName: initialGpsLabel,
        latitude: latStr,
        longitude: lngStr,
      });
    }

    reverseGeocode(Number(lat), Number(lng), latStr, lngStr);
  };

  // Forward Geocode: Typed Address -> (lat, lng) & Map Pin
  const forwardGeocode = async (addressToSearch) => {
    if (!addressToSearch || addressToSearch.trim().length < 2) return;

    setLoadingGeo(true);
    setGeoMsg("Finding coordinates on map...");

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressToSearch)}`);
      const data = await res.json();

      if (data && data.length > 0) {
        const first = data[0];
        const lat = parseFloat(first.lat);
        const lng = parseFloat(first.lon);

        const latStr = lat.toFixed(6);
        const lngStr = lng.toFixed(6);

        setLatVal(latStr);
        setLngVal(lngStr);
        setGeoMsg("Map pin positioned at exact location!");

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        }
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 14);
        }

        if (onLocationChangeRef.current) {
          onLocationChangeRef.current({
            locationName: first.display_name || addressToSearch,
            latitude: latStr,
            longitude: lngStr,
          });
        }
      } else {
        setGeoMsg("Could not locate place on map.");
      }
    } catch (err) {
      console.warn("Forward geocoding error:", err);
    } finally {
      setLoadingGeo(false);
      setTimeout(() => setGeoMsg(""), 3500);
    }
  };

  // Debounced auto-pointing when typing into address input field
  useEffect(() => {
    if (isPinSourceRef.current) {
      isPinSourceRef.current = false;
      return;
    }
    if (!addressInput || addressInput.trim().length < 3) return;

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      forwardGeocode(addressInput);
    }, 750);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [addressInput]);

  // Initialize Leaflet map with clean lifecycle and instant click handling
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destroy any stale map on this container before creating a new one (prevents StrictMode error)
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    if (mapContainerRef.current._leaflet_id) {
      delete mapContainerRef.current._leaflet_id;
    }

    const initialLat = parseFloat(latVal) || 19.2288;
    const initialLng = parseFloat(lngVal) || 72.9106;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 13,
      doubleClickZoom: true,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const pinIcon = createCustomPinIcon();
    const marker = L.marker([initialLat, initialLng], {
      draggable: true,
      icon: pinIcon,
    }).addTo(map);

    mapInstanceRef.current = map;
    markerRef.current = marker;

    // CLICK MAP: Immediately move red pointer to clicked position & auto-fill address
    map.on("click", (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      handlePinPlaced(lat, lng);
    });

    // DRAG MARKER: Move red pointer & update coordinates and address
    marker.on("dragend", () => {
      const { lat, lng } = marker.getLatLng();
      handlePinPlaced(lat, lng);
    });

    // Ensure map tiles and container dimensions calculate correctly
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

  // Sync external/manual lat-lng changes to the map marker position
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      const lat = parseFloat(latVal);
      const lng = parseFloat(lngVal);
      if (!isNaN(lat) && !isNaN(lng)) {
        const cur = markerRef.current.getLatLng();
        if (Math.abs(cur.lat - lat) > 0.00001 || Math.abs(cur.lng - lng) > 0.00001) {
          markerRef.current.setLatLng([lat, lng]);
          mapInstanceRef.current.panTo([lat, lng]);
        }
      }
    }
  }, [latVal, lngVal]);

  // Fetch Current Browser Geolocation
  const handleFetchCurrentGps = () => {
    if (navigator.geolocation) {
      setLoadingGeo(true);
      setGeoMsg("Detecting current GPS coordinates...");

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const latStr = lat.toFixed(6);
          const lngStr = lng.toFixed(6);

          setLatVal(latStr);
          setLngVal(lngStr);

          const initialGpsLabel = `Current GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
          isPinSourceRef.current = true;
          setAddressInput(initialGpsLabel);

          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          }
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([lat, lng], 15);
          }

          if (onLocationChangeRef.current) {
            onLocationChangeRef.current({
              locationName: initialGpsLabel,
              latitude: latStr,
              longitude: lngStr,
            });
          }

          reverseGeocode(lat, lng, latStr, lngStr);
        },
        () => {
          setLoadingGeo(false);
          setGeoMsg("GPS permission denied or unavailable.");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* ADDRESS INPUT BOX WITH SEARCH & FETCH GPS BUTTON */}
      <div>
        <div className="flex-between" style={{ marginBottom: "0.375rem" }}>
          <label htmlFor="location_input_box" style={{ margin: 0, fontWeight: 700 }}>
            {label} *
          </label>
          <button
            type="button"
            onClick={handleFetchCurrentGps}
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
            <Compass size={15} /> Fetch Current Location GPS
          </button>
        </div>

        <div style={{ position: "relative" }}>
          <input
            id="location_input_box"
            type="text"
            placeholder="Type place name or click map to pin point (e.g. SGNP Borivali, Aarey Colony, Thane)"
            value={addressInput}
            onChange={(e) => {
              isPinSourceRef.current = false;
              setAddressInput(e.target.value);
              if (onLocationChangeRef.current) {
                onLocationChangeRef.current({
                  locationName: e.target.value,
                  latitude: latVal,
                  longitude: lngVal,
                });
              }
            }}
            onBlur={() => forwardGeocode(addressInput)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                forwardGeocode(addressInput);
              }
            }}
            style={{ paddingRight: "6rem" }}
            required
          />
          <button
            type="button"
            onClick={() => forwardGeocode(addressInput)}
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
            <Search size={13} /> Find Map
          </button>
        </div>

        {geoMsg && (
          <div style={{ fontSize: "0.75rem", color: "var(--primary-green)", marginTop: "0.375rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.375rem" }}>
            {loadingGeo ? <RefreshCw size={12} className="spin" /> : <Check size={12} />}
            <span>{geoMsg}</span>
          </div>
        )}
      </div>

      {/* LAT / LNG READOUT INPUTS */}
      <div className="grid-cols-2" style={{ gap: "1rem" }}>
        <div>
          <label style={{ fontSize: "0.8125rem" }}>Latitude Coordinate (Pinned)</label>
          <input
            type="number"
            step="any"
            value={latVal}
            onChange={(e) => {
              setLatVal(e.target.value);
              if (onLocationChangeRef.current) {
                onLocationChangeRef.current({
                  locationName: addressInput,
                  latitude: e.target.value,
                  longitude: lngVal,
                });
              }
            }}
          />
        </div>
        <div>
          <label style={{ fontSize: "0.8125rem" }}>Longitude Coordinate (Pinned)</label>
          <input
            type="number"
            step="any"
            value={lngVal}
            onChange={(e) => {
              setLngVal(e.target.value);
              if (onLocationChangeRef.current) {
                onLocationChangeRef.current({
                  locationName: addressInput,
                  latitude: latVal,
                  longitude: e.target.value,
                });
              }
            }}
          />
        </div>
      </div>

      {/* INTERACTIVE MAP CONTAINER */}
      <div>
        <div className="flex-between" style={{ marginBottom: "0.375rem" }}>
          <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--deep-forest)", display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <MapPin size={14} style={{ color: "#DC2626" }} /> Interactive Map (Click anywhere to drop red pin | Drag pin to adjust)
          </span>
          <span style={{ fontSize: "0.75rem", color: "var(--muted-text)" }}>
            Pinned: {parseFloat(latVal || "0").toFixed(4)}, {parseFloat(lngVal || "0").toFixed(4)}
          </span>
        </div>

        <div
          ref={mapContainerRef}
          style={{
            height: "290px",
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
    </div>
  );
};
