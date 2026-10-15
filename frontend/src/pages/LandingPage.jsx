import React from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  MapPin,
  Activity,
  FilePlus,
  Bell,
  Lock,
  ArrowRight,
  Heart,
  PhoneCall,
  Zap,
  Users,
  CheckCircle2,
  Compass,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

export const LandingPage = () => {
  return (
    <div style={{ backgroundColor: "#F8FAF8", minHeight: "100vh" }}>
      {/* LIGHT SHADE HERO SECTION */}
      <section
        style={{
          background: "linear-gradient(135deg, #F3F7F4 0%, #E8F2EC 50%, #DCEDE3 100%)",
          color: "var(--charcoal)",
          padding: "3.5rem 1.5rem 4.5rem",
          position: "relative",
          overflow: "hidden",
          borderBottom: "1px solid rgba(39, 103, 73, 0.12)",
        }}
      >
        {/* Soft background ambient glows */}
        <div
          style={{
            position: "absolute",
            top: "-15%",
            right: "5%",
            width: "400px",
            height: "400px",
            background: "radial-gradient(circle, rgba(39, 103, 73, 0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ maxWidth: "1280px", margin: "0 auto", position: "relative", zIndex: 2 }}>
          <div style={{ maxWidth: "800px" }}>
            {/* Script Tagline - Moderate Size */}
            <div style={{ marginBottom: "0.5rem" }}>
              <span className="hero-tagline-script" style={{ color: "var(--primary-green)" }}>
                Protecting Communities, Preserving Wildlife & Mobilizing Response
              </span>
            </div>

            {/* Pill Badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                backgroundColor: "#FFFFFF",
                border: "1px solid rgba(39, 103, 73, 0.25)",
                color: "var(--primary-green)",
                padding: "0.3125rem 0.875rem",
                borderRadius: "9999px",
                fontSize: "0.78125rem",
                fontWeight: 700,
                marginBottom: "1.25rem",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
              }}
            >
              <Zap size={14} style={{ color: "var(--primary-green)" }} />
              <span>Multi-Role Emergency Response Platform</span>
            </div>

            {/* Main Headline - PROPORTIONED & SMALLER (Max 2.625rem) */}
            <h1
              style={{
                fontSize: "clamp(1.75rem, 3.2vw, 2.625rem)",
                lineHeight: 1.2,
                color: "var(--deep-forest)",
                marginBottom: "1.125rem",
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 800,
                letterSpacing: "-0.015em",
              }}
            >
              From Emergency Sightings to{" "}
              <span
                style={{
                  color: "var(--primary-green)",
                  fontFamily: "'Playfair Display', serif",
                  fontStyle: "italic",
                  fontWeight: 600,
                }}
              >
                Instant, Coordinated Response.
              </span>
            </h1>

            <p
              style={{
                fontSize: "1.0625rem",
                lineHeight: 1.6,
                color: "var(--muted-text)",
                marginBottom: "1.75rem",
                maxWidth: "680px",
              }}
            >
              TheraPhylax connects Citizens, Forest Officers, and Emergency Responders in real-time. Log road accidents, injured wildlife, natural hazards, and spatial risks for swift action.
            </p>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "0.875rem", flexWrap: "wrap", alignItems: "center" }}>
              <Link to="/accidents/report">
                <Button
                  variant="primary"
                  size="md"
                  icon={FilePlus}
                  style={{
                    backgroundColor: "#276749",
                    boxShadow: "0 4px 12px rgba(39, 103, 73, 0.3)",
                    padding: "0.75rem 1.5rem",
                  }}
                >
                  Report Incident / Accident
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  variant="outline"
                  size="md"
                  icon={ArrowRight}
                  style={{
                    color: "var(--deep-forest)",
                    borderColor: "rgba(39, 103, 73, 0.3)",
                    backgroundColor: "#FFFFFF",
                    padding: "0.75rem 1.375rem",
                  }}
                >
                  Sign In to Portal
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Stats Grid - LIGHT SHADE CARDS */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1rem",
              marginTop: "3.5rem",
              paddingTop: "2rem",
              borderTop: "1px solid rgba(39, 103, 73, 0.12)",
            }}
          >
            {[
              { number: "112 & 108", label: "Verified Emergency Helplines", icon: PhoneCall, color: "#DC2626", bg: "#FEE2E2" },
              { number: "Real-time", label: "Officer Geo-Alert Broadcasts", icon: Bell, color: "#D97706", bg: "#FEF3C7" },
              { number: "Automated", label: "Forest Officer Station Tagging", icon: Shield, color: "#059669", bg: "#D1FAE5" },
              { number: "AWS Cognito", label: "Role-Based Cloud Auth", icon: Lock, color: "#16A34A", bg: "#DCFCE7" },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div
                  key={i}
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid rgba(39, 103, 73, 0.12)",
                    borderRadius: "14px",
                    padding: "1.125rem 1.25rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.875rem",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      backgroundColor: stat.bg,
                      display: "grid",
                      placeItems: "center",
                      color: stat.color,
                    }}
                  >
                    <Icon size={20} />
                  </div>
                  <div>
                    <span style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--deep-forest)", display: "block" }}>
                      {stat.number}
                    </span>
                    <span style={{ fontSize: "0.8125rem", color: "var(--muted-text)", fontWeight: 500 }}>
                      {stat.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CORE PLATFORM CAPABILITIES */}
      <section style={{ padding: "4.5rem 1.5rem", maxWidth: "1280px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", maxWidth: "680px", margin: "0 auto 3rem" }}>
          <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--primary-green)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "0.375rem" }}>
            UNIFIED MULTI-ROLE PLATFORM
          </span>
          <h2 style={{ fontSize: "1.875rem", marginBottom: "0.75rem", fontFamily: "'Outfit', sans-serif" }}>
            Tailored Portals for Every Stakeholder
          </h2>
          <p className="text-muted" style={{ fontSize: "1rem", lineHeight: 1.55 }}>
            Empowering citizens to log hazards, enabling forest officers to triage and issue geo-alerts, and dispatching rapid response squads for wildlife and road emergencies.
          </p>
        </div>

        <div className="grid-cols-3" style={{ gap: "1.75rem" }}>
          <Card
            className="card-hover"
            style={{
              borderTop: "4px solid var(--primary-green)",
              backgroundColor: "#FFFFFF",
              padding: "1.75rem",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                backgroundColor: "var(--sage-light)",
                color: "var(--primary-green)",
                display: "grid",
                placeItems: "center",
                marginBottom: "1.125rem",
              }}
            >
              <Users size={24} />
            </div>
            <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem", fontFamily: "'Outfit', sans-serif" }}>Citizen Portal</h3>
            <p className="text-muted" style={{ fontSize: "0.875rem", lineHeight: 1.6, marginBottom: "1.125rem" }}>
              Report road accidents, injured animals, fires, or flooding with photo proof and GPS tagging. Track status in real time.
            </p>
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.8125rem" }}>
              <li style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--charcoal)" }}>
                <CheckCircle2 size={15} style={{ color: "var(--green-success)" }} /> Geotagged Incident Reporting
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--charcoal)" }}>
                <CheckCircle2 size={15} style={{ color: "var(--green-success)" }} /> Tag Forest Officers & Stations
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--charcoal)" }}>
                <CheckCircle2 size={15} style={{ color: "var(--green-success)" }} /> Live Status Tracking
              </li>
            </ul>
          </Card>

          <Card
            className="card-hover"
            style={{
              borderTop: "4px solid var(--amber-warning)",
              backgroundColor: "#FFFFFF",
              padding: "1.75rem",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                backgroundColor: "var(--amber-bg)",
                color: "var(--amber-warning)",
                display: "grid",
                placeItems: "center",
                marginBottom: "1.125rem",
              }}
            >
              <Shield size={24} />
            </div>
            <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem", fontFamily: "'Outfit', sans-serif" }}>Emergency Officer Command</h3>
            <p className="text-muted" style={{ fontSize: "0.875rem", lineHeight: 1.6, marginBottom: "1.125rem" }}>
              Triage incoming reports, issue targeted radius geographic alerts, log internal notes, and publish community notices.
            </p>
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.8125rem" }}>
              <li style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--charcoal)" }}>
                <CheckCircle2 size={15} style={{ color: "var(--amber-warning)" }} /> Radius Geo-Targeted Broadcasting
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--charcoal)" }}>
                <CheckCircle2 size={15} style={{ color: "var(--amber-warning)" }} /> Priority Severity Triage
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--charcoal)" }}>
                <CheckCircle2 size={15} style={{ color: "var(--amber-warning)" }} /> Protected Internal Notes
              </li>
            </ul>
          </Card>

          <Card
            className="card-hover"
            style={{
              borderTop: "4px solid #059669",
              backgroundColor: "#FFFFFF",
              padding: "1.75rem",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                backgroundColor: "#D1FAE5",
                color: "#059669",
                display: "grid",
                placeItems: "center",
                marginBottom: "1.125rem",
              }}
            >
              <Compass size={24} />
            </div>
            <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem", fontFamily: "'Outfit', sans-serif" }}>Forest Wildlife & RRT Patrol</h3>
            <p className="text-muted" style={{ fontSize: "0.875rem", lineHeight: 1.6, marginBottom: "1.125rem" }}>
              Receive geotagged wildlife conflict alerts, dispatch veterinary flying squads, and publish regional safety buffers.
            </p>
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.8125rem" }}>
              <li style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--charcoal)" }}>
                <CheckCircle2 size={15} style={{ color: "#059669" }} /> Range & Station Direct Dispatch
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--charcoal)" }}>
                <CheckCircle2 size={15} style={{ color: "#059669" }} /> Rapid Response Team (RRT) Mobilization
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--charcoal)" }}>
                <CheckCircle2 size={15} style={{ color: "#059669" }} /> Geofenced Risk Field Broadcast
              </li>
            </ul>
          </Card>
        </div>
      </section>

      {/* HOW IT OPERATES */}
      <section style={{ backgroundColor: "#FFFFFF", padding: "4rem 1.5rem", borderTop: "1px solid var(--border-color)", borderBottom: "1px solid var(--border-color)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", maxWidth: "650px", margin: "0 auto 3rem" }}>
            <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--primary-green)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "0.375rem" }}>
              TRANSPARENT RESPONSE LIFECYCLE
            </span>
            <h2 style={{ fontSize: "1.875rem", marginBottom: "0.75rem", fontFamily: "'Outfit', sans-serif" }}>5-Stage Incident Process</h2>
            <p className="text-muted" style={{ fontSize: "1rem" }}>
              From initial citizen report to official verification, forest squad dispatch, and resolution.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
              gap: "1.25rem",
            }}
          >
            {[
              { step: "01", title: "Log Incident", desc: "Citizen logs sighting with photo, map pin, & tags Forest Officers." },
              { step: "02", title: "Officer Triage", desc: "Forest officers verify severity level and evidence." },
              { step: "03", title: "Forest RRT Dispatch", desc: "System dispatches forest flying squads & rapid response units." },
              { step: "04", title: "Geo-Target Alert", desc: "Radius alerts broadcasted to citizens in high-risk zones." },
              { step: "05", title: "Case Closure", desc: "Responders record actions and mark incident resolved." },
            ].map((s) => (
              <Card key={s.step} style={{ backgroundColor: "var(--bg-warm)", border: "1px solid var(--border-color)", padding: "1.25rem" }}>
                <span style={{ fontSize: "1.5rem", fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: "var(--primary-green)", display: "block", marginBottom: "0.375rem" }}>
                  {s.step}
                </span>
                <h4 style={{ fontSize: "1.0625rem", marginBottom: "0.375rem", fontFamily: "'Outfit', sans-serif" }}>{s.title}</h4>
                <p className="text-muted" style={{ fontSize: "0.8125rem", lineHeight: 1.5 }}>
                  {s.desc}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* LIGHT SHADE FOOTER CTA */}
      <section style={{ padding: "4rem 1.5rem", maxWidth: "1280px", margin: "0 auto" }}>
        <Card
          style={{
            background: "linear-gradient(135deg, #EBF4EF 0%, #DFECE5 100%)",
            color: "var(--deep-forest)",
            padding: "3rem 2.25rem",
            borderRadius: "20px",
            border: "1.5px solid rgba(39, 103, 73, 0.2)",
            boxShadow: "0 10px 25px rgba(39, 103, 73, 0.08)",
          }}
        >
          <div className="flex-between" style={{ flexWrap: "wrap", gap: "1.75rem" }}>
            <div style={{ maxWidth: "650px" }}>
              <span className="hero-tagline-script" style={{ display: "block", marginBottom: "0.375rem" }}>
                Join the Safety & Wildlife Protection Network
              </span>
              <h3 style={{ fontSize: "1.75rem", color: "var(--deep-forest)", marginBottom: "0.625rem", fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>
                Ready to Protect Your Community?
              </h3>
              <p style={{ color: "var(--muted-text)", fontSize: "1rem", lineHeight: 1.6 }}>
                TheraPhylax is backed by Amazon Cognito authentication in AWS Mumbai (ap-south-1), ensuring role-based privacy, verified incident reporting, and immediate emergency access.
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.875rem", flexWrap: "wrap" }}>
              <Link to="/register">
                <Button variant="primary" size="md" style={{ backgroundColor: "#276749", padding: "0.75rem 1.5rem" }}>
                  Create Free Account
                </Button>
              </Link>
              <Link to="/accidents/report">
                <Button variant="outline" size="md" style={{ borderColor: "var(--primary-green)", color: "var(--primary-green)", backgroundColor: "#FFFFFF", padding: "0.75rem 1.5rem" }}>
                  Report an Incident
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
};
