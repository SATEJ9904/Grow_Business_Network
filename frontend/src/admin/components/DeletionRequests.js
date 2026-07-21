import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { CheckCircle, XCircle, AlertTriangle, Trash2 } from 'lucide-react';

const DeletionRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionUser, setActionUser] = useState(null); // User for approve/reject modal
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    fetchDeletionRequests();
  }, []);

  const fetchDeletionRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = Cookies.get('adminAccessToken');
      const response = await axios.get(`${API_BASE_URL}/member/request-deletion`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setRequests(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch requests.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred.');
      console.error('Fetch Deletion Requests Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClick = (user) => {
    setActionUser(user);
    setIsApproveModalOpen(true);
  };

const handleConfirmApprove = async () => {
  console.log('Approving deletion for user:', actionUser);

  if (!actionUser) return;

  setIsSubmitting(true);

  try {
    await axios.delete(
      `${API_BASE_URL}/member/delete-account`,
      {
        data: {
          email: actionUser.email,
          mobile: actionUser.mobile,
        },
      }
    );

    alert('Account permanently deleted.');
    fetchDeletionRequests();
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to delete account.');
    console.error('Approve Deletion Error:', err);
  } finally {
    setIsSubmitting(false);
    setIsApproveModalOpen(false);
    setActionUser(null);
  }
};

  // A simple reject function to remove the request flag (can be expanded later)
  const handleReject = async (user) => {
    // This would typically involve an API call to update the user's `deletionRequest` status.
    // For now, we'll just show an alert and refresh.
    alert(`Request for ${user.name} has been rejected (UI only).`);
    // In a real scenario, you would make an API call here.
    // e.g., await axios.post(`${API_BASE_URL}/member/reject-deletion/${user._id}`, ...);
    fetchDeletionRequests();
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div className="loading" style={{ fontSize: '40px', display: 'inline-block' }}>⏳</div>
        <p style={{ marginTop: '16px', color: '#48546b' }}>Loading Deletion Requests...</p>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger">Error: {error}</div>;
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Account Deletion Requests</h2>
          <p className="card-subtitle">Review and process user requests to permanently delete their accounts.</p>
        </div>
        <div className="table-container">
          {requests.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Contact</th>
                  <th>Reason for Deletion</th>
                  <th>Requested On</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req._id}>
                    <td>
                      <div style={{ fontWeight: '600' }}>{req.name}</div>
                      <div style={{ fontSize: '12px', color: '#48546b' }}>{req.companyName}</div>
                    </td>
                    <td>
                      <div>{req.email}</div>
                      <div style={{ fontSize: '12px', color: '#48546b' }}>{req.mobile}</div>
                    </td>
                    <td style={{ maxWidth: '300px', whiteSpace: 'pre-wrap' }}>{req.deletionRequest.reason}</td>
                    <td>{new Date(req.deletionRequest.requestedAt).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-sm btn-success" onClick={() => handleApproveClick(req)}>
                          <CheckCircle size={16} /> Approve
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleReject(req)}>
                          <XCircle size={16} /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>All Clear!</h3>
              <p style={{ color: '#48546b' }}>There are no pending account deletion requests.</p>
            </div>
          )}
        </div>
      </div>

      {isApproveModalOpen && actionUser && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertTriangle size={24} color="#b8874a" />
                Confirm Account Deletion
              </h2>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to <strong>permanently delete</strong> the account for{' '}
                <strong>{actionUser.name}</strong> ({actionUser.email})?
              </p>
              <p style={{ marginTop: '16px', color: '#b3432b', fontWeight: '600' }}>
                This action is irreversible and all user data will be lost.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsApproveModalOpen(false)} disabled={isSubmitting}>
                No, Cancel
              </button>
              <button className="btn btn-danger" onClick={handleConfirmApprove} disabled={isSubmitting}>
                {isSubmitting ? 'Deleting...' : <><Trash2 size={16} /> Yes, Delete Account</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeletionRequests;