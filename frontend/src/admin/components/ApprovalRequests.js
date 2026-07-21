import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { ChevronRight, X, CheckCircle, XCircle } from 'lucide-react';
import UserDetailModal from './UserDetailModal';

const ApprovalRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 0 });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchPendingRequests();
  }, [page]);

  // DEBUG: Monitor state changes
  useEffect(() => {
    console.log('🔄 Component re-rendered!');
    console.log('   loading:', loading);
    console.log('   requests.length:', requests.length);
    console.log('   requests:', requests);
    console.log('   Will show:', requests.length > 0 ? 'TABLE' : 'EMPTY STATE');
  }, [requests, loading]);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const token = Cookies.get('adminAccessToken');
      
      const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/admin/members?status=pending&page=${page}&limit=10`;
      console.log('📤 Fetching from:', apiUrl);
      console.log('🔑 Token exists:', !!token);

      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('✅ API Response:', response.status);
      console.log('📊 Response data:', response.data);
      console.log('📋 Members count:', response.data.data?.length);
      console.log('🔢 Pagination:', response.data.pagination);

      if (response.data.success) {
        console.log('✅ Setting requests state with:', response.data.data);
        console.log('📦 Array length before set:', response.data.data.length);
        
        setRequests(response.data.data);
        setPagination(response.data.pagination);
        
        // Verify state was set
        setTimeout(() => {
          console.log('🔍 Checking state after set to verify it worked');
        }, 100);
      } else {
        console.warn('⚠️  Response success is false');
        setRequests([]);
      }
    } catch (error) {
      console.error('❌ Failed to fetch requests:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
      setRequests([]);
    } finally {
      setLoading(false);
      console.log('✅ fetchPendingRequests completed, loading set to false');
    }
  };

  const handleApprove = async (userId) => {
    try {
      setActionLoading(true);
      const token = Cookies.get('adminAccessToken');

      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/admin/approve/${userId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        // Show success message
        alert('User approved successfully! Email sent to user.');
        setSelectedUser(null);
        fetchPendingRequests();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to approve user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (userId, reason) => {
    try {
      setActionLoading(true);
      const token = Cookies.get('adminAccessToken');

      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/admin/reject/${userId}`,
        { reason },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) { 
        alert('User rejected successfully! Email sent to user.');
        setSelectedUser(null);
        fetchPendingRequests();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to reject user');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && requests.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div className="loading" style={{ fontSize: '40px', display: 'inline-block' }}>
          ⏳
        </div>
        <p style={{ marginTop: '16px', color: '#48546b' }}>Loading requests...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Requests Table */}
      <div className="card">
        {/* DEBUG INFO */}
        <div style={{ fontSize: '11px', color: '#8792a6', padding: '8px 12px', borderBottom: '1px solid #e3ddcd', backgroundColor: '#f1ede2' }}>
          DEBUG: requests.length={requests.length} | loading={loading} | pages={pagination.pages}
        </div>

        {requests.length > 0 ? (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Company</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr
                      key={request._id}
                      onClick={() => setSelectedUser(request)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ fontWeight: '600' }}>{request.name}</td>
                      <td>{request.email}</td>
                      <td>{request.companyName}</td>
                      <td style={{ fontSize: '12px', color: '#48546b' }}>
                        {new Date(request.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUser(request);
                          }}
                          className="btn btn-sm btn-primary"
                          style={{ whiteSpace: 'nowrap' }}
                        >
                          <ChevronRight size={16} />
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div
                style={{
                  marginTop: '24px',
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '12px',
                }}
              >
                <button
                  className="btn btn-secondary"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  Previous
                </button>
                <span style={{ alignSelf: 'center', color: '#48546b' }}>
                  Page {page} of {pagination.pages}
                </span>
                <button
                  className="btn btn-secondary"
                  onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                  disabled={page === pagination.pages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
              All Caught Up!
            </h3>
            <p style={{ color: '#48546b' }}>
              There are no pending approval requests at the moment.
            </p>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onApprove={() => handleApprove(selectedUser._id)}
          onReject={(reason) => handleReject(selectedUser._id, reason)}
          isLoading={actionLoading}
        />
      )}
    </div>
  );
};

export default ApprovalRequests;
