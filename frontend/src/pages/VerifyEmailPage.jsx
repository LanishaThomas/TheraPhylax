import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Shield, Mail, KeyRound, CheckCircle2, RefreshCw, ArrowLeft } from "lucide-react";
import { authService } from "../services/auth";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { AlertMessage } from "../components/ui/AlertMessage";

export const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const navigate = useNavigate();

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!email || !code) {
      setError("Please enter both your email address and verification code.");
      return;
    }

    setLoading(true);
    try {
      const res = await authService.confirmSignUp(email, code);
      setSuccessMsg(res.message || "Email address verified successfully!");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err.message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError("");
    setSuccessMsg("");

    if (!email) {
      setError("Please enter your email address to resend the code.");
      return;
    }

    setResending(true);
    try {
      const res = await authService.resendConfirmationCode(email);
      setSuccessMsg(res.message || "New code sent to your email!");
    } catch (err) {
      setError(err.message || "Failed to resend confirmation code.");
    } finally {
      setResending(false);
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
      <div style={{ width: "100%", maxWidth: "460px" }}>
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
          <h1 style={{ fontSize: "1.75rem", marginBottom: "0.375rem" }}>Verify Your Email Address</h1>
          <p className="text-muted" style={{ fontSize: "0.9375rem" }}>
            Enter the 6-digit confirmation code sent by Amazon Cognito to your inbox.
          </p>
        </div>

        <Card>
          {error && <AlertMessage type="error" message={error} />}
          {successMsg && <AlertMessage type="success" message={successMsg} />}

          <form onSubmit={handleVerify} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label htmlFor="email">Email Address</label>
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

            <div>
              <label htmlFor="code">6-Digit Verification Code</label>
              <div style={{ position: "relative" }}>
                <input
                  id="code"
                  type="text"
                  placeholder="e.g. 123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  style={{ paddingLeft: "2.5rem", letterSpacing: "0.1em", fontWeight: 700 }}
                  maxLength={6}
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

            <Button type="submit" variant="primary" loading={loading} style={{ width: "100%" }}>
              Confirm & Verify Account
            </Button>
          </form>

          <div
            style={{
              marginTop: "1.5rem",
              paddingTop: "1.25rem",
              borderTop: "1px solid var(--border-color)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "0.875rem",
            }}
          >
            <Link to="/login" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", fontWeight: 600 }}>
              <ArrowLeft size={16} /> Back to Login
            </Link>

            <button
              type="button"
              onClick={handleResendCode}
              disabled={resending}
              style={{
                background: "none",
                border: "none",
                color: "var(--primary-green)",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              <RefreshCw size={14} className={resending ? "animate-spin" : ""} /> Resend Code
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};
