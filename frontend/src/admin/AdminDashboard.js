import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import {
  Home,
  CheckCircle,
  FileText,
  Activity,
  LogOut,
  Menu,
  X,
  Trash2,
  Users as UsersIcon,
  UserPlus,
} from "lucide-react";
import DeletionRequests from "./components/DeletionRequests";
import DashboardHome from "./components/DashboardHome";
import ApprovalRequests from "./components/ApprovalRequests";
import ActivityLogs from "./components/ActivityLogs";
import Users from "./components/Users";
import "./AdminDashboard.css";
import Chapters from "./components/Chapters";
import CreateMember from "./components/CreateMember";

const AdminDashboard = ({ onLogout }) => {
  const [currentPage, setCurrentPage] = useState("home");
  const [adminInfo, setAdminInfo] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [sessionWarning, setSessionWarning] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Initialize admin info
    const storedInfo = Cookies.get("adminInfo");
    if (storedInfo) {
      try {
        setAdminInfo(JSON.parse(storedInfo));
      } catch (e) {
        console.error("Failed to parse admin info:", e);
      }
    }

    // Fetch pending count immediately
    fetchPendingCount();

    // Verify session periodically (every 30 seconds)
    const sessionCheckInterval = setInterval(verifySession, 30000);

    // Fetch pending count periodically
    const pendingCountInterval = setInterval(fetchPendingCount, 30000); // Every 30 seconds

    return () => {
      clearInterval(sessionCheckInterval);
      clearInterval(pendingCountInterval);
    };
  }, []);

  const verifySession = async () => {
    try {
      const sessionId = Cookies.get("adminSessionId");
      const token = Cookies.get("adminAccessToken");

      if (!sessionId || !token) {
        setSessionExpired(true);
        return;
      }

      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/admin/verify-session?sessionId=${sessionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data.success) {
        const remaining = response.data.data.remainingTime;
        setSessionInfo({
          expiryTime: response.data.data.expiryTime,
          remainingTime: remaining,
        });

        // Check if session has expired
        if (remaining <= 0) {
          console.log("⏱️ Session expired");
          setSessionExpired(true);
          setSessionWarning(false);
        } else if (remaining < 1800000) {
          // Show warning if less than 30 minutes remaining
          setSessionWarning(true);
          setSessionExpired(false);
        } else {
          setSessionWarning(false);
          setSessionExpired(false);
        }
      } else {
        setSessionExpired(true);
      }
    } catch (error) {
      console.error("Session verification failed:", error);
      // Don't logout on first error, but will on next check
    }
  };

  const checkSessionWarning = () => {
    if (sessionInfo && sessionInfo.remainingTime < 3600000) {
      setSessionWarning(true);
    }
  };

  const fetchPendingCount = async () => {
    try {
      const token = Cookies.get("adminAccessToken");
      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/admin/members?status=pending&page=1&limit=1`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data.success && response.data.data) {
        const count =
          response.data.pagination?.total || response.data.data.length || 0;
        setPendingCount(count);
      }
    } catch (error) {
      console.error("Failed to fetch pending count:", error);
    }
  };

  const handleLogout = async () => {
    try {
      const sessionId = Cookies.get("adminSessionId");
      const token = Cookies.get("adminAccessToken");

      if (sessionId && token) {
        await axios.post(
          `${process.env.REACT_APP_API_BASE_URL}/admin/logout`,
          { sessionId },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear cookies
      Cookies.remove("adminAccessToken");
      Cookies.remove("adminSessionId");
      Cookies.remove("adminInfo");

      onLogout();
    }
  };

  const handleSessionExpiredLogin = () => {
    // Clear all session data
    Cookies.remove("adminAccessToken");
    Cookies.remove("adminSessionId");
    Cookies.remove("adminInfo");
    setSessionExpired(false);
    // Navigate to login
    onLogout();
  };

  const pageNames = {
    home: "Dashboard",
    requests: "Approval Requests",
    users: "Users",
    chapters: "Chapters",
    "create-member": "Create Member",
    activities: "Activity Logs",
  };

  const sidebarItems = [
    {
      id: "home",
      label: "Dashboard",
      icon: <Home size={20} />,
    },
    {
      id: "requests",
      label: "Approval Requests",
      icon: <UsersIcon size={20} />,
      badge: pendingCount > 0 ? pendingCount : null,
    },
    {
      id: "users",
      label: "Users",
      icon: <CheckCircle size={20} />,
    },

    // ✅ ADD THIS
    {
      id: "chapters",
      label: "Chapters",
      icon: <FileText size={20} />,
    },

    {
      id: "create-member",
      label: "Create Member",
      icon: <UserPlus size={20} />,
    },

    {
      id: "deletion-requests",
      label: "Deletion Requests",
      icon: <Trash2 size={20} />,
    },

    {
      id: "activities",
      label: "Activity Logs",
      icon: <Activity size={20} />,
    },
  ];

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${!sidebarOpen ? "mobile-hidden" : ""}`}>
        <div className="admin-sidebar-header">
          <img
            src="/logo192.png"
            alt="GBN Logo"
            className="admin-sidebar-logo"
          />
          <div className="admin-sidebar-title">
            <span>GBN</span>
            <span className="admin-sidebar-subtitle">Admin</span>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          {sidebarItems.map((item) => (
            <li key={item.id} className="admin-sidebar-item">
              <button
                className={`admin-sidebar-link ${
                  currentPage === item.id ? "active" : ""
                }`}
                onClick={() => setCurrentPage(item.id)}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </button>
            </li>
          ))}
        </nav>

        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.1)",
            marginTop: "auto",
            paddingTop: "20px",
          }}
        >
          <button
            className="admin-sidebar-link"
            onClick={handleLogout}
            style={{
              color: "rgba(255, 255, 255, 0.7)",
            }}
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="admin-main">
        {/* Top Bar */}
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              className="admin-topbar-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h1 className="admin-topbar-title">
              {pageNames[currentPage] || "Dashboard"}
            </h1>
          </div>

          <div className="admin-topbar-right">
            {sessionWarning && !sessionExpired && (
              <div
                style={{
                  background: "rgba(245, 158, 11, 0.1)",
                  color: "#D97706",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: "600",
                }}
              >
                ⏱️ Session expires in{" "}
                {sessionInfo?.remainingTime
                  ? Math.floor(sessionInfo.remainingTime / 60000)
                  : 0}{" "}
                minutes
              </div>
            )}

            <div className="admin-topbar-user">
              <div className="admin-topbar-avatar">
                {adminInfo?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="admin-topbar-userinfo">
                <div className="admin-topbar-name">{adminInfo?.name}</div>
                <div className="admin-topbar-role">Administrator</div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="admin-content">
          {currentPage === "home" && (
            <div className="admin-page-container">
              <DashboardHome />
            </div>
          )}
          {currentPage === "requests" && (
            <div className="admin-page-container">
              <ApprovalRequests />
            </div>
          )}
          {currentPage === "users" && (
            <div className="admin-page-container">
              <Users />
            </div>
          )}
          {currentPage === "chapters" && (
            <div className="admin-page-container">
              <Chapters />
            </div>
          )}
          {currentPage === "create-member" && (
            <div className="admin-page-container">
              <CreateMember />
            </div>
          )}
          {currentPage === "deletion-requests" && (
            <div className="admin-page-container">
              <DeletionRequests />
            </div>
          )}
          {currentPage === "activities" && (
            <div className="admin-page-container">
              <ActivityLogs />
            </div>
          )}
        </main>
      </div>

      {/* Session Expired Modal */}
      {sessionExpired && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "40px",
              maxWidth: "400px",
              textAlign: "center",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
            }}
          >
            <div
              style={{
                fontSize: "48px",
                marginBottom: "16px",
              }}
            >
              ⏱️
            </div>
            <h2
              style={{
                fontSize: "24px",
                fontWeight: "700",
                marginBottom: "12px",
                color: "#1F2937",
              }}
            >
              Session Expired
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "#6B7280",
                marginBottom: "24px",
                lineHeight: "1.6",
              }}
            >
              Your admin session has expired after 12 hours. Please log in again
              to continue.
            </p>
            <button
              onClick={handleSessionExpiredLogin}
              style={{
                background: "#3B82F6",
                color: "white",
                border: "none",
                padding: "12px 24px",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                width: "100%",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.target.style.background = "#2563EB")}
              onMouseLeave={(e) => (e.target.style.background = "#3B82F6")}
            >
              Login Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
