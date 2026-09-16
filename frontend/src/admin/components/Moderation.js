import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import {
  Flag,
  ShieldAlert,
  ShieldCheck,
  Ban,
  Clock,
  AlertCircle,
} from 'lucide-react';
import ModerationCaseDetail from './ModerationCaseDetail';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'ACTION_TAKEN', label: 'Action Taken' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const REQUEST_TYPE_OPTIONS = [
  { value: 'all', label: 'All Requests' },
  { value: 'REPORT', label: 'Reports' },
  { value: 'BLOCK', label: 'Block Requests' },
];

const STATUS_BADGE_CLASS = {
  PENDING: 'badge-pending',
  UNDER_REVIEW: 'badge-info',
  ACTION_TAKEN: 'badge-success',
  REJECTED: 'badge-rejected',
  CLOSED: 'badge-primary',
  CANCELLED: 'badge-primary',
};

const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const Moderation = () => {
  const [stats, setStats] = useState(null);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 1, total: 0 });
  const [statusFilter, setStatusFilter] = useState('all');
  const [requestTypeFilter, setRequestTypeFilter] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCaseId, setSelectedCaseId] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchCases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, requestTypeFilter, search]);

  const fetchStats = async () => {
    try {
      const token = Cookies.get('adminAccessToken');
      const response = await axios.get(`${API_BASE_URL}/admin/moderation/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch moderation stats:', err);
    }
  };

  const fetchCases = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = Cookies.get('adminAccessToken');

      const response = await axios.get(`${API_BASE_URL}/admin/moderation/cases`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page,
          limit: 10,
          status: statusFilter === 'all' ? undefined : statusFilter,
          requestType: requestTypeFilter === 'all' ? undefined : requestTypeFilter,
          search: search || undefined,
        },
      });

      if (response.data.success) {
        setCases(response.data.data || []);
        setPagination(response.data.pagination || { pages: 1, total: 0 });
      } else {
        throw new Error(response.data.message || 'Failed to fetch moderation cases.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred.');
      console.error('Fetch Moderation Cases Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCaseUpdated = () => {
    fetchCases();
    fetchStats();
  };

  const statCards = [
    { title: 'Pending', value: stats?.pending ?? 0, icon: <Clock size={28} />, color: 'warning' },
    { title: 'Under Review', value: stats?.underReview ?? 0, icon: <ShieldAlert size={28} />, color: 'info' },
    { title: 'Action Taken', value: stats?.actionTaken ?? 0, icon: <ShieldCheck size={28} />, color: 'success' },
    { title: 'Rejected', value: stats?.rejected ?? 0, icon: <Flag size={28} />, color: 'danger' },
    { title: 'Pending Block Requests', value: stats?.pendingBlockRequests ?? 0, icon: <Ban size={28} />, color: 'warning' },
    { title: 'Blocked Accounts', value: stats?.activeBlocks ?? 0, icon: <Clock size={28} />, color: 'info' },
    { title: 'Active Bans', value: stats?.activeBans ?? 0, icon: <Ban size={28} />, color: 'danger' },
  ];

  return (
    <div>
      <div className="grid grid-cols-4" style={{ marginBottom: '24px' }}>
        {statCards.map((card, index) => (
          <div key={index} className="stat-card">
            <div className={`stat-card-icon ${card.color}`}>{card.icon}</div>
            <div className="stat-card-left">
              <div className="stat-card-label">{card.title}</div>
              <div className="stat-card-value">{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Moderation Queue</h2>
          <p className="card-subtitle">
            Reports and block requests submitted by members, awaiting or under review.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '12px',
            padding: '0 24px 20px',
            flexWrap: 'wrap',
          }}
        >
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="form-select"
            style={{ width: 'auto', minWidth: '160px' }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={requestTypeFilter}
            onChange={(e) => {
              setRequestTypeFilter(e.target.value);
              setPage(1);
            }}
            className="form-select"
            style={{ width: 'auto', minWidth: '160px' }}
          >
            {REQUEST_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Search by case ID, reporter, or reported member..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="form-input"
            style={{ flex: 1, minWidth: '240px' }}
          />
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div className="loading" style={{ fontSize: '40px', display: 'inline-block' }}>
              ⏳
            </div>
            <p style={{ marginTop: '12px', color: '#48546b' }}>Loading moderation queue...</p>
          </div>
        )}

        {!loading && error && (
          <div className="alert alert-danger" style={{ margin: '0 24px 20px' }}>
            Error: {error}
          </div>
        )}

        {!loading && !error && (
          <div className="table-container">
            {cases.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Case ID</th>
                    <th>Type</th>
                    <th>Reporter</th>
                    <th>Reported</th>
                    <th>Reason</th>
                    <th>Submitted</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.map((c) => (
                    <tr
                      key={c._id}
                      onClick={() => setSelectedCaseId(c._id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>{c.caseId}</td>
                      <td>{c.requestType === 'BLOCK' ? 'Block Request' : 'Report'}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{c.reporterUserId?.name || '—'}</div>
                        <div style={{ fontSize: '12px', color: '#48546b' }}>{c.reporterUserId?.email || ''}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{c.reportedUserId?.name || '—'}</div>
                        <div style={{ fontSize: '12px', color: '#48546b' }}>{c.reportedUserId?.companyName || ''}</div>
                      </td>
                      <td>{c.reasonCategory?.replace(/_/g, ' ')}</td>
                      <td>{formatDate(c.createdAt)}</td>
                      <td>
                        <span className={`badge ${STATUS_BADGE_CLASS[c.status] || 'badge-primary'}`}>
                          {c.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <AlertCircle size={40} color="#8a95ab" />
                <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '16px 0 8px' }}>
                  No moderation cases found
                </h3>
                <p style={{ color: '#48546b' }}>
                  {search || statusFilter !== 'all' || requestTypeFilter !== 'all'
                    ? 'No cases match your current filters.'
                    : 'No reports or block requests have been submitted yet.'}
                </p>
              </div>
            )}
          </div>
        )}

        {!loading && !error && pagination.pages > 1 && (
          <div className="pagination">
            <div
              className={`pagination-item ${page === 1 ? 'disabled' : ''}`}
              onClick={() => page > 1 && setPage(page - 1)}
            >
              ‹
            </div>
            <div className="pagination-item active">{page}</div>
            <div
              className={`pagination-item ${page === pagination.pages ? 'disabled' : ''}`}
              onClick={() => page < pagination.pages && setPage(page + 1)}
            >
              ›
            </div>
          </div>
        )}
      </div>

      {selectedCaseId && (
        <ModerationCaseDetail
          caseId={selectedCaseId}
          onClose={() => setSelectedCaseId(null)}
          onUpdated={handleCaseUpdated}
        />
      )}
    </div>
  );
};

export default Moderation;
