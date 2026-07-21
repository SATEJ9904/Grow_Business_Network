import React, { useState, useEffect } from "react";
import axios from "axios";
import "./CreateMember.css";
import Cookies from "js-cookie";
import {
  UserPlus,
  Loader,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Sparkles,
  Copy,
} from "lucide-react";

const PASSWORD_CHARS =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";

const generatePassword = (length = 12) => {
  let result = "";

  if (window.crypto?.getRandomValues) {
    const values = new Uint32Array(length);
    window.crypto.getRandomValues(values);
    for (let i = 0; i < length; i++) {
      result += PASSWORD_CHARS[values[i] % PASSWORD_CHARS.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      result += PASSWORD_CHARS[Math.floor(Math.random() * PASSWORD_CHARS.length)];
    }
  }

  return result;
};

const CreateMember = () => {
  const [chapters, setChapters] = useState([]);
  const [chaptersLoading, setChaptersLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [createdMember, setCreatedMember] = useState(null);

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    chapterId: "",
    city: "",
  });

  const token = Cookies.get("adminAccessToken");

  const apiUrl =
    process.env.REACT_APP_API_BASE_URL?.replace(/\/$/, "") ||
    "http://localhost:5001/api";

  useEffect(() => {
    fetchChapters();
  }, []);

  const fetchChapters = async () => {
    try {
      setChaptersLoading(true);
      const response = await axios.get(`${apiUrl}/admin/chapters`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setChapters(response.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load chapters:", err.message);
    } finally {
      setChaptersLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleChapterChange = (e) => {
    const chapterId = e.target.value;
    const chapter = chapters.find((c) => (c._id || c.id) === chapterId);

    setForm((prev) => ({
      ...prev,
      chapterId,
      city: chapter?.city || "",
    }));
  };

  const handleGeneratePassword = () => {
    setForm((prev) => ({
      ...prev,
      password: generatePassword(),
    }));
    setShowPassword(true);
  };

  const validate = () => {
    const username = form.username.trim();
    const email = form.email.trim();

    if (!username && !email) {
      return "Enter a username or an email";
    }
    if (username && username.length < 3) {
      return "Username must be at least 3 characters";
    }
    if (username && !/^[a-zA-Z0-9_. ]+$/.test(username)) {
      return "Username can only contain letters, numbers, spaces, dots and underscores";
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Enter a valid email address";
    }
    if (form.password.length < 6) {
      return "Password must be at least 6 characters";
    }
    if (!form.chapterId) {
      return "Please select a chapter";
    }
    if (!form.city.trim()) {
      return "City is required";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setCreatedMember(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setFormLoading(true);

      const res = await axios.post(
        `${apiUrl}/admin/create-member`,
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      setMessage(res.data.message || "Member account created successfully!");
      setCreatedMember({
        username: form.username.trim() || null,
        email: form.email.trim() || null,
        password: form.password,
      });

      setForm({ username: "", email: "", password: "", chapterId: "", city: "" });
      setShowPassword(false);
    } catch (err) {
      setError(err?.response?.data?.message || "Something went wrong");
    } finally {
      setFormLoading(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdMember) return;

    const lines = [
      createdMember.username && `Username: ${createdMember.username}`,
      createdMember.email && `Email: ${createdMember.email}`,
      `Password: ${createdMember.password}`,
    ].filter(Boolean);

    navigator.clipboard?.writeText(lines.join("\n"));
  };

  return (
    <div className="create-member-container">
      <div className="create-member-hero-banner">
        <div className="hero-content">
          <div className="hero-badge">Member Management</div>
          <h1>Create Member Account</h1>
          <p>
            Set up a login for a new member with just a username, email and
            password. They can complete the rest of their profile later from
            the app.
          </p>
        </div>
      </div>

      <div className="create-member-card">
        {message && (
          <div className="alert-success">
            <CheckCircle size={16} />
            {message}
          </div>
        )}
        {error && (
          <div className="alert-error">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {createdMember && (
          <div className="credentials-box">
            <div className="credentials-header">
              <span>Share these credentials with the member</span>
              <button
                type="button"
                className="btn-copy"
                onClick={handleCopyCredentials}
              >
                <Copy size={14} />
                Copy
              </button>
            </div>
            {createdMember.username && (
              <div className="credentials-row">
                <span className="credentials-label">Username</span>
                <span className="credentials-value">{createdMember.username}</span>
              </div>
            )}
            {createdMember.email && (
              <div className="credentials-row">
                <span className="credentials-label">Email</span>
                <span className="credentials-value">{createdMember.email}</span>
              </div>
            )}
            <div className="credentials-row">
              <span className="credentials-label">Password</span>
              <span className="credentials-value">{createdMember.password}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="create-member-form">
          <p className="form-hint">
            Enter a username, an email, or both — at least one is needed so the
            member can log in.
          </p>

          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              placeholder="e.g., rahul.sharma"
              value={form.username}
              onChange={handleChange}
              autoCapitalize="none"
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="e.g., rahul@example.com"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Password *</label>
            <div className="password-input-row">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter or generate a password"
                value={form.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="btn-icon"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <button
                type="button"
                className="btn-generate"
                onClick={handleGeneratePassword}
              >
                <Sparkles size={14} />
                Auto-generate
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Chapter *</label>
            <select
              name="chapterId"
              value={form.chapterId}
              onChange={handleChapterChange}
              disabled={chaptersLoading}
              required
            >
              <option value="">
                {chaptersLoading ? "Loading chapters..." : "Select chapter"}
              </option>
              {chapters.map((chapter) => (
                <option key={chapter._id || chapter.id} value={chapter._id || chapter.id}>
                  {chapter.name} ({chapter.city})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>City</label>
            <input
              type="text"
              name="city"
              placeholder="Select a chapter to auto-fill the city"
              value={form.city}
              readOnly
              className="input-readonly"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-submit" disabled={formLoading}>
              {formLoading ? (
                <>
                  <Loader size={16} className="spinner" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  Create Member
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMember;
