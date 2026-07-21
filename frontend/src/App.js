import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import AdminLogin from "./admin/AdminLogin";
import AdminDashboard from "./admin/AdminDashboard";
import PasswordReset from "./PasswordReset";
import ForgotPassword from "./ForgotPassword";
import "./App.css";

function App() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if admin is already logged in
    const token = Cookies.get("adminAccessToken");
    if (token) {
      setIsAdminLoggedIn(true);
    }
    setCheckingAuth(false);
  }, []);

  const handleAdminLoginSuccess = () => {
    setIsAdminLoggedIn(true);
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
  };

  if (checkingAuth) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          fontSize: "24px",
        }}
      >
        ⏳ Loading...
      </div>
    );
  }

  // Check if accessing /reset-password path
  if (window.location.pathname === "/reset-password") {
    return <PasswordReset />;
  }

  // Check if accessing /forgot-password path
  if (window.location.pathname === "/forgot-password") {
    return <ForgotPassword />;
  }

  // Check if accessing /admin path
  if (window.location.pathname.startsWith("/admin") || isAdminLoggedIn) {
    return isAdminLoggedIn ? (
      <AdminDashboard onLogout={handleAdminLogout} />
    ) : (
      <AdminLogin onLoginSuccess={handleAdminLoginSuccess} />
    );
  }

  // Default user application (to be implemented)
  return (
    <div className="app-container">
      <div className="overlay"></div>

      <div className="content-card">
        <img src="/logo.jpeg" alt="App Logo" className="app-logo" />

        <h1 className="title">GBN</h1>
        <p className="subtitle">Grow Business Networks</p>

        <a href="/admin" className="admin-btn">
          Go to Admin Panel →
        </a>
      </div>
    </div>
  );
}

export default App;
