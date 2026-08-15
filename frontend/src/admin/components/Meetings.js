import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { io } from "socket.io-client";
import {
  Plus,
  Loader,
  AlertCircle,
  MapPin,
  Calendar,
  Clock,
  Users,
  IndianRupee,
  Image as ImageIcon,
  X,
} from "lucide-react";
import MeetingCountdown from "./MeetingCountdown";
import "./Meetings.css";

const apiUrl =
  process.env.REACT_APP_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:5001/api";
const originUrl = apiUrl.replace(/\/api\/?$/, "");

const getFlyerUrl = (flyerPath) => {
  if (!flyerPath) return null;
  if (flyerPath.startsWith("http")) return flyerPath;
  return `${originUrl}/${flyerPath.replace(/\\/g, "/")}`;
};

const emptyForm = {
  name: "",
  description: "",
  meetingDate: "",
  meetingTime: "",
  venue: "",
  city: "",
  chapterId: "",
  fee: "",
  gstPercent: "",
};

const Meetings = () => {
  const token = Cookies.get("adminAccessToken");

  const [meetings, setMeetings] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [flyerFile, setFlyerFile] = useState(null);
  const [flyerPreview, setFlyerPreview] = useState(null);

  const [bookingsMeeting, setBookingsMeeting] = useState(null);
  const [bookingsData, setBookingsData] = useState(null);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  const socketRef = useRef(null);
  const bookingsMeetingRef = useRef(null);

  useEffect(() => {
    bookingsMeetingRef.current = bookingsMeeting;
  }, [bookingsMeeting]);

  useEffect(() => {
    fetchMeetings();
    fetchChapters();
  }, []);

  useEffect(() => {
    if (!token) return undefined;

    const socket = io(originUrl, { auth: { token } });
    socketRef.current = socket;

    socket.on("meeting:booking", (payload) => {
      setMeetings((prev) =>
        prev.map((m) =>
          m._id === payload.meetingId
            ? { ...m, bookingCount: payload.bookingCount, subtotal: payload.subtotal }
            : m
        )
      );

      setBookingsData((prev) => {
        const activeMeeting = bookingsMeetingRef.current;
        if (!activeMeeting || activeMeeting._id !== payload.meetingId || !prev) {
          return prev;
        }
        return {
          subtotal: payload.subtotal,
          bookings: [payload.booking, ...prev.bookings],
        };
      });
    });

    return () => socket.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiUrl}/meetings/admin/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMeetings(res.data.data || []);
    } catch (err) {
      setMeetings([]);
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
    if (name === "city") {
      setForm((prev) => ({ ...prev, city: value, chapterId: "" }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFlyerChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFlyerFile(file);
    setFlyerPreview(URL.createObjectURL(file));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setFlyerFile(null);
    setFlyerPreview(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!flyerFile) {
      setError("Please upload a meeting flyer");
      return;
    }
    if (!form.chapterId) {
      setError("Please select a chapter");
      return;
    }

    try {
      setFormLoading(true);

      const payload = new FormData();
      payload.append("name", form.name);
      payload.append("description", form.description);
      payload.append("meetingDate", form.meetingDate);
      payload.append("meetingTime", form.meetingTime);
      payload.append("venue", form.venue);
      payload.append("chapterId", form.chapterId);
      payload.append("fee", form.fee);
      payload.append("gstPercent", form.gstPercent || 0);
      payload.append("flyerImage", flyerFile);

      const res = await axios.post(`${apiUrl}/meetings`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage(res.data.message || "Meeting created successfully!");
      resetForm();
      fetchMeetings();
    } catch (err) {
      setError(err?.response?.data?.message || "Something went wrong");
    } finally {
      setFormLoading(false);
    }
  };

  const openBookings = async (meeting) => {
    setBookingsMeeting(meeting);
    setBookingsData(null);
    setBookingsLoading(true);
    try {
      const res = await axios.get(`${apiUrl}/meetings/${meeting._id}/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookingsData(res.data.data);
    } catch (err) {
      setBookingsData({ bookings: [], subtotal: 0 });
    } finally {
      setBookingsLoading(false);
    }
  };

  const closeBookings = () => {
    setBookingsMeeting(null);
    setBookingsData(null);
  };

  const totalCollected = meetings.reduce((sum, m) => sum + (m.subtotal || 0), 0);
  const upcomingCount = meetings.filter(
    (m) => new Date(m.meetingDateTime).getTime() > Date.now()
  ).length;

  return (
    <div className="meetings-container">
      {/* Hero Banner */}
      <div className="meetings-hero-banner">
        <div className="hero-content">
          <div className="hero-badge">Meeting Management</div>
          <h1>Schedule &amp; Track Chapter Meetings</h1>
          <p>
            Create meetings, notify chapter members instantly, and track seat
            bookings in real time.
          </p>
        </div>
        <div className="hero-stats-grid">
          <div className="hero-stat">
            <div className="stat-icon meetings-count">
              <Calendar size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Total Meetings</span>
              <strong className="stat-value">{meetings.length}</strong>
            </div>
          </div>
          <div className="hero-stat">
            <div className="stat-icon upcoming-count">
              <Clock size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Upcoming</span>
              <strong className="stat-value">{upcomingCount}</strong>
            </div>
          </div>
          <div className="hero-stat">
            <div className="stat-icon collected-count">
              <IndianRupee size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Total Collected</span>
              <strong className="stat-value">₹{totalCollected.toLocaleString("en-IN")}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="meetings-header">
        <div className="header-content">
          <h2>All Meetings</h2>
          <p className="header-subtitle">View and manage all scheduled meetings</p>
        </div>
        <button className="btn-create-meeting" onClick={() => setShowForm(!showForm)}>
          <Plus size={18} />
          New Meeting
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="meeting-form-card">
          <h3>Create New Meeting</h3>
          {message && <div className="alert-success">{message}</div>}
          {error && <div className="alert-error">{error}</div>}

          <form onSubmit={handleSubmit} className="meeting-form">
            <div className="form-group">
              <label>Meeting Name *</label>
              <input
                type="text"
                name="name"
                placeholder="e.g., Quarterly Networking Meet"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Meeting Flyer *</label>
              <label className="flyer-upload-box">
                {flyerPreview ? (
                  <img src={flyerPreview} alt="Flyer preview" className="flyer-preview" />
                ) : (
                  <div className="flyer-placeholder">
                    <ImageIcon size={28} />
                    <span>Click to upload flyer image</span>
                  </div>
                )}
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFlyerChange} hidden />
              </label>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                placeholder="Optional meeting agenda or details..."
                value={form.description}
                onChange={handleChange}
                rows="3"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Date *</label>
                <input type="date" name="meetingDate" value={form.meetingDate} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Time *</label>
                <input type="time" name="meetingTime" value={form.meetingTime} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-group">
              <label>Venue *</label>
              <input
                type="text"
                name="venue"
                placeholder="e.g., Hotel Grand Ballroom, MG Road"
                value={form.venue}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>City *</label>
                <select name="city" value={form.city} onChange={handleChange} required>
                  <option value="">Select city</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Chapter *</label>
                <select
                  name="chapterId"
                  value={form.chapterId}
                  onChange={handleChange}
                  disabled={!form.city}
                  required
                >
                  <option value="">{form.city ? "Select chapter" : "Select a city first"}</option>
                  {chaptersForCity.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Meeting Fee (₹) *</label>
                <input
                  type="number"
                  name="fee"
                  min="0"
                  placeholder="e.g., 500"
                  value={form.fee}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Set GST %</label>
                <input
                  type="number"
                  name="gstPercent"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="e.g., 18"
                  value={form.gstPercent}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-submit" disabled={formLoading}>
                {formLoading ? (
                  <>
                    <Loader size={16} className="spinner" />
                    Creating...
                  </>
                ) : (
                  "Create Meeting"
                )}
              </button>
              <button type="button" className="btn-cancel" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Meetings Grid */}
      {loading ? (
        <div className="loading-container">
          <Loader size={40} className="spinner" />
          <p>Loading meetings...</p>
        </div>
      ) : meetings.length === 0 ? (
        <div className="empty-container">
          <AlertCircle size={48} />
          <h3>No meetings scheduled</h3>
          <p>Click 'New Meeting' to schedule your first chapter meeting.</p>
        </div>
      ) : (
        <div className="meetings-grid">
          {meetings.map((meeting) => (
            <div key={meeting._id} className="meeting-card premium">
              <div className="meeting-flyer-wrap">
                <img src={getFlyerUrl(meeting.flyerImage)} alt={meeting.name} className="meeting-flyer" />
                <div className="meeting-flyer-overlay">
                  <h3>{meeting.name}</h3>
                  <span className="meeting-chapter-badge">
                    {meeting.chapterName} &middot; {meeting.city}
                  </span>
                </div>
              </div>

              <div className="card-content">
                <div className="info-item">
                  <Calendar size={16} className="icon-pin" />
                  <span>
                    {new Date(meeting.meetingDateTime).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    &middot; {meeting.meetingTime}
                  </span>
                </div>
                <div className="info-item">
                  <MapPin size={16} className="icon-pin" />
                  <span>{meeting.venue}</span>
                </div>
                <div className="info-item">
                  <IndianRupee size={16} className="icon-pin" />
                  <span>
                    ₹{meeting.fee} per seat
                    {meeting.gstPercent > 0 ? ` + GST (${meeting.gstPercent}%)` : ""}
                  </span>
                </div>

                <MeetingCountdown targetDateTime={meeting.meetingDateTime} />
              </div>

              <div className="card-footer">
                <button className="btn-booked-seats" onClick={() => openBookings(meeting)}>
                  <Users size={16} />
                  Booked Seats ({meeting.bookingCount || 0})
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booked Seats Modal */}
      {bookingsMeeting && (
        <div className="modal-overlay" onClick={closeBookings}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Booked Seats — {bookingsMeeting.name}</h2>
              <button onClick={closeBookings} className="modal-close">
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {bookingsLoading ? (
                <div className="loading-container small">
                  <Loader size={28} className="spinner" />
                  <p>Loading bookings...</p>
                </div>
              ) : bookingsData?.bookings?.length ? (
                <div className="bookings-table-wrap">
                  <table className="bookings-table">
                    <thead>
                      <tr>
                        <th>Member Name</th>
                        <th>City</th>
                        <th>Chapter</th>
                        <th>Transaction ID</th>
                        <th>Amount Paid</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookingsData.bookings.map((row) => (
                        <tr key={row.bookingId}>
                          <td>{row.memberName}</td>
                          <td>{row.city}</td>
                          <td>{row.chapterName}</td>
                          <td className="mono">{row.transactionId}</td>
                          <td>₹{row.amountPaid.toLocaleString("en-IN")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-container small">
                  <AlertCircle size={32} />
                  <p>No seats booked yet.</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <span>Subtotal Amount Received</span>
              <strong>₹{(bookingsData?.subtotal || 0).toLocaleString("en-IN")}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Meetings;
