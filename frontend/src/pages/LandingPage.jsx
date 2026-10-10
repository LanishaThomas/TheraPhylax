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
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

export const LandingPage = () => {
  return (
    <div style={{ backgroundColor: "var(--bg-warm)", minHeight: "100vh" }}>
      {/* HERO SECTION */}
      <section
        style={{
          background: "linear-gradient(135deg, #071D13 0%, #133927 50%, #1C4F37 100%)",
          color: "#FFFFFF",
          padding: "5.5rem 1.5rem 6.5rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow reflections */}
        <div
          style={{
            position: "absolute",
            top: "-10%",
            right: "5%",
            width: "500px",
            height: "500px",
            background: "radial-gradient(circle, rgba(52, 211, 153, 0.15) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-10%",
            left: "-5%",
            width: "450px",
            height: "450px",
            background: "radial-gradient(circle, rgba(229, 192, 123, 0.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ maxWidth: "1280px", margin: "0 auto", position: "relative", zIndex: 2 }}>
          <div style={{ maxWidth: "840px" }}>
            {/* Cursive Decorative Subheading Tagline */}
            <div style={{ marginBottom: "0.75rem" }}>
              <span
                style={{
                  fontFamily: "'Dancing Script', cursive",
                  fontSize: "clamp(1.6rem, 3.8vw, 2.5rem)",
                  color: "#E5C07B",
                  fontWeight: 700,
                  letterSpacing: "0.5px",
                  display: "block",
                  lineHeight: 1.25,
                  textShadow: "0 2px 10px rgba(0,0,0,0.3)",
                }}
              >
                ✨ Protecting Communities, Preserving Wildlife & Mobilizing Emergency Action
              </span>
            </div>

            {/* Pill Badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                backgroundColor: "rgba(167, 196, 160, 0.15)",
                border: "1px solid rgba(167, 196, 160, 0.3)",
                color: "var(--sage)",
                padding: "0.375rem 1rem",
                borderRadius: "9999px",
                fontSize: "0.8125rem",
                fontWeight: 700,
                marginBottom: "1.5rem",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              <Zap size={14} style={{ color: "#34D399" }} />
              <span>Multi-Role Emergency & Rescue Response Platform</span>
            </div>

            {/* Main Headline */}
            <h1
              style={{
                fontSize: "clamp(2.5rem, 5.5vw, 4.25rem)",
                lineHeight: 1.12,
                color: "#FFFFFF",
                marginBottom: "1.5rem",
                fontFamily: "var(--font-heading)",
                fontWeight: 800,
                letterSpacing: "-0.02em",
              }}
            >
              From Emergency Sightings to{" "}
              <span
                style={{
                  color: "#34D399",
                  fontStyle: "italic",
                  fontFamily: "'Playfair Display', serif",
                }}
              >
                Instant, Coordinated Response.
              </span>
            </h1>

            <p
              style={{
                fontSize: "1.25rem",
                lineHeight: 1.65,
                color: "rgba(255, 255, 255, 0.88)",
                marginBottom: "2.25rem",
                maxWidth: "740px",
              }}
            >
              TheraPhylax connects Citizens, Forest Officers, and Animal Rescue NGOs in real-time. Report road accidents, injured wildlife, natural hazards, and spatial risks for swift action.
            </p>

            {/* Call to Action Buttons - RISK ZONES REMOVED */}
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
              <Link to="/accidents/report">
                <Button
                  variant="primary"
                  size="lg"
                  icon={FilePlus}
                  style={{
                    backgroundColor: "#276749",
                    backgroundImage: "linear-gradient(135deg, #276749 0%, #1B4D36 100%)",
                    boxShadow: "0 6px 20px rgba(39, 103, 73, 0.5)",
                    fontSize: "1.0625rem",
                    padding: "0.875rem 1.75rem",
                  }}
                >
                  Report Incident / Accident Now
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  variant="outline"
                  size="lg"
                  icon={ArrowRight}
                  style={{
                    color: "#FFFFFF",
                    borderColor: "rgba(255, 255, 255, 0.4)",
                    backgroundColor: "rgba(255, 255, 255, 0.06)",
                    fontSize: "1.0625rem",
                    padding: "0.875rem 1.5rem",
                  }}
                >
                  Sign In to Access Portal
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1.25rem",
              marginTop: "4.5rem",
              paddingTop: "2.5rem",
              borderTop: "1px solid rgba(255, 255, 255, 0.12)",
            }}
          >
            {[
              { number: "112 & 108", label: "Verified Helplines Integrated", icon: PhoneCall, color: "#FCA5A5" },
              { number: "Real-time", label: "Officer Geo-Alert Broadcasts", icon: Bell, color: "#FDE047" },
              { number: "Automated", label: "Animal Rescue NGO Matching", icon: Heart, color: "#F472B6" },
              { number: "AWS Cognito", label: "Role-Based Mumbai Cloud Auth", icon: Lock, color: "#34D399" },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div
                  key={i}
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.06)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "16px",
                    padding: "1.25rem 1.5rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                  }}
                >
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                      display: "grid",
                      placeItems: "center",
                      color: stat.color,
                    }}
                  >
                    <Icon size={22} />
                  </div>
                  <div>
                    <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "#FFFFFF", display: "block" }}>
                      {stat.number}
                    </span>
                    <span style={{ fontSize: "0.8125rem", color: "rgba(255, 255, 255, 0.75)", fontWeight: 500 }}>
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
      <section style={{ padding: "5.5rem 1.5rem", maxWidth: "1280px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", maxWidth: "720px", margin: "0 auto 3.5rem" }}>
          <span
            style={{
              fontFamily: "'Dancing Script', cursive",
              fontSize: "1.875rem",
              color: "var(--primary-green)",
              fontWeight: 700,
              display: "block",
              marginBottom: "0.5rem",
            }}
          >
            ~ Unified Multi-Role Architecture ~
          </span>
          <h2 style={{ fontSize: "2.375rem", marginBottom: "1rem" }}>Tailored Portals for Every Stakeholder</h2>
          <p className="text-muted" style={{ fontSize: "1.125rem", lineHeight: 1.6 }}>
            Empowering citizens to report incidents, enabling forest officers to triage and issue geo-alerts, and connecting NGO personnel for swift animal rescue operations.
          </p>
        </div>

        <div className="grid-cols-3" style={{ gap: "2rem" }}>
          <Card
            className="card-hover"
            style={{
              borderTop: "4px solid var(--primary-green)",
              backgroundColor: "#FFFFFF",
              padding: "2rem",
            }}
          >
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "14px",
                backgroundColor: "var(--sage-light)",
                color: "var(--primary-green)",
                display: "grid",
                placeItems: "center",
                marginBottom: "1.25rem",
              }}
            >
              <Users size={26} />
            </div>
            <h3 style={{ fontSize: "1.375rem", marginBottom: "0.625rem" }}>Citizen Portal</h3>
            <p className="text-muted" style={{ fontSize: "0.9375rem", lineHeight: 1.6, marginBottom: "1.25rem" }}>
              Report road accidents, injured animals, fires, or flooding with photo proof and GPS tagging. Track your status in real time.
            </p>
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.875rem" }}>
              <li style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--charcoal)" }}>
                <CheckCircle2 size={16} style={{ color: "var(--green-success)" }} /> Geotagged Incident Reporting
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--charcoal)" }}>
                <CheckCircle2 size={16} style={{ color: "var(--green-success)" }} /> Automated NGO Rescue Request
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--charcoal)" }}>
                <CheckCircle2 size={16} style={{ color: "var(--green-success)" }} /> Live Status Tracking
              </li>
            </ul>
          </Card>

          <Card
            className="card-hover"
            style={{
              borderTop: "4px solid var(--amber-warning)",
              backgroundColor: "#FFFFFF",
              padding: "2rem",
            }}
          >
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "14px",
                backgroundColor: "var(--amber-bg)",
                color: "var(--amber-warning)",
                display: "grid",
                placeItems: "center",
                marginBottom: "1.25rem",
              }}
            >
              <Shield size={26} />
            </div>
            <h3 style={{ fontSize: "1.375rem", marginBottom: "0.625rem" }}>Emergency Officer Command</h3>
            <p className="text-muted" style={{ fontSize: "0.9375rem", lineHeight: 1.6, marginBottom: "1.25rem" }}>
              Triage incoming reports, issue targeted radius geographic alerts, log internal notes, and publish low-severity community notices.
            </p>
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.875rem" }}>
              <li style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--charcoal)" }}>
                <CheckCircle2 size={16} style={{ color: "var(--amber-warning)" }} /> Radius Geo-Targeted Broadcasting
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--charcoal)" }}>
                <CheckCircle2 size={16} style={{ color: "var(--amber-warning)" }} /> Priority Severity Triage
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--charcoal)" }}>
                <CheckCircle2 size={16} style={{ color: "var(--amber-warning)" }} /> Protected Internal Officer Notes
              </li>
            </ul>
          </Card>

          <Card
            className="card-hover"
            style={{
              borderTop: "4px solid #EC4899",
              backgroundColor: "#FFFFFF",
              padding: "2rem",
            }}
          >
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "14px",
                backgroundColor: "#FCE7F3",
                color: "#DB2777",
                display: "grid",
                placeItems: "center",
                marginBottom: "1.25rem",
              }}
            >
              <Heart size={26} />
            </div>
            <h3 style={{ fontSize: "1.375rem", marginBottom: "0.625rem" }}>NGO Rescue Desk</h3>
            <p className="text-muted" style={{ fontSize: "0.9375rem", lineHeight: 1.6, marginBottom: "1.25rem" }}>
              Receive matched animal rescue requests based on service location and coverage. Accept or update dispatch states seamlessly.
            </p>
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.875rem" }}>
              <li style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--charcoal)" }}>
                <CheckCircle2 size={16} style={{ color: "#DB2777" }} /> Smart Location-Based Matching
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--charcoal)" }}>
                <CheckCircle2 size={16} style={{ color: "#DB2777" }} /> Accept / Decline Dispatch Workflow
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--charcoal)" }}>
                <CheckCircle2 size={16} style={{ color: "#DB2777" }} /> Organization Profile & Availability
              </li>
            </ul>
          </Card>
        </div>
      </section>

      {/* HOW IT OPERATES */}
      <section style={{ backgroundColor: "#FFFFFF", padding: "5rem 1.5rem", borderTop: "1px solid var(--border-color)", borderBottom: "1px solid var(--border-color)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", maxWidth: "700px", margin: "0 auto 3.5rem" }}>
            <span
              style={{
                fontFamily: "'Dancing Script', cursive",
                fontSize: "1.75rem",
                color: "var(--primary-green)",
                fontWeight: 700,
                display: "block",
                marginBottom: "0.375rem",
              }}
            >
              ~ Seamless Response Workflow ~
            </span>
            <h2 style={{ fontSize: "2.25rem", marginBottom: "1rem" }}>5-Stage Incident Lifecycle</h2>
            <p className="text-muted" style={{ fontSize: "1.125rem" }}>
              From initial citizen reporting to official dispatch and verified resolution.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {[
              { step: "01", title: "Log Incident", desc: "Citizen or officer logs sighting with photo & map coordinates." },
              { step: "02", title: "Officer Triage", desc: "Forest officers verify severity level and evidence." },
              { step: "03", title: "NGO Dispatch", desc: "System routes injured animal calls to qualified local NGOs." },
              { step: "04", title: "Geo-Target Alert", desc: "Radius alerts broadcasted to citizens in high-risk zones." },
              { step: "05", title: "Case Closure", desc: "Responders record actions and mark incident resolved." },
            ].map((s) => (
              <Card key={s.step} style={{ backgroundColor: "var(--bg-warm)", border: "1px solid var(--border-color)" }}>
                <span style={{ fontSize: "1.75rem", fontFamily: "var(--font-heading)", fontWeight: 800, color: "var(--primary-green)", display: "block", marginBottom: "0.5rem" }}>
                  {s.step}
                </span>
                <h4 style={{ fontSize: "1.125rem", marginBottom: "0.375rem" }}>{s.title}</h4>
                <p className="text-muted" style={{ fontSize: "0.875rem", lineHeight: 1.5 }}>
                  {s.desc}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section style={{ padding: "4.5rem 1.5rem", maxWidth: "1280px", margin: "0 auto" }}>
        <Card
          style={{
            background: "linear-gradient(135deg, #173D2D 0%, #0F2D20 100%)",
            color: "#FFFFFF",
            padding: "3.5rem 2.5rem",
            borderRadius: "24px",
            boxShadow: "0 20px 40px rgba(15, 45, 32, 0.3)",
          }}
        >
          <div className="flex-between" style={{ flexWrap: "wrap", gap: "2rem" }}>
            <div style={{ maxWidth: "680px" }}>
              <span
                style={{
                  fontFamily: "'Dancing Script', cursive",
                  fontSize: "1.875rem",
                  color: "#E5C07B",
                  fontWeight: 700,
                  display: "block",
                  marginBottom: "0.5rem",
                }}
              >
                Join the Safety & Wildlife Network
              </span>
              <h3 style={{ fontSize: "2.125rem", color: "#FFFFFF", marginBottom: "0.75rem", fontWeight: 800 }}>
                Ready to Protect Your Community?
              </h3>
              <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "1.0625rem", lineHeight: 1.6 }}>
                TheraPhylax is backed by enterprise Amazon Cognito authentication in ap-south-1 (Mumbai), ensuring data privacy, role-based safety, and immediate emergency access.
              </p>
            </div>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <Link to="/register">
                <Button variant="primary" size="lg" style={{ backgroundColor: "#276749", padding: "0.875rem 1.75rem" }}>
                  Create Free Account
                </Button>
              </Link>
              <Link to="/accidents/report">
                <Button variant="secondary" size="lg" style={{ padding: "0.875rem 1.75rem" }}>
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
