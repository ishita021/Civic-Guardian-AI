import { useEffect, useState, useCallback } from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  Shield,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  MapPin,
  UserCheck,
  Activity,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import StatCard from '../../components/admin/StatCard';
import ErrorBoundary from '../../components/admin/ErrorBoundary';

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_COLORS = {
  pending:     'badge-yellow',
  verified:    'badge-blue',
  in_progress: 'badge-cyan',
  resolved:    'badge-green',
  rejected:    'badge-red',
  closed:      'badge-slate',
};

const PRIORITY_COLORS = {
  low:    'badge-slate',
  medium: 'badge-blue',
  high:   'badge-orange',
  urgent: 'badge-red',
};

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60)    return `${Math.floor(diff)}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ── Analytics Mini Bar ────────────────────────────────────────────────────────

function BarChart({ data, label = '_id', value = 'count' }) {
  if (!data?.length) return <p className="text-slate-500 text-sm">No data</p>;
  const max = Math.max(...data.map((d) => d[value]));
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d[label]} className="flex items-center gap-3">
          <span className="text-xs text-slate-400 w-28 truncate capitalize">
            {d[label]?.replace(/_/g, ' ') || 'unknown'}
          </span>
          <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-700"
              style={{ width: `${(d[value] / max) * 100}%` }}
            />
          </div>
          <span className="text-xs text-slate-300 font-semibold w-6 text-right">{d[value]}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getDashboard();
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-800 rounded" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 bg-slate-900 border border-slate-800 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-900/20 border border-red-700/40 rounded-xl text-red-400">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  const { summary, analytics, topReporters, recentActivity } = data || {};

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-400" />
              Admin Dashboard
            </h1>
            <p className="page-subtitle">Platform-wide overview and analytics</p>
          </div>
          <button
            onClick={fetchDashboard}
            className="btn-secondary text-xs py-1.5 px-3 gap-1.5"
          >
            <Activity className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <StatCard label="Total Complaints" value={summary?.totalIssues}    icon={FileText}     color="blue"   />
          <StatCard label="Pending"           value={summary?.pendingIssues}  icon={Clock}        color="yellow" />
          <StatCard label="In Progress"       value={summary?.inProgressIssues} icon={TrendingUp} color="cyan"   />
          <StatCard label="Resolved"          value={summary?.resolvedIssues} icon={CheckCircle2} color="green"  />
          <StatCard label="Rejected"          value={summary?.rejectedIssues} icon={XCircle}      color="red"    />
          <StatCard label="Total Users"       value={summary?.totalUsers}     icon={Users}        color="purple" />
          <StatCard label="New This Week"     value={summary?.newUsersThisWeek} icon={UserCheck}  color="cyan"   sub="users joined" />
          <StatCard
            label="Resolution Rate"
            value={`${summary?.resolutionRate ?? 0}%`}
            icon={TrendingUp}
            color={summary?.resolutionRate >= 50 ? 'green' : 'orange'}
          />
        </div>

        {/* Analytics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Category Breakdown */}
          <div className="card">
            <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-400" /> By Category
            </h3>
            <BarChart data={analytics?.categoryBreakdown} />
          </div>

          {/* Status Breakdown */}
          <div className="card">
            <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" /> By Status
            </h3>
            <BarChart data={analytics?.statusBreakdown} />
          </div>

          {/* Priority Breakdown */}
          <div className="card">
            <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-400" /> By Priority
            </h3>
            <BarChart data={analytics?.priorityBreakdown} />
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top Reporters */}
          <div className="card">
            <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" /> Top Civic Contributors
            </h3>
            <div className="space-y-3">
              {topReporters?.map((user, idx) => (
                <div key={user._id} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 font-mono w-4">{idx + 1}</span>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {user.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-100 font-medium truncate">{user.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-blue-400">{user.civicScore}</p>
                    <p className="text-xs text-slate-500">score</p>
                  </div>
                </div>
              ))}
              {!topReporters?.length && <p className="text-slate-500 text-sm">No data</p>}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4 text-green-400" /> Recent Activity
              </h3>
              <Link to="/admin/complaints" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                View all →
              </Link>
            </div>
            <div className="space-y-3">
              {recentActivity?.map((issue) => (
                <div key={issue._id} className="flex items-start gap-3 py-2 border-b border-slate-800/50 last:border-0">
                  <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-100 truncate">{issue.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      by {issue.createdBy?.name || 'Unknown'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={STATUS_COLORS[issue.status] || 'badge-slate'}>
                      {issue.status?.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-slate-600">{timeAgo(issue.createdAt)}</span>
                  </div>
                </div>
              ))}
              {!recentActivity?.length && <p className="text-slate-500 text-sm">No recent activity</p>}
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
