import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import {
  ChevronRight,
  Lock,
  Loader,
  AlertCircle,
  Building2,
  Mail,
  Phone,
  Repeat,
  User,
  Calendar,
  CreditCard,
  FileText,
  X,
  Download,
  CheckCircle2,
  Clock3,
  MapPin,
} from 'lucide-react';
import UserDetailModal from './UserDetailModal';
import './Users.css';

const apiBaseUrl =
  process.env.REACT_APP_API_BASE_URL?.replace(/\/$/, '') ||
  'http://localhost:5001/api';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showBlockConfirmModal, setShowBlockConfirmModal] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 0 });
  const [actionLoading, setActionLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('approved');
  const [searchQuery, setSearchQuery] = useState('');
  const [blockMessage, setBlockMessage] = useState('');

  const [chapters, setChapters] = useState([]);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [chapterUser, setChapterUser] = useState(null);
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [chapterActionLoading, setChapterActionLoading] = useState(false);
  const [chapterError, setChapterError] = useState('');

  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState('');
  const [invoiceData, setInvoiceData] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [page, filterStatus, searchQuery]);

  useEffect(() => {
    fetchChapters();
  }, []);

  const fetchChapters = async () => {
    try {
      const token = Cookies.get('adminAccessToken');
      const response = await axios.get(`${apiBaseUrl}/admin/chapters`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setChapters(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch chapters:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = Cookies.get('adminAccessToken');
      
      const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/admin/members?status=${filterStatus}&page=${page}&limit=10`;
      
      console.log('🔄 Fetching from URL:', apiUrl);
      console.log('📦 Token exists:', !!token);
      console.log('📊 Filter status:', filterStatus);

      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('✅ API Response received:', response.status);
      console.log('📋 Response data:', response.data);
      console.log('👥 Users in response:', response.data.data?.length || 0);

      if (response.data.success) {
        // Filter by search query if provided
        let filteredUsers = response.data.data || [];
        console.log('📥 Raw users from API:', filteredUsers.length);
        
        if (searchQuery) {
          filteredUsers = filteredUsers.filter(user =>
            user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
          );
          console.log('🔎 After search filter:', filteredUsers.length);
        }
        
        console.log('✅ Setting users:', filteredUsers);
        setUsers(filteredUsers);
        setPagination(response.data.pagination);
      } else {
        console.warn('⚠️  API returned success: false');
        console.warn('📄 Message:', response.data.message);
        setUsers([]);
      }
    } catch (error) {
      console.error('❌ Failed to fetch users:', error);
      console.error('📊 Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId, blockReason = '') => {
    try {
      setActionLoading(true);
      const token = Cookies.get('adminAccessToken');

      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/admin/reject/${userId}`,
        { reason: blockReason || 'Account blocked by admin' },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        alert('User blocked successfully!');
        setShowDetailModal(false);
        setShowBlockConfirmModal(false);
        setSelectedUser(null);
        setBlockMessage('');
        fetchUsers();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to block user');
      console.error('Block error:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const openChapterModal = (user) => {
    setChapterUser(user);
    setSelectedChapterId(
      typeof user.chapterId === 'object' ? user.chapterId?._id : user.chapterId || '',
    );
    setChapterError('');
    setShowChapterModal(true);
  };

  const closeChapterModal = () => {
    setShowChapterModal(false);
    setChapterUser(null);
    setSelectedChapterId('');
    setChapterError('');
  };

  const handleChangeChapter = async () => {
    if (!chapterUser || !selectedChapterId) {
      setChapterError('Select a chapter first');
      return;
    }

    const currentChapterId =
      typeof chapterUser.chapterId === 'object'
        ? chapterUser.chapterId?._id
        : chapterUser.chapterId;

    if (selectedChapterId === currentChapterId) {
      setChapterError('This member is already in that chapter');
      return;
    }

    try {
      setChapterActionLoading(true);
      setChapterError('');
      const token = Cookies.get('adminAccessToken');

      const response = await axios.put(
        `${apiBaseUrl}/admin/member/${chapterUser._id}/chapter`,
        { chapterId: selectedChapterId },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        closeChapterModal();
        fetchUsers();
      }
    } catch (error) {
      setChapterError(
        error.response?.data?.message || 'Failed to update chapter',
      );
    } finally {
      setChapterActionLoading(false);
    }
  };

  const openBlockConfirmModal = () => {
    setShowBlockConfirmModal(true);
  };

  const closeBlockConfirmModal = () => {
    setShowBlockConfirmModal(false);
    setBlockMessage('');
  };

  const confirmBlockUser = () => {
    if (selectedUser) {
      handleBlockUser(selectedUser._id, blockMessage);
    }
  };

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedUser(null);
    setBlockMessage('');
  };

  const openInvoiceModal = async (user) => {
    setShowInvoiceModal(true);
    setInvoiceLoading(true);
    setInvoiceError('');
    setInvoiceData(null);

    try {
      const token = Cookies.get('adminAccessToken');
      const response = await axios.get(
        `${apiBaseUrl}/admin/invoice/user/${user._id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        setInvoiceData(response.data.data);
      } else {
        setInvoiceError(response.data.message || 'No invoice found for this user');
      }
    } catch (error) {
      setInvoiceError(
        error.response?.data?.message || 'No invoice found for this user yet',
      );
    } finally {
      setInvoiceLoading(false);
    }
  };

  const closeInvoiceModal = () => {
    setShowInvoiceModal(false);
    setInvoiceData(null);
    setInvoiceError('');
  };

  const getInitials = (name = '') =>
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || '?';

  return (
    <div className="users-container">
      {/* Filters */}
      <div className="users-filters">
        <div className="filter-group">
          <label>Status:</label>
          <select 
            value={filterStatus} 
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
            className="filter-select"
          >
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="filter-group">
          <input
            type="text"
            placeholder="Search by name, email, or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-container">
          <Loader size={40} className="spinner" />
          <p>Loading users...</p>
        </div>
      )}

      {/* Users Table */}
      {!loading && users.length > 0 && (
        <>
          <div className="users-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Company</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="user-row">
                    <td className="user-name">{user.name}</td>
                    <td className="user-email">{user.email}</td>
                    <td className="user-company">
                      <div className="company-info">
                        <Building2 size={16} />
                        <span>{user.companyName}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge status-${user.status}`}>
                        {user.status?.charAt(0).toUpperCase() + user.status?.slice(1)}
                      </span>
                    </td>
                    <td className="user-joined">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleViewDetails(user)}
                          className="btn-detail"
                          title="View details"
                        >
                          <ChevronRight size={18} />
                          Details
                        </button>
                        <button
                          onClick={() => openChapterModal(user)}
                          className="btn-detail"
                          title="Change this member's chapter"
                        >
                          <Repeat size={18} />
                          Chapter
                        </button>
                        {user.status === 'approved' && (
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowBlockConfirmModal(true);
                            }}
                            className="btn-block"
                            disabled={actionLoading}
                            title="Block user access"
                          >
                            <Lock size={18} />
                            Block
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="pagination-btn"
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                disabled={page === pagination.pages}
                className="pagination-btn"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!loading && users.length === 0 && (
        <div className="empty-state">
          <AlertCircle size={48} />
          <h3>No users found</h3>
          <p>
            {searchQuery
              ? 'No users match your search criteria'
              : `No ${filterStatus} users at the moment`}
          </p>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedUser && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div
            className="modal-content user-view-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="uvm-header">
              <div className="uvm-header-accent" />
              <button onClick={handleCloseModal} className="uvm-close" title="Close">
                <X size={20} />
              </button>
              <div className="uvm-header-content">
                <div className="uvm-avatar">{getInitials(selectedUser.name)}</div>
                <div>
                  <h2 className="uvm-name">{selectedUser.name}</h2>
                  <p className="uvm-subtitle">
                    {selectedUser.companyName || 'No company listed'}
                  </p>
                  <span className={`status-badge status-${selectedUser.status}`}>
                    {selectedUser.status?.charAt(0).toUpperCase() + selectedUser.status?.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            <div className="modal-body uvm-body">
              <div className="uvm-card">
                <h3 className="uvm-card-title">
                  <User size={16} /> Contact Information
                </h3>
                <div className="uvm-grid">
                  <div className="uvm-field">
                    <label><Mail size={13} /> Email</label>
                    <a href={`mailto:${selectedUser.email}`}>{selectedUser.email}</a>
                  </div>
                  <div className="uvm-field">
                    <label><Phone size={13} /> Mobile</label>
                    <span>{selectedUser.mobile || '—'}</span>
                  </div>
                  <div className="uvm-field">
                    <label><Calendar size={13} /> Joined Date</label>
                    <span>{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="uvm-field">
                    <label><CheckCircle2 size={13} /> Email Verified</label>
                    <span>{selectedUser.isEmailVerified ? 'Verified' : 'Not verified'}</span>
                  </div>
                </div>
              </div>

              <div className="uvm-card">
                <h3 className="uvm-card-title">
                  <Building2 size={16} /> Company Information
                </h3>
                <div className="uvm-grid">
                  <div className="uvm-field">
                    <label><Building2 size={13} /> Company</label>
                    <span>{selectedUser.companyName || '—'}</span>
                  </div>
                  <div className="uvm-field">
                    <label><MapPin size={13} /> City</label>
                    <span>{selectedUser.city || '—'}</span>
                  </div>
                </div>

                {selectedUser.description && (
                  <div className="uvm-field uvm-field-full">
                    <label>Description</label>
                    <p className="description-text">{selectedUser.description}</p>
                  </div>
                )}

                {selectedUser.services && selectedUser.services.length > 0 && (
                  <div className="uvm-field uvm-field-full">
                    <label>Services</label>
                    <div className="services-list">
                      {selectedUser.services.map((service, idx) => (
                        <span key={idx} className="service-tag">{service}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="uvm-card uvm-card-payment">
                <h3 className="uvm-card-title">
                  <CreditCard size={16} /> Payment Information
                </h3>
                <div className="uvm-grid">
                  <div className="uvm-field">
                    <label>Payment Status</label>
                    <span className={`uvm-pay-status ${selectedUser.paymentStatus === 'paid' ? 'paid' : 'pending'}`}>
                      {selectedUser.paymentStatus === 'paid' ? (
                        <><CheckCircle2 size={14} /> Paid</>
                      ) : (
                        <><Clock3 size={14} /> Not paid</>
                      )}
                    </span>
                  </div>
                  {selectedUser.paymentAmount && (
                    <div className="uvm-field">
                      <label>Amount Paid</label>
                      <span>₹{selectedUser.paymentAmount}</span>
                    </div>
                  )}
                  {selectedUser.razorpayPaymentId && (
                    <div className="uvm-field">
                      <label>Razorpay Payment ID</label>
                      <span className="uvm-mono">{selectedUser.razorpayPaymentId}</span>
                    </div>
                  )}
                  {selectedUser.paidAt && (
                    <div className="uvm-field">
                      <label>Paid On</label>
                      <span>{new Date(selectedUser.paidAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {selectedUser.paymentStatus === 'paid' && (
                  <button
                    className="uvm-view-invoice-link"
                    onClick={() => openInvoiceModal(selectedUser)}
                  >
                    <FileText size={15} /> View Invoice →
                  </button>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={handleCloseModal} className="btn-cancel">
                Close
              </button>
              <button
                onClick={() => {
                  handleCloseModal();
                  openChapterModal(selectedUser);
                }}
                className="btn-cancel"
              >
                Change Chapter
              </button>
              {selectedUser.status === 'approved' && (
                <button
                  onClick={openBlockConfirmModal}
                  className="btn-block-user"
                  disabled={actionLoading}
                >
                  Block User
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Invoice Viewer Modal */}
      {showInvoiceModal && (
        <div className="modal-overlay" onClick={closeInvoiceModal}>
          <div className="invoice-modal" onClick={(e) => e.stopPropagation()}>
            <div className="invoice-modal-header">
              <div>
                <h3>Invoice{invoiceData ? ` #${invoiceData.invoiceNumber}` : ''}</h3>
                {invoiceData && (
                  <p>
                    ₹{invoiceData.amounts?.totalAmount?.toFixed(2)} · Issued{' '}
                    {new Date(invoiceData.issuedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="invoice-modal-actions">
                {invoiceData?.pdfUrl && (
                  <a
                    href={invoiceData.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="invoice-download-btn"
                    title="Download invoice"
                  >
                    <Download size={16} />
                  </a>
                )}
                <button onClick={closeInvoiceModal} className="invoice-close-btn" title="Close">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="invoice-modal-body">
              {invoiceLoading && (
                <div className="invoice-modal-status">
                  <Loader size={32} className="spinner" />
                  <p>Loading invoice…</p>
                </div>
              )}
              {!invoiceLoading && invoiceError && (
                <div className="invoice-modal-status">
                  <AlertCircle size={32} />
                  <p>{invoiceError}</p>
                </div>
              )}
              {!invoiceLoading && !invoiceError && invoiceData?.pdfUrl && (
                <iframe
                  src={invoiceData.pdfUrl}
                  title="Invoice PDF"
                  className="invoice-iframe"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Block Confirmation Modal */}
      {showBlockConfirmModal && selectedUser && (
        <div className="modal-overlay" onClick={closeBlockConfirmModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Block User</h2>
              <button onClick={closeBlockConfirmModal} className="modal-close">&times;</button>
            </div>

            <div className="modal-body">
              <div className="warning-box">
                <AlertCircle size={24} style={{ color: '#b3432b', marginRight: '10px' }} />
                <div>
                  <h3>Block User Access</h3>
                  <p>This user will be blocked and will lose access to their account permanently.</p>
                </div>
              </div>

              <div className="user-info-section">
                <h4>User Details</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Name</label>
                    <p>{selectedUser.name}</p>
                  </div>
                  <div className="detail-item">
                    <label>Email</label>
                    <p>{selectedUser.email}</p>
                  </div>
                  <div className="detail-item">
                    <label>Company</label>
                    <p>{selectedUser.companyName}</p>
                  </div>
                  <div className="detail-item">
                    <label>Status</label>
                    <p>
                      <span className={`status-badge status-${selectedUser.status}`}>
                        {selectedUser.status?.charAt(0).toUpperCase() + selectedUser.status?.slice(1)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="block-reason-section">
                <label htmlFor="blockReason">Reason for Blocking (Optional)</label>
                <textarea
                  id="blockReason"
                  placeholder="Enter reason for blocking this user..."
                  value={blockMessage}
                  onChange={(e) => setBlockMessage(e.target.value)}
                  className="block-textarea"
                  rows={4}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={closeBlockConfirmModal}
                className="btn-cancel"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={confirmBlockUser}
                className="btn-confirm-block"
                disabled={actionLoading}
              >
                {actionLoading ? 'Blocking...' : 'Yes, Block This User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Chapter Modal */}
      {showChapterModal && chapterUser && (
        <div className="modal-overlay" onClick={closeChapterModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Change Chapter</h2>
              <button onClick={closeChapterModal} className="modal-close">&times;</button>
            </div>

            <div className="modal-body">
              <div className="user-info-section">
                <h4>Member</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Name</label>
                    <p>{chapterUser.name}</p>
                  </div>
                  <div className="detail-item">
                    <label>Company</label>
                    <p>{chapterUser.companyName}</p>
                  </div>
                  <div className="detail-item">
                    <label>Current Chapter</label>
                    <p>
                      {typeof chapterUser.chapterId === 'object'
                        ? chapterUser.chapterId?.name || 'Unassigned'
                        : chapters.find((c) => c._id === chapterUser.chapterId)?.name || 'Unassigned'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="filter-group" style={{ marginTop: '16px' }}>
                <label>New Chapter</label>
                <select
                  value={selectedChapterId}
                  onChange={(e) => {
                    setSelectedChapterId(e.target.value);
                    setChapterError('');
                  }}
                  className="filter-select"
                  disabled={chapterActionLoading}
                >
                  <option value="">Select a chapter…</option>
                  {chapters.map((chapter) => (
                    <option key={chapter._id} value={chapter._id}>
                      {chapter.name} ({chapter.city})
                    </option>
                  ))}
                </select>
              </div>

              {chapterError && (
                <div className="warning-box" style={{ marginTop: '12px' }}>
                  <AlertCircle size={20} style={{ color: '#b3432b', marginRight: '10px' }} />
                  <p>{chapterError}</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                onClick={closeChapterModal}
                className="btn-cancel"
                disabled={chapterActionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleChangeChapter}
                className="btn-confirm-block"
                disabled={chapterActionLoading || !selectedChapterId}
              >
                {chapterActionLoading ? 'Moving…' : 'Move Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
