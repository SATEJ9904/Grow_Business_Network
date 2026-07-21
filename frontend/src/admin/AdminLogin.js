import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import gbnLogo from "../assets/logo.jpeg";

/**
 * AdminLogin
 * Redesigned admin portal login for GBN (Grow Business Networks).
 * All styling is embedded in this file via a single <style> block —
 * no external stylesheet import required.
 */
const AdminLogin = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [stats, setStats] = useState({
    members: 0,
    chapters: 0,
    uptime: "99.9%",
  });

  useEffect(() => {
    const token = Cookies.get("adminAccessToken");
    if (token) {
      onLoginSuccess();
    }
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onLoginSuccess]);

  const fetchStats = async () => {
    try {
      const token = Cookies.get("adminAccessToken");

      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/admin/chapters`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        const chapters = response.data.data || [];
        const totalChapters = chapters.length;
        const totalMembers = chapters.reduce(
          (sum, chapter) =>
            sum + (chapter.totalMemberCount || chapter.activeMembers || 0),
          0
        );

        setStats({
          members: totalMembers,
          chapters: totalChapters,
          uptime: "99.9%",
        });
      }
    } catch (err) {
      console.log("Stats Error:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/admin/login`,
        {
          email: email.trim(),
          password: password.trim(),
        }
      );

      if (response.data.success) {
        const { data } = response.data;

        Cookies.set("adminAccessToken", data.accessToken, { expires: 1 });
        Cookies.set("adminSessionId", data.sessionId, { expires: 1 });
        Cookies.set("adminInfo", JSON.stringify(data.admin), { expires: 1 });

        onLoginSuccess();
      } else {
        setError(response.data.message || "Login failed");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to login. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatCount = (n) => {
    if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
    return `${n}`;
  };

  const ledgerStats = [
    { label: "Verified members", value: formatCount(stats.members) },
    { label: "Active chapters", value: formatCount(stats.chapters) },
    { label: "Platform uptime", value: stats.uptime },
  ];

  const capabilities = [
    {
      mark: "◆",
      title: "Membership oversight",
      desc: "Approve, review and manage every registered member in real time.",
    },
    {
      mark: "◆",
      title: "Chapter intelligence",
      desc: "Track growth and health across every chapter, city by city.",
    },
    {
      mark: "◆",
      title: "Ledger-grade security",
      desc: "Session-bound access with encrypted credential handling.",
    },
  ];

  return (
    <div className="gbn-login-scope">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');

        .gbn-login-scope {
          --ink-900: #0a1628;
          --ink-800: #101f38;
          --ink-700: #132b4d;
          --ink-600: #1c3a63;
          --brass: #c6a15b;
          --brass-soft: #e3c98a;
          --ivory: #fbf9f4;
          --ivory-dim: #f1ede2;
          --slate: #48546b;
          --slate-soft: #8792a6;
          --emerald: #2f6f5e;
          --danger: #b3432b;
          --radius-lg: 18px;
          --radius-md: 12px;
          --radius-sm: 8px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .gbn-login-scope * {
          box-sizing: border-box;
        }

        .gbn-shell {
          min-height: 100vh;
          width: 100%;
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
          background: var(--ivory);
        }

        /* ---------------- LEFT PANEL ---------------- */

        .gbn-panel {
          position: relative;
          background: radial-gradient(120% 140% at 15% 10%, var(--ink-700) 0%, var(--ink-900) 62%);
          color: var(--ivory);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 56px 64px;
        }

        .gbn-network-field {
          position: absolute;
          inset: 0;
          opacity: 0.55;
          pointer-events: none;
        }

        .gbn-node {
          fill: var(--brass-soft);
          opacity: 0;
          animation: gbn-node-in 900ms ease-out forwards;
        }

        .gbn-edge {
          stroke: var(--brass);
          stroke-width: 1;
          opacity: 0;
          stroke-dasharray: 6 4;
          animation: gbn-edge-in 1200ms ease-out forwards;
        }

        .gbn-pulse {
          fill: none;
          stroke: var(--brass-soft);
          stroke-width: 1.4;
          opacity: 0;
          transform-origin: center;
          animation: gbn-pulse-ring 3600ms ease-out infinite;
        }

        @keyframes gbn-node-in {
          from { opacity: 0; transform: scale(0.3); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes gbn-edge-in {
          from { opacity: 0; }
          to { opacity: 0.5; }
        }
        @keyframes gbn-pulse-ring {
          0% { opacity: 0.55; r: 3; }
          70% { opacity: 0; r: 22; }
          100% { opacity: 0; r: 22; }
        }

        .gbn-panel-top {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .gbn-mark {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid rgba(198, 161, 91, 0.5);
          background: var(--ink-800);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .gbn-mark img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .gbn-wordmark {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 15px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--brass-soft);
        }

        .gbn-panel-mid {
          position: relative;
          z-index: 2;
          max-width: 460px;
        }

        .gbn-eyebrow {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--brass);
          margin-bottom: 18px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .gbn-eyebrow::before {
          content: "";
          width: 24px;
          height: 1px;
          background: var(--brass);
        }

        .gbn-headline {
          font-family: 'Fraunces', Georgia, serif;
          font-weight: 500;
          font-size: 46px;
          line-height: 1.12;
          letter-spacing: -0.01em;
          margin: 0 0 20px 0;
        }

        .gbn-headline em {
          font-style: italic;
          color: var(--brass-soft);
        }

        .gbn-sub {
          font-size: 15.5px;
          line-height: 1.65;
          color: rgba(251, 249, 244, 0.68);
          margin: 0 0 40px 0;
          max-width: 400px;
        }

        .gbn-capabilities {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .gbn-capability {
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }

        .gbn-cap-mark {
          font-size: 10px;
          color: var(--brass);
          margin-top: 6px;
          flex-shrink: 0;
        }

        .gbn-cap-title {
          font-size: 14.5px;
          font-weight: 600;
          color: var(--ivory);
          margin: 0 0 3px 0;
        }

        .gbn-cap-desc {
          font-size: 13.5px;
          line-height: 1.55;
          color: rgba(251, 249, 244, 0.55);
          margin: 0;
        }

        .gbn-panel-bottom {
          position: relative;
          z-index: 2;
          display: flex;
          gap: 0;
          border-top: 1px solid rgba(198, 161, 91, 0.22);
          padding-top: 26px;
        }

        .gbn-stat {
          flex: 1;
          padding-right: 20px;
        }

        .gbn-stat + .gbn-stat {
          border-left: 1px solid rgba(198, 161, 91, 0.22);
          padding-left: 20px;
        }

        .gbn-stat-value {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 22px;
          color: var(--brass-soft);
          letter-spacing: -0.02em;
        }

        .gbn-stat-label {
          font-size: 11.5px;
          color: rgba(251, 249, 244, 0.5);
          margin-top: 4px;
        }

        /* ---------------- RIGHT PANEL ---------------- */

        .gbn-form-side {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          background:
            radial-gradient(60% 50% at 100% 0%, rgba(198, 161, 91, 0.08), transparent 60%),
            var(--ivory);
        }

        .gbn-card {
          width: 100%;
          max-width: 400px;
        }

        .gbn-card-header {
          margin-bottom: 34px;
        }

        .gbn-card-eyebrow {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--brass);
          margin-bottom: 10px;
        }

        .gbn-card-title {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 30px;
          font-weight: 500;
          color: var(--ink-900);
          margin: 0 0 8px 0;
        }

        .gbn-card-desc {
          font-size: 14px;
          color: var(--slate);
          margin: 0;
        }

        .gbn-field {
          margin-bottom: 20px;
        }

        .gbn-label {
          display: block;
          font-size: 12.5px;
          font-weight: 600;
          color: var(--ink-800);
          margin-bottom: 8px;
          letter-spacing: 0.01em;
        }

        .gbn-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
          border: 1.5px solid #e3ddcd;
          border-radius: var(--radius-sm);
          background: #ffffff;
          transition: border-color 160ms ease, box-shadow 160ms ease;
        }

        .gbn-input-wrap:focus-within {
          border-color: var(--brass);
          box-shadow: 0 0 0 3px rgba(198, 161, 91, 0.16);
        }

        .gbn-input-icon {
          width: 42px;
          text-align: center;
          color: var(--slate-soft);
          font-size: 15px;
          flex-shrink: 0;
        }

        .gbn-input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          padding: 13px 14px 13px 0;
          font-size: 14.5px;
          color: var(--ink-900);
          font-family: 'Inter', sans-serif;
        }

        .gbn-input::placeholder {
          color: #b9b2a0;
        }

        .gbn-input:disabled {
          opacity: 0.6;
        }

        .gbn-toggle-visibility {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0 14px;
          font-size: 13px;
          color: var(--slate);
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          flex-shrink: 0;
        }

        .gbn-toggle-visibility:hover {
          color: var(--ink-900);
        }

        .gbn-error {
          background: #fbeae5;
          border: 1px solid rgba(179, 67, 43, 0.3);
          color: var(--danger);
          font-size: 13px;
          padding: 11px 14px;
          border-radius: var(--radius-sm);
          margin-bottom: 18px;
        }

        .gbn-footer-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 26px;
        }

        .gbn-remember {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13.5px;
          color: var(--slate);
          cursor: pointer;
        }

        .gbn-remember input {
          width: 15px;
          height: 15px;
          accent-color: var(--brass);
          cursor: pointer;
        }

        .gbn-forgot {
          font-size: 13.5px;
          color: var(--ink-700);
          text-decoration: none;
          font-weight: 600;
          border-bottom: 1px solid transparent;
        }

        .gbn-forgot:hover {
          border-bottom-color: var(--brass);
        }

        .gbn-submit {
          width: 100%;
          background: var(--ink-900);
          color: var(--brass-soft);
          border: none;
          border-radius: var(--radius-sm);
          padding: 14px 16px;
          font-size: 14.5px;
          font-weight: 600;
          letter-spacing: 0.02em;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: background 160ms ease, transform 160ms ease;
        }

        .gbn-submit:hover:not(:disabled) {
          background: var(--ink-700);
          transform: translateY(-1px);
        }

        .gbn-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .gbn-spinner {
          width: 15px;
          height: 15px;
          border-radius: 50%;
          border: 2px solid rgba(227, 201, 138, 0.35);
          border-top-color: var(--brass-soft);
          animation: gbn-spin 700ms linear infinite;
        }

        @keyframes gbn-spin {
          to { transform: rotate(360deg); }
        }

        .gbn-badges {
          display: flex;
          gap: 10px;
          margin-top: 22px;
        }

        .gbn-badge {
          flex: 1;
          text-align: center;
          font-size: 11.5px;
          font-weight: 600;
          color: var(--emerald);
          background: rgba(47, 111, 94, 0.08);
          border: 1px solid rgba(47, 111, 94, 0.18);
          border-radius: var(--radius-sm);
          padding: 9px 6px;
        }

        .gbn-copyright {
          text-align: center;
          font-size: 12px;
          color: var(--slate-soft);
          margin-top: 30px;
        }

        /* ---------------- RESPONSIVE ---------------- */

        @media (max-width: 980px) {
          .gbn-shell {
            grid-template-columns: 1fr;
          }
          .gbn-panel {
            display: none;
          }
          .gbn-form-side {
            padding: 24px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .gbn-node, .gbn-edge, .gbn-pulse {
            animation: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>

      <div className="gbn-shell">
        {/* Left branding / network panel */}
        <div className="gbn-panel">
          <svg
            className="gbn-network-field"
            viewBox="0 0 560 760"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
          >
            <line className="gbn-edge" x1="70" y1="120" x2="210" y2="60" style={{ animationDelay: "120ms" }} />
            <line className="gbn-edge" x1="210" y1="60" x2="360" y2="140" style={{ animationDelay: "260ms" }} />
            <line className="gbn-edge" x1="360" y1="140" x2="500" y2="90" style={{ animationDelay: "400ms" }} />
            <line className="gbn-edge" x1="70" y1="120" x2="150" y2="260" style={{ animationDelay: "180ms" }} />
            <line className="gbn-edge" x1="150" y1="260" x2="360" y2="140" style={{ animationDelay: "340ms" }} />
            <line className="gbn-edge" x1="150" y1="260" x2="90" y2="420" style={{ animationDelay: "460ms" }} />
            <line className="gbn-edge" x1="150" y1="260" x2="330" y2="360" style={{ animationDelay: "520ms" }} />
            <line className="gbn-edge" x1="330" y1="360" x2="500" y2="300" style={{ animationDelay: "600ms" }} />
            <line className="gbn-edge" x1="330" y1="360" x2="280" y2="520" style={{ animationDelay: "680ms" }} />
            <line className="gbn-edge" x1="90" y1="420" x2="150" y2="580" style={{ animationDelay: "740ms" }} />
            <line className="gbn-edge" x1="280" y1="520" x2="150" y2="580" style={{ animationDelay: "800ms" }} />
            <line className="gbn-edge" x1="280" y1="520" x2="420" y2="600" style={{ animationDelay: "860ms" }} />
            <line className="gbn-edge" x1="150" y1="580" x2="220" y2="700" style={{ animationDelay: "940ms" }} />

            {[
              [70, 120], [210, 60], [360, 140], [500, 90],
              [150, 260], [90, 420], [330, 360], [500, 300],
              [280, 520], [150, 580], [420, 600], [220, 700],
            ].map(([cx, cy], i) => (
              <g key={i}>
                <circle className="gbn-node" cx={cx} cy={cy} r="3.4" style={{ animationDelay: `${i * 90}ms` }} />
                <circle className="gbn-pulse" cx={cx} cy={cy} r="3" style={{ animationDelay: `${1000 + i * 260}ms` }} />
              </g>
            ))}
          </svg>

          <div className="gbn-panel-top">
            <div className="gbn-mark">
              <img src={gbnLogo} alt="GBN" />
            </div>
            <span className="gbn-wordmark">Grow Business Networks</span>
          </div>

          <div className="gbn-panel-mid">
            <div className="gbn-eyebrow">Admin Console</div>
            <h1 className="gbn-headline">
              Every chapter,
              <br />
              every member, <em>one ledger.</em>
            </h1>
            <p className="gbn-sub">
              Sign in to oversee the network you've built — membership,
              chapters and performance, all in one place of record.
            </p>

            <div className="gbn-capabilities">
              {capabilities.map((c, i) => (
                <div className="gbn-capability" key={i}>
                  <span className="gbn-cap-mark">{c.mark}</span>
                  <div>
                    <p className="gbn-cap-title">{c.title}</p>
                    <p className="gbn-cap-desc">{c.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="gbn-panel-bottom">
            {ledgerStats.map((s, i) => (
              <div className="gbn-stat" key={i}>
                <div className="gbn-stat-value">{s.value}</div>
                <div className="gbn-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right login form */}
        <div className="gbn-form-side">
          <div className="gbn-card">
            <div className="gbn-card-header">
              <div className="gbn-card-eyebrow">Secure Access</div>
              <h2 className="gbn-card-title">Welcome back</h2>
              <p className="gbn-card-desc">
                Enter your administrator credentials to continue.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="gbn-field">
                <label className="gbn-label" htmlFor="gbn-email">
                  Email address
                </label>
                <div className="gbn-input-wrap">
                  <span className="gbn-input-icon">✉</span>
                  <input
                    id="gbn-email"
                    type="email"
                    className="gbn-input"
                    placeholder="admin@gbn.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="gbn-field">
                <label className="gbn-label" htmlFor="gbn-password">
                  Password
                </label>
                <div className="gbn-input-wrap">
                  <span className="gbn-input-icon">🔒</span>
                  <input
                    id="gbn-password"
                    type={showPassword ? "text" : "password"}
                    className="gbn-input"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="gbn-toggle-visibility"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {error && <div className="gbn-error" role="alert">{error}</div>}

              <div className="gbn-footer-row">
                <label className="gbn-remember">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
                <a href="/forgot-password" className="gbn-forgot">
                  Forgot password?
                </a>
              </div>

              <button type="submit" className="gbn-submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="gbn-spinner" />
                    Signing in…
                  </>
                ) : (
                  <>Sign in to console →</>
                )}
              </button>

              <div className="gbn-badges">
                <div className="gbn-badge">🔒 Encrypted session</div>
                <div className="gbn-badge">⚡ Real-time access</div>
              </div>
            </form>

            <div className="gbn-copyright">
              © {new Date().getFullYear()} Grow Business Networks. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;