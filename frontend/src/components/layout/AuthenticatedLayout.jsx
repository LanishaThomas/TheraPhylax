import React, { useState } from "react";
import { Outlet, Link } from "react-router-dom";
import { MapPin, AlertTriangle, ArrowRight } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../ui/Button";

export const AuthenticatedLayout = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { user } = useAuth();

  const hasAddress = Boolean(user?.address || user?.location_name);

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--bg-warm)" }}>
      <Sidebar mobileOpen={mobileSidebarOpen} setMobileOpen={setMobileSidebarOpen} />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
        className="main-content-wrapper"
      >
        <Topbar onMobileToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)} />

        {/* ADDRESS REQUIRED WARNING BANNER / TOOLTIP */}
        {!hasAddress && (
          <div
            style={{
              backgroundColor: "#FEF3C7",
              borderBottom: "1.5px solid #FDE047",
              padding: "0.75rem 1.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "0.875rem",
              color: "#92400E",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              zIndex: 30,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div
                style={{
                  backgroundColor: "#F59E0B",
                  color: "#FFFFFF",
                  padding: "0.375rem",
                  borderRadius: "8px",
                  display: "flex",
                }}
              >
                <MapPin size={18} />
              </div>
              <div>
                <strong style={{ fontSize: "0.9375rem" }}>Address Setup Needed:</strong>
                <span style={{ marginLeft: "0.5rem", fontSize: "0.875rem" }}>
                  Most TheraPhylax features (emergency alerts, forest officer dispatches, and hazard maps) are location-based. Please set your address first.
                </span>
              </div>
            </div>

            <Link to="/profile">
              <Button
                variant="primary"
                size="sm"
                icon={ArrowRight}
                style={{
                  backgroundColor: "#D97706",
                  borderColor: "#B45309",
                  color: "#FFFFFF",
                  whiteSpace: "nowrap",
                }}
              >
                Set Address in Profile Now
              </Button>
            </Link>
          </div>
        )}

        <main style={{ flex: 1, padding: "1.75rem", maxWidth: "1280px", width: "100%", margin: "0 auto" }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .main-content-wrapper { padding-left: 270px; }
        }
      `}</style>
    </div>
  );
};
