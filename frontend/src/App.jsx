import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { PublicLayout } from "./components/layout/PublicLayout";
import { AuthenticatedLayout } from "./components/layout/AuthenticatedLayout";
import { ProtectedRoute } from "./components/routes/ProtectedRoute";
import { RoleGuard } from "./components/routes/RoleGuard";

import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { OfficerLoginPage } from "./pages/OfficerLoginPage";
import { OfficerRegisterPage } from "./pages/OfficerRegisterPage";
import { VerifyEmailPage } from "./pages/VerifyEmailPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { RisksPage } from "./pages/RisksPage";

import { DashboardPage } from "./pages/DashboardPage";
import { NewReportPage } from "./pages/NewReportPage";
import { ReportsPage } from "./pages/ReportsPage";
import { MyReportsPage } from "./pages/MyReportsPage";
import { ReportDetailsPage } from "./pages/ReportDetailsPage";
import { AlertsPage } from "./pages/AlertsPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { CreateGeographicAlertPage } from "./pages/CreateGeographicAlertPage";
import { CreatePublicUpdatePage } from "./pages/CreatePublicUpdatePage";
import { PublicSafetyUpdatesPage } from "./pages/PublicSafetyUpdatesPage";
import { NewsPage } from "./pages/NewsPage";
import { ResponderDashboardPage } from "./pages/ResponderDashboardPage";
import { OfficerDashboardPage } from "./pages/OfficerDashboardPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { NotFoundPage } from "./pages/NotFoundPage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/officer/login" element={<OfficerLoginPage />} />
            <Route path="/officer/register" element={<OfficerRegisterPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/risks" element={<RisksPage />} />
          </Route>

          <Route
            element={
              <ProtectedRoute>
                <AuthenticatedLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            
            {/* Report incident / accident routes */}
            <Route path="/accidents/report" element={<NewReportPage />} />
            <Route path="/reports/new" element={<NewReportPage />} />

            {/* View my submitted reports routes */}
            <Route path="/accidents/my-reports" element={<MyReportsPage />} />
            <Route path="/reports/my" element={<MyReportsPage />} />

            {/* General reports queue & details */}
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/reports/:id" element={<ReportDetailsPage />} />

            {/* Public Safety Updates & Geofenced Map */}
            <Route path="/updates" element={<PublicSafetyUpdatesPage />} />
            <Route path="/officer/updates" element={<PublicSafetyUpdatesPage />} />
            <Route path="/updates/new" element={<RoleGuard allowedRoles={["Officer", "Responder", "Admin"]}><CreatePublicUpdatePage /></RoleGuard>} />
            <Route path="/officer/updates/create" element={<RoleGuard allowedRoles={["Officer", "Responder", "Admin"]}><CreatePublicUpdatePage /></RoleGuard>} />

            {/* Alerts & Notifications */}
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/officer/alerts/create" element={<RoleGuard allowedRoles={["Officer", "Responder", "Admin"]}><CreateGeographicAlertPage /></RoleGuard>} />
            <Route path="/alerts/create-geographic" element={<RoleGuard allowedRoles={["Officer", "Responder", "Admin"]}><CreateGeographicAlertPage /></RoleGuard>} />
            <Route path="/officer/geofence" element={<RoleGuard allowedRoles={["Officer", "Responder", "Admin"]}><CreateGeographicAlertPage /></RoleGuard>} />

            {/* News & Profile */}
            <Route path="/news" element={<NewsPage />} />
            <Route path="/profile" element={<ProfilePage />} />

            {/* Officer & Responder Dashboards */}
            <Route
              path="/officer/dashboard"
              element={
                <RoleGuard allowedRoles={["Officer", "Responder", "Admin"]}>
                  <OfficerDashboardPage />
                </RoleGuard>
              }
            />
            <Route
              path="/responder"
              element={
                <RoleGuard allowedRoles={["Officer", "Responder", "Admin"]}>
                  <OfficerDashboardPage />
                </RoleGuard>
              }
            />

            <Route
              path="/admin"
              element={
                <RoleGuard allowedRoles={["Admin"]}>
                  <AdminDashboardPage />
                </RoleGuard>
              }
            />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
