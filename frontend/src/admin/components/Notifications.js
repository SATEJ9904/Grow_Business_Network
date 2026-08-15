import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import {
  Plus,
  Loader,
  AlertCircle,
  Bell,
  Clock,
  Send,
  Users,
  Link2,
  Ban,
} from "lucide-react";
import "./Notifications.css";

const apiUrl =
  process.env.REACT_APP_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:5001/api";

const ALL_CITIES = "ALL";

const emptyForm = {
  subject: "",
  message: "",
  city: ALL_CITIES,
  chapterIds: [],
  buttonLabel: "",
  buttonLink: "",
  scheduledAt: "",
};

const Notifications = () => {
  const token = Cookies.get("adminAccessToken");

  const [notifications, setNotifications] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    fetchNotifications();
    fetchChapters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiUrl}/notifications/admin/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data.data || []);
    } catch (err) {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchChapters = async () => {
    try {
      const res = await axios.get(`${apiUrl}/admin/chapters`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChapters(res.data.data || []);
    } catch (err) {
      setChapters([]);
    }
  };

  const cities = [...new Set(chapters.map((c) => c.city).filter(Boolean))].sort();
  const chaptersForCity = chapters.filter((c) => c.city === form.city);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCityChange = (e) => {
    const city = e.target.value;
    if (city === ALL_CITIES) {
      setForm((prev) => ({ ...prev, city, chapterIds: [] }));
    } else {
      const ids = chapters.filter((c) => c.city === city).map((c) => c._id);
      setForm((prev) => ({ ...prev, city, chapterIds: ids }));
    }
  };

  const toggleChapter = (id) => {
    setForm((prev) => ({
      ...prev,
      chapterIds: prev.chapterIds.includes(id)
        ? prev.chapterIds.filter((x) => x !== id)
        : [...prev.chapterIds, id],
    }));
  };

  const selectAllChaptersInCity = () => {
    setForm((prev) => ({ ...prev, chapterIds: chaptersForCity.map((c) => c._id) }));
  };

  const clearAllChaptersInCity = () => {
    setForm((prev) => ({ ...prev, chapterIds: [] }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (form.city !== ALL_CITIES && form.chapterIds.length === 0) {
      setError("Select at least one chapter, or choose All Cities to reach everyone.");
      return;
    }

    try {
      setFormLoading(true);

      const payload = {
        subject: form.subject,
        message: form.message,
        city: form.city === ALL_CITIES ? "" : form.city,
        chapterIds: form.city === ALL_CITIES ? [] : form.chapterIds,
        buttonLabel: form.buttonLabel,
        buttonLink: form.buttonLink,
        scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : undefined,
      };

      const res = await axios.post(`${apiUrl}/notifications`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      setMessage(res.data.message || "Notification saved!");
      resetForm();
      fetchNotifications();
    } catch (err) {
      setError(err?.response?.data?.message || "Something went wrong");
    } finally {
      setFormLoading(false);
    }
  };

  const handleCancel = async (notification) => {
    setCancellingId(notification._id);
    try {
      await axios.post(
        `${apiUrl}/notifications/${notification._id}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchNotifications();
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to cancel notification");
    } finally {
      setCancellingId(null);
    }
  };

  const sentCount = notifications.filter((n) => n.status === "sent").length;
  const scheduledCount = notifications.filter((n) => n.status === "scheduled").length;

  const targetLabel = (n) => {
    if (n.isAllChapters) return "All Chapters — All Cities";
    const names = n.chapterNames || [];
    if (names.length === 0) return "—";
    if (names.length === 1) return `${names[0]} (${n.city})`;
    return `${names.length} chapters in ${n.city}`;
  };

  const statusBadgeClass = (status) =>
    status === "sent" ? "badge-sent" : status === "scheduled" ? "badge-scheduled" : "badge-cancelled";

  return (
    <div className="notifications-container">
      {/* Hero Banner */}
      <div className="notifications-hero-banner">
        <div className="hero-content">
          <div className="hero-badge">Notification Center</div>
          <h1>Compose &amp; Schedule Announcements</h1>
          <p>
            Send in-app announcements to any city, chapter, or the whole network — instantly or
            scheduled for later.
          </p>
        </div>
        <div className="hero-stats-grid">
          <div className="hero-stat">
            <div className="stat-icon notifications-total">
              <Bell size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Total Sent</span>
              <strong className="stat-value">{sentCount}</strong>
            </div>
          </div>
          <div className="hero-stat">
            <div className="stat-icon notifications-scheduled">
              <Clock size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Scheduled</span>
              <strong className="stat-value">{scheduledCount}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="notifications-header">
        <div className="header-content">
          <h2>All Notifications</h2>
          <p className="header-subtitle">View send history and manage scheduled announcements</p>
        </div>
        <button className="btn-create-notification" onClick={() => setShowForm(!showForm)}>
          <Plus size={18} />
          New Notification
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="notification-form-card">
          <h3>Compose Notification</h3>
          {message && <div className="alert-success">{message}</div>}
          {error && <div className="alert-error">{error}</div>}

          <form onSubmit={handleSubmit} className="notification-form">
            <div className="form-group">
              <label>Subject *</label>
              <input
                type="text"
                name="subject"
                placeholder="e.g., New Member Benefits Announced"
                value={form.subject}
                onChange={handleChange}
                maxLength={150}
                required
              />
            </div>

            <div className="form-group">
              <label>Message *</label>
              <textarea
                name="message"
                placeholder="Write the announcement message members will see..."
                value={form.message}
                onChange={handleChange}
                rows="4"
                maxLength={2000}
                required
              />
            </div>

            <div className="form-group">
              <label>Target City *</label>
              <select name="city" value={form.city} onChange={handleCityChange}>
                <option value={ALL_CITIES}>All Cities (every chapter)</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            {form.city !== ALL_CITIES && (
              <div className="form-group">
                <div className="chapter-select-header">
                  <label>
                    <Users size={14} /> Target Chapters in {form.city} *
                  </label>
                  <div className="chapter-select-actions">
                    <button type="button" onClick={selectAllChaptersInCity}>
                      Select All
                    </button>
                    <span>·</span>
                    <button type="button" onClick={clearAllChaptersInCity}>
                      Clear
                    </button>
                  </div>
                </div>
                <div className="chapter-checkbox-list">
                  {chaptersForCity.length === 0 ? (
                    <p className="chapter-empty">No chapters found in this city.</p>
                  ) : (
                    chaptersForCity.map((c) => (
                      <label key={c._id} className="chapter-checkbox">
                        <input
                          type="checkbox"
                          checked={form.chapterIds.includes(c._id)}
                          onChange={() => toggleChapter(c._id)}
                        />
                        {c.name}
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label>Button Label</label>
                <input
                  type="text"
                  name="buttonLabel"
                  placeholder="e.g., View Details"
                  value={form.buttonLabel}
                  onChange={handleChange}
                  maxLength={40}
                />
              </div>
              <div className="form-group">
                <label>
                  <Link2 size={14} /> Button Link
                </label>
                <input
                  type="text"
                  name="buttonLink"
                  placeholder="https://..."
                  value={form.buttonLink}
                  onChange={handleChange}
                  maxLength={500}
                />
              </div>
            </div>

            <div className="form-group">
              <label>
                <Clock size={14} /> Schedule For (optional)
              </label>
              <input
                type="datetime-local"
                name="scheduledAt"
                value={form.scheduledAt}
                onChange={handleChange}
              />
              <span className="field-hint">Leave blank to send immediately.</span>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-submit" disabled={formLoading}>
                {formLoading ? (
                  <>
                    <Loader size={16} className="spinner" />
                    Saving...
                  </>
                ) : form.scheduledAt ? (
                  <>
                    <Clock size={16} />
                    Schedule Notification
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Send Now
                  </>
                )}
              </button>
              <button type="button" className="btn-cancel" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Notifications List */}
      {loading ? (
        <div className="loading-container">
          <Loader size={40} className="spinner" />
          <p>Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="empty-container">
          <AlertCircle size={48} />
          <h3>No notifications yet</h3>
          <p>Click 'New Notification' to send your first announcement.</p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map((n) => (
            <div key={n._id} className="notification-row">
              <div className="notification-row-main">
                <div className="notification-row-top">
                  <h4>{n.subject}</h4>
                  <span className={`status-badge ${statusBadgeClass(n.status)}`}>{n.status}</span>
                </div>
                <p className="notification-row-message">{n.message}</p>
                <div className="notification-row-meta">
                  <span>
                    <Users size={13} /> {targetLabel(n)}
                  </span>
                  <span>
                    <Clock size={13} />{" "}
                    {n.status === "sent"
                      ? `Sent ${new Date(n.sentAt).toLocaleString("en-IN")}`
                      : n.status === "scheduled"
                      ? `Scheduled for ${new Date(n.scheduledAt).toLocaleString("en-IN")}`
                      : "Cancelled"}
                  </span>
                  {n.buttonLabel ? (
                    <span>
                      <Link2 size={13} /> {n.buttonLabel}
                    </span>
                  ) : null}
                </div>
              </div>

              {n.status === "scheduled" && (
                <button
                  className="btn-cancel-notification"
                  onClick={() => handleCancel(n)}
                  disabled={cancellingId === n._id}
                >
                  {cancellingId === n._id ? <Loader size={14} className="spinner" /> : <Ban size={14} />}
                  Cancel
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
