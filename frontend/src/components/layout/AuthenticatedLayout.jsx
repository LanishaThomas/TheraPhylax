import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export const AuthenticatedLayout = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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
        <main style={{ flex: 1, padding: "1.75rem", maxWidth: "1280px", width: "100%", margin: "0 auto" }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .main-content-wrapper { padding-left: 260px; }
        }
      `}</style>
    </div>
  );
};
