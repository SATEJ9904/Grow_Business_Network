import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Chapters.css";
import Cookies from "js-cookie";
import {
  Plus,
  Loader,
  AlertCircle,
  MapPin,
  FileText,
  Users,
  Zap,
  Edit2,
  Trash2,
  X,
} from "lucide-react";

const Chapters = () => {
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [finalModal, setFinalModal] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [deleteOption, setDeleteOption] = useState("migrate");
  const [selectedTargetChapter, setSelectedTargetChapter] = useState("");

  const [form, setForm] = useState({
    name: "",
    city: "",
    description: "",
  });

  const token = Cookies.get("adminAccessToken");

  useEffect(() => {
    fetchChapters();
  }, []);

  const apiUrl =
    process.env.REACT_APP_API_BASE_URL?.replace(/\/$/, "") ||
    "http://localhost:5001/api";

  const fetchChapters = async () => {
    try {
      setLoading(true);

      console.log("🔵 Token:", token);
      console.log("🔵 API URL:", `${apiUrl}/admin/chapters`);

      const response = await axios.get(`${apiUrl}/admin/chapters`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("🟢 FULL RESPONSE:", response);
      console.log("🟢 RESPONSE DATA:", response.data);

      if (response.data.success) {
        console.log("✅ Chapters:", response.data.data);
        response.data.data?.forEach((ch) => {
          console.log(
            `📊 Chapter: ${ch.name} | City: ${ch.city} | Active Members: ${ch.activeMembers} | Total: ${ch.totalMemberCount}`,
          );
        });
        setChapters(response.data.data || []);
      } else {
        console.log("⚠️ API success false:", response.data);
        setChapters([]);
      }
    } catch (err) {
      console.error("❌ ERROR OBJECT:", err);
      console.error("❌ ERROR RESPONSE:", err.response);
      console.error("❌ ERROR MESSAGE:", err.message);

      setChapters([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const validate = () => {
    if (form.name.length < 2 || form.name.length > 50) {
      return "Name must be 2-50 characters";
    }
    if (form.city.length < 2 || form.city.length > 50) {
      return "City must be 2-50 characters";
    }
    if (form.description.length > 500) {
      return "Description max 500 characters";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setFormLoading(true);

      if (editingId) {
        const res = await axios.put(
          `${apiUrl}/admin/chapter/${editingId}`,
          form,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        setMessage(res.data.message || "Chapter updated successfully!");
      } else {
        // Create new chapter
        const res = await axios.post(`${apiUrl}/admin/chapter`, form, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        setMessage(res.data.message || "Chapter created successfully!");
      }

      setForm({ name: "", city: "", description: "" });
      setShowForm(false);
      setEditingId(null);
      fetchChapters();
    } catch (err) {
      setError(err?.response?.data?.message || "Something went wrong");
    } finally {
      setFormLoading(false);
    }
  };

  const filteredChapters = chapters.filter(
    (chapter) =>
      chapter.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chapter.city?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleEdit = (chapter) => {
    setForm({
      name: chapter.name,
      city: chapter.city,
      description: chapter.description || "",
    });
    setEditingId(chapter._id || chapter.id);
    setShowForm(true);
    setMessage("");
    setError("");
  };

  const handleDelete = async () => {
    try {
      const token = Cookies.get("adminAccessToken");

      await axios.delete(
        `${process.env.REACT_APP_API_BASE_URL}/admin/chapter/${selectedChapter._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: {
            action: deleteOption,
            targetChapterId: selectedTargetChapter,
          },
        },
      );

      alert("Deleted successfully");
      fetchChapters();
      setShowDeleteModal(false);
      setFinalModal(false);
    } catch (err) {
      console.error("DELETE ERROR:", err.response?.data || err.message);
      alert("Delete failed");
    }
  };
  console.log("Current delete option:", deleteOption);

  const handleCancelEdit = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ name: "", city: "", description: "" });
    setMessage("");
    setError("");
  };

  const totalActive = chapters.reduce(
    (sum, ch) => sum + (ch.activeMembers || 0),
    0,
  );
  const totalCities = new Set(chapters.map((ch) => ch.city?.trim())).size;

  return (
    <div className="chapters-container">
      {/* Premium Hero Banner */}
      <div className="chapters-hero-banner">
        <div className="hero-content">
          <div className="hero-badge">Chapter Management</div>
          <h1>Manage Network Chapters</h1>
          <p>
            Create and grow your chapters with a unified, professional
            management platform.
          </p>
        </div>
        <div className="hero-stats-grid">
          <div className="hero-stat">
            <div className="stat-icon chapters-count">
              <Zap size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Total Chapters</span>
              <strong className="stat-value">{chapters.length}</strong>
            </div>
          </div>
          <div className="hero-stat">
            <div className="stat-icon members-count">
              <Users size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Active Members</span>
              <strong className="stat-value">{totalActive}</strong>
            </div>
          </div>
          <div className="hero-stat">
            <div className="stat-icon cities-count">
              <MapPin size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Unique Cities</span>
              <strong className="stat-value">{totalCities}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Header with Create Button */}
      <div className="chapters-header">
        <div className="header-content">
          <h2>All Chapters</h2>
          <p className="header-subtitle">View and manage all active chapters</p>
        </div>
        <button
          className="btn-create-chapter"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus size={18} />
          New Chapter
        </button>
      </div>

      {/* Create Form - Collapsible */}
      {showForm && (
        <div className="chapter-form-card">
          <h3>{editingId ? "Edit Chapter" : "Create New Chapter"}</h3>
          {message && <div className="alert-success">{message}</div>}
          {error && <div className="alert-error">{error}</div>}

          <form onSubmit={handleSubmit} className="chapter-form">
            <div className="form-group">
              <label>Chapter Name *</label>
              <input
                type="text"
                name="name"
                placeholder="e.g., New York Tech Hub"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>City *</label>
              <input
                type="text"
                name="city"
                placeholder="e.g., New York"
                value={form.city}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                placeholder="Describe the chapter, its mission, or key details..."
                value={form.description}
                onChange={handleChange}
                rows="4"
              />
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn-submit"
                disabled={formLoading}
              >
                {formLoading ? (
                  <>
                    <Loader size={16} />
                    {editingId ? "Updating..." : "Creating..."}
                  </>
                ) : editingId ? (
                  "Update Chapter"
                ) : (
                  "Create Chapter"
                )}
              </button>
              <button
                type="button"
                className="btn-cancel"
                onClick={handleCancelEdit}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search & Filters */}
      <div className="chapters-filters">
        <input
          type="text"
          className="search-input"
          placeholder="Search by chapter name or city..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Chapters List */}
      {loading ? (
        <div className="loading-container">
          <Loader size={40} className="spinner" />
          <p>Loading chapters...</p>
        </div>
      ) : filteredChapters.length === 0 ? (
        <div className="empty-container">
          <AlertCircle size={48} />
          <h3>No chapters found</h3>
          <p>
            {chapters.length === 0
              ? "No chapters have been created yet. Click 'New Chapter' to get started!"
              : "No chapters match your search criteria."}
          </p>
        </div>
      ) : (
        <div className="chapters-grid">
          {filteredChapters.map((chapter) => {
            const memberCount = chapter.activeMembers || 0;
            const isDeleting = deleteConfirm === (chapter._id || chapter.id);

            return (
              <div
                key={chapter._id || chapter.id}
                className="chapter-card premium"
              >
                <div className="card-accent-bar"></div>
                <div className="card-header">
                  <h3>{chapter.name}</h3>
                  <span className="member-badge">
                    {memberCount} member{memberCount !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="card-content">
                  <div className="info-item">
                    <MapPin size={16} className="icon-pin" />
                    <span>{chapter.city || "Unknown"}</span>
                  </div>
                  {chapter.description && (
                    <div className="info-item description">
                      <FileText size={16} />
                      <span>{chapter.description.substring(0, 100)}...</span>
                    </div>
                  )}
                </div>
                <div className="card-footer">
                  <small>
                    ID: {chapter._id?.toString().slice(-8) || chapter.id}
                  </small>
                </div>

                {/* Card Actions */}
                {isDeleting ? (
                  <div className="card-actions">
                    <button
                      className="btn-edit"
                      onClick={() => handleEdit(chapter)}
                    >
                      <Edit2 size={16} />
                      Edit
                    </button>

                    <button
                      className="btn-delete"
                      onClick={() => {
                        setSelectedChapter(chapter);
                        setShowDeleteModal(true);
                      }}
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                ) : (
                  <div className="card-actions">
                    <button
                      className="btn-edit"
                      onClick={() => handleEdit(chapter)}
                      title="Edit chapter"
                    >
                      <Edit2 size={16} />
                      Edit
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => {
                        setSelectedChapter(chapter);
                        setShowDeleteModal(true);
                      }}
                      title="Delete chapter"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {showDeleteModal && selectedChapter && (
            <div className="modal-overlay">
              <div className="modal-card">
                <h2>⚠️ Delete Chapter</h2>

                <p>
                  You are deleting <b>{selectedChapter.name}</b>
                </p>

                <div className="radio-group">
                  {/* MIGRATE */}
                  <label>
                    <input
                      type="radio"
                      value="migrate"
                      checked={deleteOption === "migrate"}
                      onChange={(e) => setDeleteOption(e.target.value)}
                    />
                    Migrate members to another chapter
                  </label>

                  {/* SHOW DROPDOWN */}
                  {deleteOption === "migrate" && (
                    <select
                      className="chapter-dropdown"
                      value={selectedTargetChapter}
                      onChange={(e) => setSelectedTargetChapter(e.target.value)}
                    >
                      <option value="">Select Target Chapter</option>
                      {chapters
                        .filter((c) => c._id !== selectedChapter._id)
                        .map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                  )}

                  {/* INACTIVE */}
                  <label>
                    <input
                      type="radio"
                      value="inactive"
                      checked={deleteOption === "inactive"}
                      onChange={(e) => setDeleteOption(e.target.value)}
                    />
                    Inactivate all members
                  </label>

                  {/* DELETE */}
                  <label>
                    <input
                      type="radio"
                      value="deleteAll"
                      checked={deleteOption === "deleteAll"}
                      onChange={(e) => setDeleteOption(e.target.value)}
                    />
                    Delete chapter with members
                  </label>
                </div>

                <div className="modal-actions">
                  <button onClick={() => setShowDeleteModal(false)}>
                    Cancel
                  </button>

                  <button
                    className="btn-danger"
                    onClick={() => {
                      // validation
                      if (
                        deleteOption === "migrate" &&
                        !selectedTargetChapter
                      ) {
                        alert("Please select target chapter");
                        return;
                      }

                      setShowDeleteModal(false);
                      setFinalModal(true);
                    }}
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* ================= FINAL CONFIRM ================= */}
          {finalModal && selectedChapter && (
            <div className="modal-overlay">
              <div className="modal-card">
                <h2>❗ Final Confirmation</h2>

                <p>
                  Delete <b>{selectedChapter.name}</b>?
                </p>

                <p style={{ color: "#b3432b" }}>
                  Action: <b>{deleteOption}</b>
                </p>

                <div className="modal-actions">
                  <button onClick={() => setFinalModal(false)}>Cancel</button>

                  <button
                    className="btn-danger"
                    onClick={() => {
                      handleDelete(selectedChapter._id, selectedChapter.name);
                      setFinalModal(false);
                    }}
                  >
                    Yes, Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Chapters;
