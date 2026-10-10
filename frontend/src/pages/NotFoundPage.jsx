import React from "react";
import { Link } from "react-router-dom";
import { Compass, ArrowLeft } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

export const NotFoundPage = () => {
  return (
    <div
      style={{
        minHeight: "70vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.5rem",
      }}
    >
      <Card style={{ maxWidth: "500px", textAlign: "center", padding: "3rem 2rem" }}>
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            backgroundColor: "var(--sage-light)",
            color: "var(--primary-green)",
            display: "grid",
            placeItems: "center",
            margin: "0 auto 1.25rem",
          }}
        >
          <Compass size={36} />
        </div>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>404 — Page Not Found</h1>
        <p className="text-muted" style={{ marginBottom: "1.75rem", lineHeight: 1.6 }}>
          The requested page route does not exist or may have been moved.
        </p>
        <Link to="/">
          <Button variant="primary" icon={ArrowLeft}>
            Return to TheraPhylax Home
          </Button>
        </Link>
      </Card>
    </div>
  );
};
