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
import { VerifyEmailPage } from "./pages/VerifyEmailPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { RisksPage } from "./pages/RisksPage";

import { DashboardPage } from "./pages/DashboardPage";
import { NewReportPage } from "./pages/NewReportPage";
import { ReportsPage } from "./pages/ReportsPage";
import { ReportDetailsPage } from "./pages/ReportDetailsPage";
import { AlertsPage } from "./pages/AlertsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ResponderDashboardPage } from "./pages/ResponderDashboardPage";
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
            <Route path="/reports/new" element={<NewReportPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/reports/:id" element={<ReportDetailsPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/profile" element={<ProfilePage />} />

            <Route
              path="/responder"
              element={
                <RoleGuard allowedRoles={["Responder", "Admin"]}>
                  <ResponderDashboardPage />
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
