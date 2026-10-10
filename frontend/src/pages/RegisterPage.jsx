import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, User, Mail, Lock, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { AlertMessage } from "../components/ui/AlertMessage";

export const RegisterPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const { register, cognitoActive } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!name || !email || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 12) {
      setError("Password must be at least 12 characters long.");
      return;
    }

    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      setError("Password must contain uppercase letters, lowercase letters, numbers, and special symbols.");
      return;
    }

    setLoading(true);
    try {
      const res = await register({ name, email, password });
      setSuccessMsg(res.message || "Registration successful! Redirecting to email verification...");
      setTimeout(() => {
        navigate(`/verify-email?email=${encodeURIComponent(email)}`);
      }, 1500);
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
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
      <div style={{ width: "100%", maxWidth: "480px" }}>
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
          <h1 style={{ fontSize: "1.75rem", marginBottom: "0.375rem" }}>Create TheraPhylax Account</h1>
          <p className="text-muted" style={{ fontSize: "0.9375rem" }}>
            Join community disaster safety & incident reporting network
          </p>
        </div>

        <Card>
          {cognitoActive && (
            <div
              style={{
                backgroundColor: "var(--sage-light)",
                border: "1px solid var(--sage)",
                color: "var(--deep-forest)",
                padding: "0.625rem 0.875rem",
                borderRadius: "8px",
                fontSize: "0.8125rem",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "1.25rem",
              }}
            >
              <ShieldCheck size={16} style={{ color: "var(--primary-green)" }} />
              <span>Cognito Security Policy Enforced</span>
            </div>
          )}

          {error && <AlertMessage type="error" message={error} />}
          {successMsg && <AlertMessage type="success" title="Account Created!" message={successMsg} />}

          <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}>
            <div>
              <label htmlFor="name">Full Name</label>
              <div style={{ position: "relative" }}>
                <input
                  id="name"
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ paddingLeft: "2.5rem" }}
                  required
                />
                <User
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
              <label htmlFor="password">Password (Min 12 chars, upper, lower, number, symbol)</label>
              <div style={{ position: "relative" }}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: "2.5rem", paddingRight: "2.5rem" }}
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
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "0.875rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--muted-text)",
                    cursor: "pointer",
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div style={{ position: "relative" }}>
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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

            <div
              style={{
                backgroundColor: "var(--bg-warm)",
                padding: "0.75rem",
                borderRadius: "8px",
                fontSize: "0.8125rem",
                color: "var(--muted-text)",
                lineHeight: 1.4,
              }}
            >
              🔒 <strong>Default Role: Citizen</strong>. Account role assignment is restricted for public registration. Responder & Administrator roles require official backend verification.
            </div>

            <Button type="submit" variant="primary" loading={loading} style={{ width: "100%", marginTop: "0.25rem" }}>
              Create Account
            </Button>
          </form>

          <div
            style={{
              marginTop: "1.5rem",
              paddingTop: "1.25rem",
              borderTop: "1px solid var(--border-color)",
              textAlign: "center",
              fontSize: "0.875rem",
            }}
          >
            <span className="text-muted">Already registered? </span>
            <Link to="/login" style={{ fontWeight: 700 }}>
              Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
