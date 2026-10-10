import React from "react";
import { Settings, Users, Shield, Server, Activity } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";

export const AdminDashboardPage = () => {
  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
      <Card style={{ backgroundColor: "var(--deep-forest)", color: "#FFFFFF", marginBottom: "2rem", padding: "2rem" }}>
        <div className="flex-between" style={{ flexWrap: "wrap", gap: "1.5rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--sage)", fontWeight: 700, fontSize: "0.875rem", marginBottom: "0.5rem" }}>
              <Settings size={18} />
              <span>PLATFORM ADMINISTRATOR CONSOLE</span>
            </div>
            <h1 style={{ fontSize: "1.875rem", color: "#FFFFFF", margin: 0 }}>
              TheraPhylax System Governance
            </h1>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9375rem", marginTop: "0.25rem" }}>
              Manage user privilege roles, AWS Cognito User Pool policies, geofence parameters, and operational audit logs.
            </p>
          </div>

          <Badge variant="critical" style={{ fontSize: "0.875rem", padding: "0.5rem 1rem" }}>
            Admin Access Level
          </Badge>
        </div>
      </Card>

      <div className="grid-cols-4" style={{ gap: "1.25rem", marginBottom: "2rem" }}>
        <Card>
          <div className="flex-between" style={{ marginBottom: "0.5rem" }}>
            <span className="text-muted" style={{ fontSize: "0.875rem", fontWeight: 600 }}>Total Registered Users</span>
            <Users size={20} style={{ color: "var(--primary-green)" }} />
          </div>
          <p style={{ fontSize: "2rem", fontWeight: 800, color: "var(--deep-forest)", margin: 0 }}>
            142
          </p>
          <span style={{ fontSize: "0.75rem", color: "var(--muted-text)" }}>Citizens & Responders</span>
        </Card>

        <Card>
          <div className="flex-between" style={{ marginBottom: "0.5rem" }}>
            <span className="text-muted" style={{ fontSize: "0.875rem", fontWeight: 600 }}>Active Geofences</span>
            <Activity size={20} style={{ color: "var(--blue-info)" }} />
          </div>
          <p style={{ fontSize: "2rem", fontWeight: 800, color: "var(--blue-info)", margin: 0 }}>
            8
          </p>
          <span style={{ fontSize: "0.75rem", color: "var(--muted-text)" }}>Monitored forest buffer zones</span>
        </Card>

        <Card>
          <div className="flex-between" style={{ marginBottom: "0.5rem" }}>
            <span className="text-muted" style={{ fontSize: "0.875rem", fontWeight: 600 }}>Cognito User Pool</span>
            <Shield size={20} style={{ color: "var(--green-success)" }} />
          </div>
          <p style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--green-success)", margin: "0.5rem 0 0" }}>
            ap-south-1
          </p>
          <span style={{ fontSize: "0.75rem", color: "var(--muted-text)" }}>theraphylax-users-mumbai</span>
        </Card>

        <Card>
          <div className="flex-between" style={{ marginBottom: "0.5rem" }}>
            <span className="text-muted" style={{ fontSize: "0.875rem", fontWeight: 600 }}>FastAPI Status</span>
            <Server size={20} style={{ color: "var(--green-success)" }} />
          </div>
          <p style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--green-success)", margin: "0.5rem 0 0" }}>
            Online (8000)
          </p>
          <span style={{ fontSize: "0.75rem", color: "var(--muted-text)" }}>PostgreSQL Connectivity</span>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }} className="admin-grid">
        <Card title="User Role Management & Oversight">
          <p className="text-muted" style={{ fontSize: "0.875rem", marginBottom: "1rem" }}>
            Public user self-registration is strictly defaulted to <strong>Citizen</strong>. Administrative promotion to <strong>Responder</strong> or <strong>Admin</strong> must be approved below.
          </p>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User Email</th>
                  <th>Current Role</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>responder.officer@theraphylax.gov.in</td>
                  <td><Badge variant="high">Responder</Badge></td>
                  <td><Button variant="ghost" size="sm">Manage</Button></td>
                </tr>
                <tr>
                  <td>admin.control@theraphylax.gov.in</td>
                  <td><Badge variant="critical">Admin</Badge></td>
                  <td><Button variant="ghost" size="sm">Manage</Button></td>
                </tr>
                <tr>
                  <td>citizen.user@example.com</td>
                  <td><Badge variant="medium">Citizen</Badge></td>
                  <td><Button variant="outline" size="sm">Promote</Button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Active Spatial Geofence Parameters">
          <p className="text-muted" style={{ fontSize: "0.875rem", marginBottom: "1rem" }}>
            Configured polygon geofences used by the risk calculation engine to trigger automated alerts.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[
              { name: "North Forest Buffer Sector 1", radius: "5.0 km", risk: "High Danger" },
              { name: "South Settlement Boundary", radius: "2.5 km", risk: "Medium Danger" },
              { name: "Highway Wildlife Crossing Corridor", radius: "1.0 km", risk: "Critical Warning" },
            ].map((g, i) => (
              <div key={i} style={{ padding: "0.75rem 1rem", backgroundColor: "var(--bg-warm)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <strong style={{ fontSize: "0.875rem" }}>{g.name}</strong>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted-text)" }}>Buffer Radius: {g.radius}</div>
                </div>
                <Badge variant={g.risk.includes("Critical") ? "critical" : "high"}>{g.risk}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .admin-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};
