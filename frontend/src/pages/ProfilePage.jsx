import React, { useState } from "react";
import { User, Shield, LogOut, Save } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { apiService } from "../services/api";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { AlertMessage } from "../components/ui/AlertMessage";

export const ProfilePage = () => {
  const { user, role, logout, updateUser, cognitoActive } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    setError("");

    try {
      await apiService.updateUserProfile({ name, phone });
      updateUser({ name, phone });
      setMsg("Profile details updated successfully.");
    } catch (err) {
      updateUser({ name, phone });
      setMsg("Profile saved locally.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", margin: 0 }}>Account Settings & Profile</h1>
        <p className="text-muted" style={{ fontSize: "0.9375rem", marginTop: "0.25rem" }}>
          Manage your personal information, security preferences, and role permissions.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <Card style={{ backgroundColor: "var(--deep-forest)", color: "#FFFFFF" }}>
          <div className="flex-between" style={{ flexWrap: "wrap", gap: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  backgroundColor: "var(--primary-green)",
                  color: "#FFFFFF",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "1.75rem",
                  fontWeight: 800,
                  border: "2px solid var(--sage)",
                }}
              >
                {user?.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div>
                <h3 style={{ fontSize: "1.375rem", color: "#FFFFFF", margin: 0 }}>{user?.name || "User Account"}</h3>
                <p style={{ color: "var(--sage)", fontSize: "0.875rem", marginTop: "0.25rem" }}>{user?.email}</p>
              </div>
            </div>

            <Badge variant={role === "Admin" ? "critical" : role === "Responder" ? "high" : "medium"}>
              {role} Account
            </Badge>
          </div>
        </Card>

        {msg && <AlertMessage type="success" message={msg} />}
        {error && <AlertMessage type="error" message={error} />}

        <Card title="Personal Information">
          <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div className="grid-cols-2" style={{ gap: "1.25rem" }}>
              <div>
                <label htmlFor="name">Full Name</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="email">Email Address (Read-only)</label>
                <input id="email" type="email" value={user?.email || ""} disabled style={{ backgroundColor: "#F3F4F6", cursor: "not-allowed" }} />
              </div>
            </div>

            <div>
              <label htmlFor="phone">Emergency Contact Phone Number</label>
              <input
                id="phone"
                type="tel"
                placeholder="+91 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button type="submit" variant="primary" loading={loading} icon={Save}>
                Save Profile Changes
              </Button>
            </div>
          </form>
        </Card>

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
                <strong>Account Privilege Level:</strong>
                <div className="text-muted">Role: {role} (Enforced by backend token validation)</div>
              </div>
              <Shield size={20} style={{ color: "var(--primary-green)" }} />
            </div>
          </div>
        </Card>

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
