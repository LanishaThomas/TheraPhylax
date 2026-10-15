import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Shield,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Compass,
  AlertTriangle,
  MapPin,
  Activity,
  ChevronRight,
  Radio,
  UserCheck,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { AlertMessage } from "../components/ui/AlertMessage";

export const LoginPage = ({ initialRole }) => {
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unverifiedEmail, setUnverifiedEmail] = useState("");

  const { login, cognitoActive } = useAuth();
  const navigate = useNavigate();

  // Synchronize role if query param changes
  useEffect(() => {
    if (queryRole?.toLowerCase() === "officer") {
      setActiveRole("Officer");
    } else if (queryRole?.toLowerCase() === "citizen") {
      setActiveRole("Citizen");
    }
  }, [queryRole]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setUnverifiedEmail("");

    if (!email || !password) {
      setError("Please enter both your email address and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await login(email, password);
      const isOfficer =
        activeRole === "Officer" ||
        (res.user?.role || "").toLowerCase() === "officer" ||
        (res.user?.role || "").toLowerCase() === "responder";

      const targetPath = isOfficer
        ? "/officer/dashboard"
        : location.state?.from?.pathname || res.redirectPath || "/dashboard";

      navigate(targetPath, { replace: true });
    } catch (err) {
      if (err.code === "UserNotConfirmedException" || err.message?.includes("not yet verified")) {
        setUnverifiedEmail(email);
        setError("Your email address is not yet verified in Amazon Cognito.");
      } else {
        setError(err.message || "Authentication failed. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 160px)",
        padding: "3.5rem 1.5rem",
        maxWidth: "1150px",
        margin: "0 auto",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
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
          {activeRole === "Officer" ? "Forest Officer Command Desk" : "TheraPhylax Citizen Portal"}
        </span>
        <h1 style={{ fontSize: "2.25rem", marginBottom: "0.375rem" }}>
          {activeRole === "Officer" ? "Officer Sign In" : "Citizen Sign In"}
        </h1>
        <p className="text-muted" style={{ fontSize: "1rem" }}>
          {activeRole === "Officer"
            ? "Command access for Forest Range Officers & Wildlife Rapid Response Teams"
            : "Emergency incident reporting, live danger alerts, and disaster updates"}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: "2rem",
          alignItems: "start",
        }}
      >
        {/* SIGN IN FORM CARD */}
        <Card style={{ padding: "2.25rem" }}>
          {/* ROLE SWITCHER: ONLY CITIZEN OR OFFICER */}
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
              <span>Citizen</span>
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
              <ShieldCheck size={18} style={{ color: "var(--primary-green)" }} />
              <span>Amazon Cognito (ap-south-1) Auth Configured</span>
            </div>
          )}

          {error && <AlertMessage type="error" message={error} />}

          {unverifiedEmail && (
            <div
              style={{
                backgroundColor: "#FEF3C7",
                border: "1px solid #FDE047",
                borderRadius: "12px",
                padding: "1rem",
                marginBottom: "1.25rem",
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: "0.875rem", color: "#92400E", marginBottom: "0.75rem", fontWeight: 600 }}>
                Need to verify your code?
              </p>
              <Link to={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`}>
                <Button variant="primary" size="sm" style={{ width: "100%" }}>
                  Verify Email Address Now
                </Button>
              </Link>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
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
                      ? "officer.name@forest.gov or officer@theraphylax.org"
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

            <div>
              <div className="flex-between">
                <label htmlFor="password">
                  {activeRole === "Officer" ? "Officer Password *" : "Password *"}
                </label>
                <Link to="/forgot-password" style={{ fontSize: "0.8125rem", color: "var(--primary-green)" }}>
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={activeRole === "Officer" ? "Enter officer password" : "Enter password"}
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
              {activeRole === "Officer" ? "Sign In to Officer Command Desk" : "Sign In to Citizen Account"}
            </Button>
          </form>

          {/* DEDICATED LINK TO REGISTRATION WITH MATCHING ROLE */}
          <div
            style={{
              marginTop: "1.5rem",
              paddingTop: "1.25rem",
              borderTop: "1px solid var(--border-color)",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              textAlign: "center",
              fontSize: "0.875rem",
            }}
          >
            {activeRole === "Officer" ? (
              <div>
                <span className="text-muted">New officer or transferring range? </span>
                <Link
                  to="/register?role=officer"
                  style={{ fontWeight: 700, color: "#166534" }}
                >
                  Register Forest Officer Account &rarr;
                </Link>
              </div>
            ) : (
              <div>
                <span className="text-muted">Don't have a citizen account? </span>
                <Link
                  to="/register?role=citizen"
                  style={{ fontWeight: 700, color: "var(--primary-green)" }}
                >
                  Create Citizen Account &rarr;
                </Link>
              </div>
            )}
          </div>
        </Card>

        {/* RISK ZONES OVERVIEW CARD */}
        <Card
          style={{
            background: "linear-gradient(135deg, #0C281B 0%, #153F2B 100%)",
            color: "#FFFFFF",
            padding: "2.25rem",
            border: "1px solid rgba(167, 196, 160, 0.25)",
            borderRadius: "20px",
            boxShadow: "0 15px 30px rgba(12, 40, 27, 0.2)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            <div
              style={{
                backgroundColor: "rgba(255,255,255,0.12)",
                padding: "0.625rem",
                borderRadius: "12px",
                color: "#E5C07B",
              }}
            >
              <Compass size={24} />
            </div>
            <div>
              <span style={{ fontSize: "0.75rem", color: "var(--sage)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.08em" }}>
                SPATIAL RISK MONITORING
              </span>
              <h2 style={{ fontSize: "1.375rem", color: "#FFFFFF", margin: 0, fontWeight: 800 }}>
                Live Spatial Risk Zones
              </h2>
            </div>
          </div>

          <p style={{ fontSize: "0.9375rem", color: "rgba(255,255,255,0.8)", lineHeight: 1.6, marginBottom: "1.5rem" }}>
            TheraPhylax calculates active geofencing hazard zones and population proximity scores for officer and public awareness.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem", marginBottom: "1.5rem" }}>
            {[
              { zone: "SGNP Borivali Buffer Corridor", risk: "Moderate Risk", status: "Active Geofence", icon: MapPin, color: "#FBBF24" },
              { zone: "Ghodbunder & Thane Creek Belt", risk: "High Risk — Flooding", status: "Officer Monitored", icon: AlertTriangle, color: "#F87171" },
              { zone: "Aarey Colony Leopard Transit Zone", risk: "Active Observation", status: "Patrol Dispatched", icon: Activity, color: "#34D399" },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.07)",
                    borderRadius: "12px",
                    padding: "0.875rem 1rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <Icon size={18} style={{ color: item.color }} />
                    <div>
                      <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#FFFFFF", display: "block" }}>
                        {item.zone}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.6)" }}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: item.color,
                      backgroundColor: "rgba(0,0,0,0.25)",
                      padding: "0.25rem 0.625rem",
                      borderRadius: "9999px",
                    }}
                  >
                    {item.risk}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: "1.25rem" }}>
            <Link
              to="/updates"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                color: "#E5C07B",
                fontWeight: 700,
                fontSize: "0.9375rem",
              }}
            >
              <span>Explore Public Geofenced Risk Map</span>
              <ChevronRight size={16} />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
