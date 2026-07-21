import React, { useState } from "react";
import "./ForgotPassword.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    // Basic email validation
    if (!email) {
      setError("Email is required");
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL || "http://localhost:6000"}/api/auth/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        },
      );

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);
        setMessage(
          "If an account exists with this email, a password reset link will be sent shortly.",
        );
        setEmail("");
      } else {
        setMessage(
          "If an account exists with this email, a password reset link will be sent shortly.",
        );
        setEmail("");
        setSubmitted(true);
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Forgot password error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <h2>Reset Your Password</h2>

        {submitted && (
          <div className="success-message">
            <span>✓ {message}</span>
          </div>
        )}

        {error && (
          <div className="error-message">
            <span>⚠️ {error}</span>
          </div>
        )}

        {!submitted ? (
          <>
            <p className="description">
              Enter your email address and we'll send you a link to reset your
              password.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          </>
        ) : (
          <div className="submitted-state">
            <p className="success-text">✓ Email sent successfully!</p>
            <p>
              Check your email inbox for a password reset link. The link will be
              valid for 1 hour.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                setEmail("");
                setMessage("");
              }}
              className="btn btn-secondary"
            >
              Send Another Reset Link
            </button>
          </div>
        )}

        <div className="login-link">
          <p>
            Remember your password? <a href="/login">Log in here</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
