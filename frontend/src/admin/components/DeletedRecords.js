import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { UserX, RotateCcw, AlertCircle } from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const formatDate = date => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const DeletedRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 1, total: 0 });
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  // Debounce the search box so we don't refetch on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, search]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = Cookies.get('adminAccessToken');

      const response = await axios.get(`${API_BASE_URL}/admin/deleted-records`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page,
          limit: 10,
          status: statusFilter === 'all' ? undefined : statusFilter,
          search: search || undefined,
        },
      });

      if (response.data.success) {
        setRecords(response.data.data || []);
        setPagination(response.data.pagination || { pages: 1, total: 0 });
      } else {
        throw new Error(response.data.message || 'Failed to fetch deleted records.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred.');
      console.error('Fetch Deleted Records Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Deleted Accounts</h2>
          <p className="card-subtitle">
            Permanent record of every account that has been deleted, and whether the member has
            since rejoined.
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
            onChange={e => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="form-select"
            style={{ width: 'auto', minWidth: '160px' }}
          >
            <option value="all">All Records</option>
            <option value="deleted">Deleted Only</option>
            <option value="rejoined">Rejoined</option>
          </select>

          <input
            type="text"
            placeholder="Search by name, email, mobile or company..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="form-input"
            style={{ flex: 1, minWidth: '240px' }}
          />
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div className="loading" style={{ fontSize: '40px', display: 'inline-block' }}>
              ⏳
            </div>
            <p style={{ marginTop: '12px', color: '#48546b' }}>Loading deleted records...</p>
          </div>
        )}

        {!loading && error && (
          <div className="alert alert-danger" style={{ margin: '0 24px 20px' }}>
            Error: {error}
          </div>
        )}

        {!loading && !error && (
          <div className="table-container">
            {records.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Contact</th>
                    <th>Reason</th>
                    <th>Deleted On</th>
                    <th>Status</th>
                    <th>Rejoined On</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map(record => (
                    <tr key={record._id}>
                      <td>
                        <div style={{ fontWeight: '600' }}>{record.name || '—'}</div>
                        <div style={{ fontSize: '12px', color: '#48546b' }}>
                          {record.companyName || record.chapterName || ''}
                        </div>
                      </td>
                      <td>
                        <div>{record.email || '—'}</div>
                        <div style={{ fontSize: '12px', color: '#48546b' }}>
                          {record.mobile || ''}
                        </div>
                      </td>
                      <td style={{ maxWidth: '260px', whiteSpace: 'pre-wrap' }}>
                        {record.deletionReason || '—'}
                      </td>
                      <td>{formatDate(record.deletedAt)}</td>
                      <td>
                        <span className={`status-badge ${record.status}`}>
                          {record.status === 'rejoined' ? (
                            <>
                              <RotateCcw size={12} style={{ marginRight: '2px' }} />
                              Rejoined
                            </>
                          ) : (
                            <>
                              <UserX size={12} style={{ marginRight: '2px' }} />
                              Deleted
                            </>
                          )}
                        </span>
                      </td>
                      <td>{record.status === 'rejoined' ? formatDate(record.rejoinedAt) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <AlertCircle size={40} color="#8a95ab" />
                <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '16px 0 8px' }}>
                  No deleted accounts found
                </h3>
                <p style={{ color: '#48546b' }}>
                  {search || statusFilter !== 'all'
                    ? 'No records match your current filters.'
                    : 'Nobody has deleted their account yet.'}
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
    </div>
  );
};

export default DeletedRecords;
