import React, { useState } from "react";
import { X } from "lucide-react";
import "./UserDetailModal.css";
import {
  User,
  Building2,
  FileText,
  FileCheck,
  Search,
  Clock3,
  CheckCircle2,
  XCircle,
  ZoomIn,
  CreditCard,
} from "lucide-react";

const UserDetailModal = ({ user, onClose, onApprove, onReject, isLoading }) => {
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [expandedImage, setExpandedImage] = useState(null);

  const handleRejectSubmit = (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }
    onReject(rejectionReason);
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;

    // Remove '/api' from base URL for static files
    const baseUrl = "https://api.gbnsocialassociations.in";

    // Normalize path separators (convert backslashes to forward slashes)
    const normalizedPath = imagePath.replace(/\\/g, "/");

    const finalUrl = `${baseUrl}/${normalizedPath}`;

    console.log("???  Image URL Debug:");
    console.log("   Original path:", imagePath);
    console.log("   Base URL:", baseUrl);
    console.log("   Normalized path:", normalizedPath);
    console.log("   Final URL:", finalUrl);

    return finalUrl;
  };

  const companyLogoUrl = getImageUrl(user.companyLogo);
  const profileImageUrl = getImageUrl(user.profileImage);

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div
          className="modal-content user-detail-modal"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="modal-header">
            <div>
              <h2 className="modal-title">User Verification Details</h2>
              <p className="modal-subtitle">
                Request ID: {user._id?.slice(-8)}
              </p>
            </div>
            <button className="modal-close" onClick={onClose}>
              <X size={22} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="modal-body user-detail-body">
            {/* Profile Section */}
            {profileImageUrl && (
              <div className="detail-section profile-section">
                <h3 className="section-title">User Profile</h3>
                <div className="profile-container">
                  <img
                    src={profileImageUrl}
                    alt="Profile"
                    className="profile-image"
                    crossOrigin="anonymous"
                    onClick={() => setExpandedImage(profileImageUrl)}
                    onError={(e) => {
                      console.error(
                        "? Profile image failed to load:",
                        profileImageUrl,
                      );
                      console.error("Error event:", e);
                    }}
                    onLoad={() =>
                      console.log("? Profile image loaded:", profileImageUrl)
                    }
                  />
                </div>
              </div>
            )}

            {/* Basic Information */}
            <div className="detail-section">
              <h3 className="section-title">
                <span className="section-icon">
                  <User size={20} />
                </span>
                Basic Information
              </h3>
              <div className="info-grid">
                <div className="info-item">
                  <label className="info-label">Full Name</label>
                  <p className="info-value">{user.name}</p>
                </div>
                <div className="info-item">
                  <label className="info-label">Email Address</label>
                  <p className="info-value">{user.email}</p>
                </div>
                <div className="info-item">
                  <label className="info-label">Phone Number</label>
                  <p className="info-value">{user.mobile}</p>
                </div>
                <div className="info-item">
                  <label className="info-label">Registration Date</label>
                  <p className="info-value">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div className="detail-section">
              <h3 className="section-title">
                <span className="section-icon">
                  <Building2 size={20} />
                </span>
                Company Information
              </h3>
              <div className="info-grid">
                <div className="info-item">
                  <label className="info-label">Company Name</label>
                  <p className="info-value">{user.companyName}</p>
                </div>
                <div className="info-item">
                  <label className="info-label">Services</label>
                  <p className="info-value">
                    {user.services && user.services.length > 0
                      ? user.services.join(", ")
                      : "Not specified"}
                  </p>
                </div>
                {user.designation && (
                  <div className="info-item">
                    <label className="info-label">Designation</label>
                    <p className="info-value">{user.designation}</p>
                  </div>
                )}
                {user.industry && (
                  <div className="info-item">
                    <label className="info-label">Industry</label>
                    <p className="info-value">{user.industry}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {user.description && (
              <div className="detail-section">
                <h3 className="section-title">
                  <span className="section-icon">
                    <FileText size={20} />
                  </span>
                  Description
                </h3>
                <p className="description-text">{user.description}</p>
              </div>
            )}

            {/* Documents Section - Images */}
            <div className="detail-section">
              <h3 className="section-title">
                <span className="section-icon">
                  <FileCheck size={20} />
                </span>
                Verification Documents
              </h3>
              <div className="images-gallery">
                {/* Company Logo */}
                {companyLogoUrl && (
                  <div className="image-card">
                    <div className="image-label">Company Logo</div>
                    <img
                      src={companyLogoUrl}
                      alt="Company Logo"
                      className="gallery-image"
                      crossOrigin="anonymous"
                      onClick={() => setExpandedImage(companyLogoUrl)}
                      onError={(e) => {
                        console.error(
                          "? Company logo failed to load:",
                          companyLogoUrl,
                        );
                        console.error("Error event:", e);
                      }}
                      onLoad={() =>
                        console.log("? Company logo loaded:", companyLogoUrl)
                      }
                    />
                    <button
                      className="expand-btn"
                      onClick={() => setExpandedImage(companyLogoUrl)}
                      title="Click to expand"
                    >
                      <ZoomIn size={16} />
                      <span>Expand</span>
                    </button>
                  </div>
                )}

              </div>
            </div>

            {/* Payment Information */}
            <div className="detail-section">
              <h3 className="section-title">
                <span className="section-icon">
                  <CreditCard size={20} />
                </span>
                Payment Information
              </h3>
              <div className="info-grid">
                <div className="info-item">
                  <label className="info-label">Payment Status</label>
                  <p className="info-value">
                    {user.paymentStatus === "paid"
                      ? "✅ Paid via Razorpay"
                      : "⏳ Not paid"}
                  </p>
                </div>
                {user.paymentAmount && (
                  <div className="info-item">
                    <label className="info-label">Amount Paid</label>
                    <p className="info-value">₹{user.paymentAmount}</p>
                  </div>
                )}
                {user.razorpayPaymentId && (
                  <div className="info-item">
                    <label className="info-label">Razorpay Payment ID</label>
                    <p className="info-value">{user.razorpayPaymentId}</p>
                  </div>
                )}
                {user.paidAt && (
                  <div className="info-item">
                    <label className="info-label">Paid On</label>
                    <p className="info-value">
                      {new Date(user.paidAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Status Badge */}
            <div className="status-info">
              <div className="status-badge" data-status={user.status}>
                {user.status === "pending" && "? Pending Review"}
                {user.status === "approved" && "? Approved"}
                {user.status === "rejected" && "? Rejected"}
              </div>
            </div>

            {/* Rejection Form */}
            {showRejectForm && (
              <div className="detail-section rejection-section">
                <h3 className="section-title rejection-title">
                  <span className="section-icon">??</span> Rejection Reason
                </h3>
                <textarea
                  className="rejection-textarea"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this registration is being rejected..."
                  disabled={isLoading}
                />
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="modal-footer user-detail-footer">
            <button
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>

            {showRejectForm ? (
              <>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowRejectForm(false)}
                  disabled={isLoading}
                >
                  Back
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleRejectSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : "Confirm Rejection"}
                </button>
              </>
            ) : (
              <>
                <button
                  className="btn btn-danger"
                  onClick={() => setShowRejectForm(true)}
                  disabled={isLoading}
                >
                  Reject
                </button>
                <button
                  className="btn btn-success"
                  onClick={onApprove}
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : "Approve"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Image Expansion Modal */}
      {expandedImage && (
        <div
          className="image-expand-overlay"
          onClick={() => setExpandedImage(null)}
        >
          <div
            className="image-expand-container"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="image-expand-close"
              onClick={() => setExpandedImage(null)}
            >
              ?
            </button>
            <img
              src={expandedImage}
              alt="Expanded view"
              className="expanded-image"
              crossOrigin="anonymous"
              onError={(e) =>
                console.error("? Expanded image failed to load:", expandedImage)
              }
              onLoad={() =>
                console.log("? Expanded image loaded:", expandedImage)
              }
            />
          </div>
        </div>
      )}
    </>
  );
};

export default UserDetailModal;
