import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { X, ShieldAlert } from 'lucide-react';
import './UserDetailModal.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const ENFORCEMENT_STATUS_BADGE = {
  ACTIVE: 'badge-success',
  RESTRICTED: 'badge-warning',
  SUSPENDED: 'badge-warning',
  BANNED: 'badge-danger',
};

const STATUS_BADGE_CLASS = {
  PENDING: 'badge-pending',
  UNDER_REVIEW: 'badge-info',
  ACTION_TAKEN: 'badge-success',
  REJECTED: 'badge-rejected',
  CLOSED: 'badge-primary',
  CANCELLED: 'badge-primary',
};

const ACTION_OPTIONS = [
  { value: 'BLOCK', label: 'Block User', description: 'Restricts this member’s account access.' },
  { value: 'BAN', label: 'Ban Account', description: 'Permanently bans this member from GBN.' },
  { value: 'MESSAGE', label: 'Message User', description: 'Sends this member a notification about it.' },
  { value: 'MANUAL', label: 'I will manually take action on it', description: 'Closes this case with no automatic account change.' },
];

const formatDateTime = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
};

const ModerationCaseDetail = ({ caseId, onClose, onUpdated }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  const [showActionForm, setShowActionForm] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [blockType, setBlockType] = useState(null); // 'TEMPORARY' | 'PERMANENT'
  const [blockFrom, setBlockFrom] = useState('');
  const [blockUntil, setBlockUntil] = useState('');

  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const resetActionForm = () => {
    setShowActionForm(false);
    setSelectedAction(null);
    setMessageText('');
    setAdminNotes('');
    setBlockType(null);
    setBlockFrom('');
    setBlockUntil('');
    setActionError(null);
  };

  const openActionForm = () => {
    resetActionForm();
    setShowActionForm(true);
  };

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = Cookies.get('adminAccessToken');
      const response = await axios.get(`${API_BASE_URL}/admin/moderation/cases/${caseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setData(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to load case details.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleTakeAction = async () => {
    if (!selectedAction) {
      setActionError('Please choose an action.');
      return;
    }
    if (selectedAction === 'MESSAGE' && !messageText.trim()) {
      setActionError('Please write the message to send to this member.');
      return;
    }
    if (selectedAction === 'BLOCK') {
      if (!blockType) {
        setActionError('Please choose whether to block temporarily or permanently.');
        return;
      }
      if (blockType === 'TEMPORARY') {
        if (!blockFrom || !blockUntil) {
          setActionError('Please select both a from and until date for the block period.');
          return;
        }
        if (new Date(blockUntil) <= new Date(blockFrom)) {
          setActionError('The until date must be after the from date.');
          return;
        }
      }
    }

    try {
      setActionLoading(true);
      setActionError(null);
      const token = Cookies.get('adminAccessToken');

      const payload = { enforcementAction: selectedAction, adminNotes };
      if (selectedAction === 'MESSAGE') payload.messageText = messageText.trim();
      if (selectedAction === 'BLOCK') {
        payload.blockType = blockType;
        if (blockType === 'TEMPORARY') {
          payload.blockFrom = blockFrom;
          payload.blockUntil = blockUntil;
        }
      }

      await axios.post(`${API_BASE_URL}/admin/moderation/cases/${caseId}/action`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      await fetchDetail();
      onUpdated?.();
      resetActionForm();
    } catch (err) {
      setActionError(err.response?.data?.message || err.message || 'Failed to apply moderation action.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectionReason.trim()) {
      setActionError('Please provide a reason for rejecting this request.');
      return;
    }
    try {
      setActionLoading(true);
      setActionError(null);
      const token = Cookies.get('adminAccessToken');
      await axios.post(
        `${API_BASE_URL}/admin/moderation/cases/${caseId}/reject`,
        { rejectionReason },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      await fetchDetail();
      onUpdated?.();
      setShowRejectForm(false);
    } catch (err) {
      setActionError(err.response?.data?.message || err.message || 'Failed to reject request.');
    } finally {
      setActionLoading(false);
    }
  };

  const moderationCase = data?.case;
  const moderationHistory = data?.moderationHistory || [];
  const isOpen = moderationCase && ['PENDING', 'UNDER_REVIEW'].includes(moderationCase.status);

  return (
    <>
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Moderation Case</h2>
            <p className="modal-subtitle" style={{ fontFamily: 'monospace' }}>
              {moderationCase?.caseId || '...'}
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={22} />
          </button>
        </div>

        <div className="modal-body">
          {loading && <p>Loading case details...</p>}
          {!loading && error && <div className="alert alert-danger">{error}</div>}

          {!loading && !error && moderationCase && (
            <>
              <div className="detail-section">
                <h3 className="section-title">Report Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label className="info-label">Request Type</label>
                    <p className="info-value">{moderationCase.requestType === 'BLOCK' ? 'Block Request' : 'Report'}</p>
                  </div>
                  <div className="info-item">
                    <label className="info-label">Status</label>
                    <p className="info-value">
                      <span className={`badge ${STATUS_BADGE_CLASS[moderationCase.status] || 'badge-primary'}`}>
                        {moderationCase.status.replace(/_/g, ' ')}
                      </span>
                    </p>
                  </div>
                  <div className="info-item">
                    <label className="info-label">Reason</label>
                    <p className="info-value">{moderationCase.reasonCategory?.replace(/_/g, ' ')}</p>
                  </div>
                  <div className="info-item">
                    <label className="info-label">Content Type</label>
                    <p className="info-value">{moderationCase.reportedContentType}</p>
                  </div>
                  <div className="info-item">
                    <label className="info-label">Submitted</label>
                    <p className="info-value">{formatDateTime(moderationCase.createdAt)}</p>
                  </div>
                </div>
                {moderationCase.description && (
                  <div style={{ marginTop: '12px' }}>
                    <label className="info-label">Description</label>
                    <p className="description-text">{moderationCase.description}</p>
                  </div>
                )}
              </div>

              <div className="detail-section">
                <h3 className="section-title">Reported Member</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label className="info-label">Name</label>
                    <p className="info-value">{moderationCase.reportedUserId?.name}</p>
                  </div>
                  <div className="info-item">
                    <label className="info-label">Company</label>
                    <p className="info-value">{moderationCase.reportedUserId?.companyName || '—'}</p>
                  </div>
                  <div className="info-item">
                    <label className="info-label">Account Status</label>
                    <p className="info-value">{moderationCase.reportedUserId?.status}</p>
                  </div>
                  <div className="info-item">
                    <label className="info-label">Enforcement Status</label>
                    <p className="info-value">
                      <span className={`badge ${ENFORCEMENT_STATUS_BADGE[moderationCase.reportedUserId?.enforcementStatus] || 'badge-success'}`}>
                        {moderationCase.reportedUserId?.enforcementStatus || 'ACTIVE'}
                      </span>
                      {moderationCase.reportedUserId?.suspensionEndsAt && (
                        <span style={{ marginLeft: '8px', fontSize: '12px', color: '#48546b' }}>
                          until {formatDateTime(moderationCase.reportedUserId.suspensionEndsAt)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {moderationHistory.length > 0 && (
                <div className="detail-section">
                  <h3 className="section-title">Moderation History ({moderationHistory.length})</h3>
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Case ID</th>
                          <th>Type</th>
                          <th>Reason</th>
                          <th>Status</th>
                          <th>Action</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {moderationHistory.map((h) => (
                          <tr key={h._id}>
                            <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{h.caseId}</td>
                            <td>{h.requestType}</td>
                            <td>{h.reasonCategory?.replace(/_/g, ' ')}</td>
                            <td>
                              <span className={`badge ${STATUS_BADGE_CLASS[h.status] || 'badge-primary'}`}>
                                {h.status.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td>{h.enforcementAction !== 'NONE' ? h.enforcementAction : '—'}</td>
                            <td>{formatDateTime(h.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {actionError && !showActionForm && <div className="alert alert-danger">{actionError}</div>}

              {isOpen && showRejectForm && (
                <div className="detail-section rejection-section">
                  <h3 className="section-title rejection-title">Reject Moderation Request</h3>
                  <label className="form-label">Reason for rejecting this request *</label>
                  <textarea
                    className="rejection-textarea"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Insufficient evidence to establish a policy violation."
                    disabled={actionLoading}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {!loading && !error && moderationCase && (
          <div className="modal-footer">
            {!showRejectForm && (
              <>
                <button className="btn btn-secondary" onClick={onClose} disabled={actionLoading}>
                  Close
                </button>
                {isOpen && (
                  <>
                    <button className="btn btn-danger" onClick={() => setShowRejectForm(true)} disabled={actionLoading}>
                      Reject Request
                    </button>
                    <button className="btn btn-primary" onClick={openActionForm} disabled={actionLoading}>
                      Take Action
                    </button>
                  </>
                )}
              </>
            )}

            {showRejectForm && (
              <>
                <button className="btn btn-secondary" onClick={() => setShowRejectForm(false)} disabled={actionLoading}>
                  Back
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleRejectSubmit}
                  disabled={actionLoading || !rejectionReason.trim()}
                >
                  {actionLoading ? 'Submitting...' : 'Submit Rejection'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>

    {isOpen && showActionForm && (
        <div className="modal-overlay" onClick={() => !actionLoading && resetActionForm()}>
          <div className="modal-content" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Take Action</h2>
                <p className="modal-subtitle" style={{ fontFamily: 'monospace' }}>{moderationCase?.caseId}</p>
              </div>
              <button className="modal-close" onClick={() => !actionLoading && resetActionForm()}>
                <X size={22} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {ACTION_OPTIONS.map((opt) => (
                  <div
                    key={opt.value}
                    onClick={() => {
                      if (actionLoading) return;
                      setSelectedAction(opt.value);
                      setActionError(null);
                    }}
                    style={{
                      border: `2px solid ${selectedAction === opt.value ? '#2f6f4e' : '#e2e6ea'}`,
                      background: selectedAction === opt.value ? '#eef7f1' : '#fff',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      cursor: actionLoading ? 'default' : 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>{opt.label}</div>
                    <div style={{ fontSize: '12.5px', color: '#48546b', marginTop: '2px' }}>
                      {opt.description}
                    </div>
                  </div>
                ))}
              </div>

              {selectedAction === 'BLOCK' && (
                <div className="form-group" style={{ marginTop: '16px' }}>
                  <label className="form-label">Block Duration</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      className={`btn ${blockType === 'TEMPORARY' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setBlockType('TEMPORARY')}
                      disabled={actionLoading}
                      style={{ flex: 1 }}
                    >
                      For a specific time period
                    </button>
                    <button
                      type="button"
                      className={`btn ${blockType === 'PERMANENT' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setBlockType('PERMANENT')}
                      disabled={actionLoading}
                      style={{ flex: 1 }}
                    >
                      Permanently
                    </button>
                  </div>

                  {blockType === 'TEMPORARY' && (
                    <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <label className="form-label">From</label>
                        <input
                          type="date"
                          className="form-input"
                          value={blockFrom}
                          onChange={(e) => setBlockFrom(e.target.value)}
                          disabled={actionLoading}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label className="form-label">To</label>
                        <input
                          type="date"
                          className="form-input"
                          value={blockUntil}
                          onChange={(e) => setBlockUntil(e.target.value)}
                          disabled={actionLoading}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedAction === 'MESSAGE' && (
                <div className="form-group" style={{ marginTop: '16px' }}>
                  <label className="form-label">Message to send this member *</label>
                  <textarea
                    className="rejection-textarea"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="This message is delivered to the member as a notification..."
                    disabled={actionLoading}
                  />
                </div>
              )}

              {selectedAction === 'BAN' && (
                <div className="alert alert-danger" style={{ marginTop: '16px' }}>
                  <ShieldAlert size={16} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
                  Are you sure you want to ban this account? The member will be logged out of the
                  app immediately and permanently banned from GBN. This cannot be undone from here
                  - only reversed later with Unban from the Users page.
                </div>
              )}

              {selectedAction && (
                <div className="form-group" style={{ marginTop: '16px' }}>
                  <label className="form-label">Admin Notes (internal only, optional)</label>
                  <textarea
                    className="rejection-textarea"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Internal notes about this decision (not shared with the reporter or reported member)..."
                    disabled={actionLoading}
                  />
                </div>
              )}

              {actionError && <div className="alert alert-danger" style={{ marginTop: '16px' }}>{actionError}</div>}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={resetActionForm} disabled={actionLoading}>
                Cancel
              </button>
              <button
                className={selectedAction === 'BAN' ? 'btn btn-danger' : 'btn btn-primary'}
                onClick={handleTakeAction}
                disabled={actionLoading || !selectedAction}
              >
                {actionLoading ? 'Applying...' : selectedAction === 'BAN' ? 'Yes, Ban This Account' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
    )}
    </>
  );
};

export default ModerationCaseDetail;
