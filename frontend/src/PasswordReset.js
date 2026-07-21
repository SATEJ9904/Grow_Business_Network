import React, { useState, useEffect } from "react";
import "./PasswordReset.css";

function PasswordReset() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Extract token from URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get("token");

    if (!resetToken) {
      setError("Invalid or missing reset token");
      return;
    }

    setToken(resetToken);
    verifyToken(resetToken);
  }, []);

  const verifyToken = async (resetToken) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL || "http://localhost:6001"}/api/auth/verify-reset-token/${resetToken}`,
      );
      const data = await response.json();

      if (!data.success) {
        setError(data.message || "Invalid or expired reset token");
      }
    } catch (err) {
      setError("Failed to verify reset token. Please try again.");
      console.error("Token verification error:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    // Validation
    if (!password) {
      setError("Password is required");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL || "http://localhost:6001"}/api/auth/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            password,
            confirmPassword,
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setMessage("Password reset successfully! Redirecting to login...");
        setPassword("");
        setConfirmPassword("");

        // Redirect to login after 3 seconds
        setTimeout(() => {
          window.location.href = "/login";
        }, 3000);
      } else {
        setError(data.message || "Failed to reset password");
      }
    } catch (err) {
      setError(
        "An error occurred while resetting your password. Please try again.",
      );
      console.error("Password reset error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (error && !password) {
    return (
      <div className="password-reset-container">
        <div className="reset-card error-card">
          <h2>Password Reset</h2>
          <div className="error-message">
            <span>⚠️ {error}</span>
          </div>
          <p>This reset link may be invalid or expired. Please try again.</p>
          <a href="/forgot-password" className="btn btn-primary">
            Request New Reset Link
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="password-reset-container">
      <div className="reset-card">
        <h2>Reset Your Password</h2>

        {success && (
          <div className="success-message">
            <span>✓ {message}</span>
          </div>
        )}

        {error && (
          <div className="error-message">
            <span>⚠️ {error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="password">New Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              required
              disabled={loading || success}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              required
              disabled={loading || success}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || success}
          >
            {loading ? "Resetting Password..." : "Reset Password"}
          </button>
        </form>

        <div className="password-requirements">
          <p>
            <strong>Password Requirements:</strong>
          </p>
          <ul>
            <li>Minimum 6 characters</li>
            <li>Passwords must match</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default PasswordReset;
