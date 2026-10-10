import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Shield, Eye, EyeOff, Lock, Mail, ShieldCheck, Compass, AlertTriangle, MapPin, Activity, ChevronRight } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { AlertMessage } from "../components/ui/AlertMessage";

export const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unverifiedEmail, setUnverifiedEmail] = useState("");

  const { login, cognitoActive } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
      const targetPath = location.state?.from?.pathname || res.redirectPath || "/dashboard";
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
            background: "linear-gradient(135deg, var(--deep-forest) 0%, #153E2B 100%)",
            color: "#FFFFFF",
            display: "grid",
            placeItems: "center",
            margin: "0 auto 1rem",
            boxShadow: "0 6px 16px rgba(23, 61, 45, 0.25)",
          }}
        >
          <Shield size={32} />
        </div>
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
          ~ Secure Multi-Role Portal ~
        </span>
        <h1 style={{ fontSize: "2.25rem", marginBottom: "0.375rem" }}>Sign In to TheraPhylax</h1>
        <p className="text-muted" style={{ fontSize: "1rem" }}>
          Single unified sign-in for Citizens, Emergency Officers, and NGO Personnel
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
          gap: "2rem",
          alignItems: "start",
        }}
      >
        {/* SIGN IN FORM CARD */}
        <Card style={{ padding: "2.25rem" }}>
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
              <label htmlFor="email">Email Address</label>
              <div style={{ position: "relative" }}>
                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
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
              <div className="flex-between" style={{ marginBottom: "0.375rem" }}>
                <label htmlFor="password" style={{ margin: 0 }}>Password</label>
                <Link to="/forgot-password" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
                  Forgot Password?
                </Link>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
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

            <Button type="submit" variant="primary" loading={loading} style={{ width: "100%", marginTop: "0.5rem" }}>
              Sign In to Account
            </Button>
          </form>

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
            <div>
              <span className="text-muted">Don't have an account? </span>
              <Link to="/register" style={{ fontWeight: 700 }}>
                Create Account
              </Link>
            </div>
            <div>
              <Link to="/verify-email" style={{ color: "var(--primary-green)", fontSize: "0.8125rem", fontWeight: 600 }}>
                Have a verification code? Verify Email
              </Link>
            </div>
          </div>
        </Card>

        {/* RISK ZONES OVERVIEW CARD (LOCATED EXCLUSIVELY ON LOGIN PAGE) */}
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
              { zone: "Forest Buffer Alpha (Sector 4)", risk: "Moderate Risk", status: "Active Geofence", icon: MapPin, color: "#FBBF24" },
              { zone: "River Basin Bravo (Wayanad)", risk: "High Risk — Flooding", status: "Officer Monitored", icon: AlertTriangle, color: "#F87171" },
              { zone: "Northern Range Perimeter", risk: "Low Risk — Observation", status: "Normal State", icon: Activity, color: "#34D399" },
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
              to="/risks"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                color: "#E5C07B",
                fontWeight: 700,
                fontSize: "0.9375rem",
              }}
            >
              <span>Explore Full Interactive Risk Map</span>
              <ChevronRight size={16} />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
