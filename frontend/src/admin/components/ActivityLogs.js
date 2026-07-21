import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

const ActivityLogs = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 0 });
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchActivities();
  }, [page, filter]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const token = Cookies.get('adminAccessToken');

      console.log('📋 Fetching activities...');
      console.log('   Token present:', !!token);
      console.log('   URL:', `${process.env.REACT_APP_API_BASE_URL}/admin/activities?page=${page}&limit=20`);

      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/admin/activities?page=${page}&limit=20`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('✅ Activities response:', response.data);

      if (response.data.success) {
        setActivities(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('❌ Failed to fetch activities:', error.response?.status, error.response?.data || error.message);
      if (error.response?.status === 403) {
        console.error('   → Admin authorization failed. Check token and admin role.');
      }
      if (error.response?.status === 401) {
        console.error('   → Authentication failed. Token may be expired.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    const iconMap = {
      LOGIN: '🔓',
      LOGOUT: '🔒',
      APPROVE_REQUEST: '✅',
      REJECT_REQUEST: '❌',
      VIEW_DETAILS: '👁️',
      EXPORT_DATA: '📤',
      UPDATE_ADMIN: '⚙️',
      CREATE_CHAPTER: '📚',
      DELETE_ACCOUNT: '🗑️',
      SESSION_EXPIRED: '⏱️',
      FAILED_LOGIN: '⚠️',
    };
    return iconMap[type] || '📝';
  };

  const getActivityColor = (type) => {
    const colorMap = {
      LOGIN: { bg: 'rgba(47, 111, 94, 0.12)', text: '#2F6F5E' },
      LOGOUT: { bg: 'rgba(72, 84, 107, 0.12)', text: '#48546B' },
      APPROVE_REQUEST: { bg: 'rgba(19, 43, 77, 0.12)', text: '#132B4D' },
      REJECT_REQUEST: { bg: 'rgba(179, 67, 43, 0.12)', text: '#B3432B' },
      VIEW_DETAILS: { bg: 'rgba(28, 58, 99, 0.12)', text: '#1C3A63' },
      EXPORT_DATA: { bg: 'rgba(198, 161, 91, 0.18)', text: '#A8823F' },
      UPDATE_ADMIN: { bg: 'rgba(184, 135, 74, 0.18)', text: '#8A5A1F' },
      CREATE_CHAPTER: { bg: 'rgba(61, 138, 118, 0.15)', text: '#3D8A76' },
      DELETE_ACCOUNT: { bg: 'rgba(179, 67, 43, 0.12)', text: '#B3432B' },
      SESSION_EXPIRED: { bg: 'rgba(72, 84, 107, 0.12)', text: '#48546B' },
      FAILED_LOGIN: { bg: 'rgba(179, 67, 43, 0.12)', text: '#B3432B' },
    };
    return colorMap[type] || { bg: 'rgba(72, 84, 107, 0.12)', text: '#48546B' };
  };

  const formatTimestamp = (date) => {
    const now = new Date();
    const actDate = new Date(date);
    const diffMs = now - actDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return actDate.toLocaleDateString();
  };

  if (loading && activities.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div className="loading" style={{ fontSize: '40px', display: 'inline-block' }}>
          ⏳
        </div>
        <p style={{ marginTop: '16px', color: '#48546b' }}>Loading activities...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Activities Card */}
      <div className="card">
        {activities.length > 0 ? (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {activities.map((activity) => {
                const colors = getActivityColor(activity.activityType);
                return (
                  <div
                    key={activity._id}
                    style={{
                      display: 'flex',
                      gap: '16px',
                      padding: '16px',
                      borderBottom: '1px solid #e3ddcd',
                      alignItems: 'flex-start',
                    }}
                  >
                    {/* Icon */}
                    <div
                      style={{
                        fontSize: '24px',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: colors.bg,
                        borderRadius: '8px',
                        color: colors.text,
                        flexShrink: 0,
                      }}
                    >
                      {getActivityIcon(activity.activityType)}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                        <div>
                          <p style={{ fontWeight: '600', fontSize: '14px', marginBottom: '2px' }}>
                            {activity.description}
                          </p>
                          {activity.targetUserName && (
                            <p style={{ fontSize: '12px', color: '#48546b' }}>
                              👤 {activity.targetUserName}
                              {activity.targetCompany && (
                                <> • Company: {activity.targetCompany}</>
                              )}
                            </p>
                          )}
                        </div>
                        <span
                          style={{
                            fontSize: '12px',
                            color: '#8792a6',
                            whiteSpace: 'nowrap',
                            marginLeft: '16px',
                          }}
                        >
                          {formatTimestamp(activity.createdAt)}
                        </span>
                      </div>

                      {/* Activity Type Badge */}
                      <div style={{ marginTop: '8px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            fontSize: '11px',
                            fontWeight: '600',
                            padding: '4px 8px',
                            background: colors.bg,
                            color: colors.text,
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                          }}
                        >
                          {activity.activityType.replace(/_/g, ' ')}
                        </span>
                        {activity.status === 'failed' && (
                          <span
                            style={{
                              display: 'inline-block',
                              fontSize: '11px',
                              fontWeight: '600',
                              padding: '4px 8px',
                              marginLeft: '8px',
                              background: 'rgba(179, 67, 43, 0.12)',
                              color: '#B3432B',
                              borderRadius: '4px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                            }}
                          >
                            ❌ Failed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div
                style={{
                  marginTop: '24px',
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '12px',
                  paddingTop: '16px',
                  borderTop: '1px solid #e3ddcd',
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
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
              No Activities Yet
            </h3>
            <p style={{ color: '#48546b' }}>
              Activities will appear here as you perform actions in the admin panel.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLogs;
