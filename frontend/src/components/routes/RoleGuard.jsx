import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";

export const RoleGuard = ({ allowedRoles, children }) => {
  const { role, user } = useAuth();

  const isAllowed = allowedRoles.includes(role);

  if (!isAllowed) {
    return (
      <div style={{ maxWidth: "560px", margin: "4rem auto 0" }}>
        <Card style={{ textAlign: "center", padding: "2.5rem 1.5rem" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              backgroundColor: "var(--red-bg)",
              color: "var(--red-critical)",
              display: "grid",
              placeItems: "center",
              margin: "0 auto 1.25rem",
            }}
          >
            <ShieldAlert size={36} />
          </div>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Access Restricted</h2>
          <p className="text-muted" style={{ marginBottom: "1.5rem", lineHeight: 1.6 }}>
            You are logged in as <strong>{user?.name}</strong> with the <strong>{role}</strong> role. This workspace requires <strong>{allowedRoles.join(" or ")}</strong> privileges.
          </p>
          <Link to="/dashboard">
            <Button variant="primary" icon={ArrowLeft}>
              Return to Citizen Dashboard
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return children;
};
