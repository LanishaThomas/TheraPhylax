import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Mail, KeyRound, Lock, ArrowLeft } from "lucide-react";
import { authService } from "../services/auth";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { AlertMessage } from "../components/ui/AlertMessage";

export const ForgotPasswordPage = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const navigate = useNavigate();

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!email) {
      setError("Please enter your registered email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await authService.forgotPassword(email);
      setSuccessMsg(res.message || "Reset code sent to your email address.");
      setStep(2);
    } catch (err) {
      setError(err.message || "Failed to send reset code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!code || !newPassword) {
      setError("Please enter the verification code and your new password.");
      return;
    }

    if (newPassword.length < 12) {
      setError("New password must be at least 12 characters long.");
      return;
    }

    setLoading(true);
    try {
      const res = await authService.confirmForgotPassword(email, code, newPassword);
      setSuccessMsg(res.message || "Password successfully reset!");
      setTimeout(() => {
        navigate("/login");
      }, 2500);
    } catch (err) {
      setError(err.message || "Password reset failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 160px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "3rem 1.5rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: "440px" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              backgroundColor: "var(--deep-forest)",
              color: "#FFFFFF",
              display: "grid",
              placeItems: "center",
              margin: "0 auto 1rem",
              boxShadow: "var(--shadow-md)",
            }}
          >
            <Shield size={30} />
          </div>
          <h1 style={{ fontSize: "1.75rem", marginBottom: "0.375rem" }}>Reset Your Password</h1>
          <p className="text-muted" style={{ fontSize: "0.9375rem" }}>
            {step === 1 ? "Enter your email to receive a password reset code" : "Enter the verification code & your new password"}
          </p>
        </div>

        <Card>
          {error && <AlertMessage type="error" message={error} />}
          {successMsg && <AlertMessage type="success" message={successMsg} />}

          {step === 1 ? (
            <form onSubmit={handleRequestCode} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div>
                <label htmlFor="email">Registered Email Address</label>
                <div style={{ position: "relative" }}>
                  <input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ paddingLeft: "2.5rem" }}
                    required
                  />
                  <Mail
                    size={18}
                    style={{
                      position: "absolute",
                      left: "0.875rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--muted-text)",
                    }}
                  />
                </div>
              </div>

              <Button type="submit" variant="primary" loading={loading} style={{ width: "100%" }}>
                Send Reset Code
              </Button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div>
                <label htmlFor="code">Verification Code</label>
                <div style={{ position: "relative" }}>
                  <input
                    id="code"
                    type="text"
                    placeholder="e.g. 123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    style={{ paddingLeft: "2.5rem" }}
                    required
                  />
                  <KeyRound
                    size={18}
                    style={{
                      position: "absolute",
                      left: "0.875rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--muted-text)",
                    }}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="newPassword">New Password (Min 12 chars)</label>
                <div style={{ position: "relative" }}>
                  <input
                    id="newPassword"
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ paddingLeft: "2.5rem" }}
                    required
                  />
                  <Lock
                    size={18}
                    style={{
                      position: "absolute",
                      left: "0.875rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--muted-text)",
                    }}
                  />
                </div>
              </div>

              <Button type="submit" variant="primary" loading={loading} style={{ width: "100%" }}>
                Reset Password
              </Button>
            </form>
          )}

          <div
            style={{
              marginTop: "1.5rem",
              paddingTop: "1.25rem",
              borderTop: "1px solid var(--border-color)",
              textAlign: "center",
              fontSize: "0.875rem",
            }}
          >
            <Link to="/login" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontWeight: 700 }}>
              <ArrowLeft size={16} /> Return to Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
