import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Users, CheckCircle, Clock, XCircle } from 'lucide-react';

const COLORS = {
  ink: '#0a1628',
  inkLight: '#101f38',
  brass: '#c6a15b',
  brassSoft: '#e3c98a',
  emerald: '#2f6f5e',
  emeraldLight: '#3d8a76',
  slate: '#48546b',
  slateSoft: '#8792a6',
  danger: '#b3432b',
  border: '#e3ddcd',
};

const tooltipStyle = {
  contentStyle: {
    background: '#fbf9f4',
    border: `1px solid ${COLORS.border}`,
    borderRadius: '8px',
    boxShadow: '0 8px 24px rgba(10, 22, 40, 0.12)',
    padding: '10px 12px',
    fontFamily: "'Inter', sans-serif",
  },
  labelStyle: { color: COLORS.ink, fontWeight: '600', fontSize: '12px' },
};

const DashboardHome = () => {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = Cookies.get('adminAccessToken');

      const statsResponse = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/admin/dashboard-stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const activitiesResponse = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/admin/recent-activities?limit=5`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (statsResponse.data.success) {
        setStats(statsResponse.data.data);
      }

      if (activitiesResponse.data.success) {
        setActivities(activitiesResponse.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div className="loading" style={{ fontSize: '40px', display: 'inline-block' }}>
          ⏳
        </div>
        <p style={{ marginTop: '16px', color: COLORS.slate }}>Loading dashboard...</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Members',
      value: stats?.totalMembers || 0,
      icon: <Users size={28} />,
      color: 'primary',
    },
    {
      title: 'Approved',
      value: stats?.approvedMembers || 0,
      icon: <CheckCircle size={28} />,
      color: 'success',
    },
    {
      title: 'Pending',
      value: stats?.pendingMembers || 0,
      icon: <Clock size={28} />,
      color: 'warning',
    },
    {
      title: 'Rejected',
      value: stats?.rejectedMembers || 0,
      icon: <XCircle size={28} />,
      color: 'danger',
    },
  ];

  // Approval funnel
  const activityChartData = [
    { name: 'Approved', value: stats?.approvedMembers || 0, fill: COLORS.emerald },
    { name: 'Pending', value: stats?.pendingMembers || 0, fill: COLORS.brass },
    { name: 'Rejected', value: stats?.rejectedMembers || 0, fill: COLORS.danger },
  ];

  // Chapter health: prefer the new active/pending breakdown, fall back to the
  // legacy single-series membersByChapter shape if the API hasn't been
  // upgraded yet.
  const chapterHealth = stats?.chapterHealth;
  const legacyChapterData = stats?.membersByChapter || [];
  const hasChapterHealth = Array.isArray(chapterHealth) && chapterHealth.length > 0;
  const chapterChartData = hasChapterHealth
    ? chapterHealth.map((c) => ({ name: c._id, active: c.active, pending: c.pending }))
    : legacyChapterData.map((c) => ({ name: c._id, active: c.count }));

  const memberGrowth = Array.isArray(stats?.memberGrowth) ? stats.memberGrowth : [];
  const hasGrowthData = memberGrowth.some((m) => m.newMembers > 0);

  const categoryDistribution = Array.isArray(stats?.businessCategoryDistribution)
    ? stats.businessCategoryDistribution
    : [];
  const hasCategoryData = categoryDistribution.length > 0;

  return (
    <div>
      {/* Stat Cards */}
      <div className="grid grid-cols-4" style={{ marginBottom: '24px' }}>
        {statCards.map((card, index) => (
          <div key={index} className={`stat-card`}>
            <div className={`stat-card-icon ${card.color}`}>
              {card.icon}
            </div>
            <div className="stat-card-left">
              <div className="stat-card-label">{card.title}</div>
              <div className="stat-card-value">{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Member Growth Over Time */}
      {hasGrowthData && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <div>
              <h2 className="card-title">Member Growth</h2>
              <p className="card-subtitle">New registrations over the last 6 months</p>
            </div>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={memberGrowth} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.inkLight} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={COLORS.inkLight} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="0" stroke={COLORS.border} vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke={COLORS.slateSoft}
                  style={{ fontSize: '12px' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke={COLORS.slateSoft}
                  style={{ fontSize: '12px' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area
                  type="monotone"
                  dataKey="newMembers"
                  name="New Registrations"
                  stroke={COLORS.inkLight}
                  strokeWidth={2}
                  fill="url(#growthGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="approvedMembers"
                  name="Approved"
                  stroke={COLORS.emerald}
                  strokeWidth={2}
                  fill="none"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-2" style={{ marginBottom: '24px', gap: '16px' }}>
        {/* Chapter Health */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Chapter Health</h2>
              <p className="card-subtitle">
                {hasChapterHealth ? 'Active vs. pending members' : 'Approved members distribution'}
              </p>
            </div>
          </div>
          <div className="card-body">
            {chapterChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chapterChartData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="0" stroke={COLORS.border} vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke={COLORS.slateSoft}
                    style={{ fontSize: '12px' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    stroke={COLORS.slateSoft}
                    style={{ fontSize: '12px' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip {...tooltipStyle} />
                  {hasChapterHealth && <Legend wrapperStyle={{ fontSize: '12px' }} />}
                  <Bar
                    dataKey="active"
                    name="Active"
                    stackId="chapter"
                    fill={COLORS.inkLight}
                    radius={hasChapterHealth ? [0, 0, 0, 0] : [6, 6, 0, 0]}
                    isAnimationActive={true}
                  />
                  {hasChapterHealth && (
                    <Bar
                      dataKey="pending"
                      name="Pending"
                      stackId="chapter"
                      fill={COLORS.brass}
                      radius={[6, 6, 0, 0]}
                      isAnimationActive={true}
                    />
                  )}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ textAlign: 'center', color: COLORS.slateSoft, padding: '40px 0', fontSize: '13px' }}>
                No data available
              </p>
            )}
          </div>
        </div>

        {/* Approval Status Distribution */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Request Status</h2>
              <p className="card-subtitle">Distribution breakdown</p>
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={activityChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={2}
                  dataKey="value"
                  startAngle={90}
                  endAngle={450}
                >
                  {activityChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => value} {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            {/* Legend */}
            <div style={{ display: 'flex', gap: '16px', marginTop: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {activityChartData.map((item, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '2px',
                      backgroundColor: item.fill,
                    }}
                  ></div>
                  <span style={{ fontSize: '12px', color: COLORS.slate, fontWeight: '500' }}>
                    {item.name}: {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Business Category Distribution */}
      {hasCategoryData && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <div>
              <h2 className="card-title">Member Composition</h2>
              <p className="card-subtitle">Top business categories among approved members</p>
            </div>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={Math.max(220, categoryDistribution.length * 42)}>
              <BarChart
                data={categoryDistribution}
                layout="vertical"
                margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="0" stroke={COLORS.border} horizontal={false} />
                <XAxis
                  type="number"
                  stroke={COLORS.slateSoft}
                  style={{ fontSize: '12px' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="_id"
                  stroke={COLORS.slateSoft}
                  style={{ fontSize: '12px' }}
                  axisLine={false}
                  tickLine={false}
                  width={140}
                />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="count" name="Members" fill={COLORS.brass} radius={[0, 6, 6, 0]} isAnimationActive={true} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Registrations & Activities */}
      <div className="grid grid-cols-2" style={{ marginBottom: '0px', gap: '16px' }}>
        {/* Recent Registrations */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Recent Registrations</h2>
              <p className="card-subtitle">Latest member sign-ups</p>
            </div>
          </div>
          <div className="card-body">
            {stats && stats.recentRegistrations && stats.recentRegistrations.length > 0 ? (
              <div style={{}}>
                {stats.recentRegistrations.map((user) => (
                  <div
                    key={user._id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 0',
                      borderBottom: `1px solid ${COLORS.border}`,
                    }}
                  >
                    <div>
                      <p style={{ fontWeight: '600', fontSize: '14px', marginBottom: '2px' }}>
                        {user.name}
                      </p>
                      <p style={{ fontSize: '12px', color: COLORS.slate }}>
                        {user.email}
                      </p>
                    </div>
                    <span
                      className={`table-badge ${
                        user.status === 'pending'
                          ? 'badge-pending'
                          : user.status === 'approved'
                          ? 'badge-approved'
                          : 'badge-rejected'
                      }`}
                    >
                      {user.status?.charAt(0).toUpperCase() + user.status?.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: COLORS.slateSoft, padding: '40px 0' }}>
                No registrations yet
              </p>
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Recent Activities</h2>
              <p className="card-subtitle">Latest admin actions</p>
            </div>
          </div>
          <div className="card-body">
            {activities.length > 0 ? (
              <div>
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      padding: '12px 0',
                      borderBottom: `1px solid ${COLORS.border}`,
                    }}
                  >
                    <div style={{ fontSize: '18px' }}>{activity.icon}</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: '600', fontSize: '13px', marginBottom: '2px' }}>
                        {activity.description}
                      </p>
                      <p style={{ fontSize: '12px', color: COLORS.slateSoft }}>
                        {activity.timeAgo}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: COLORS.slateSoft, padding: '40px 0' }}>
                No activities yet
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
