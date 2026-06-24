import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, CheckCircle2, Clock, TrendingUp, Plus, ArrowRight, Brain, AlertTriangle } from 'lucide-react';
import { issuesApi } from '../../api/issuesApi';
import { useAuth } from '../../hooks/useAuth';
import { StatusBadge, PriorityBadge } from '../../components/shared/StatusBadge';
import { PageSpinner } from '../../components/shared/Spinner';
import toast from 'react-hot-toast';

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="card flex items-start gap-4">
      <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center shrink-0`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-slate-100">{value}</p>
        <p className="text-sm text-slate-400">{label}</p>
        {sub && <p className="text-xs text-slate-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user }             = useAuth();
  const [issues, setIssues]  = useState([]);
  const [loading, setLoading]= useState(true);

  useEffect(() => {
    issuesApi.getAll({ limit: 5, sort: '-createdAt' })
      .then(r => setIssues(r.data.data.issues))
      .catch(() => toast.error('Failed to load issues.'))
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { icon: MapPin,       label: 'Issues Reported',  value: user?.issuesReported ?? 0, color: 'bg-blue-600',   sub: 'by you' },
    { icon: CheckCircle2, label: 'Issues Verified',   value: user?.issuesVerified ?? 0, color: 'bg-green-600',  sub: 'community votes' },
    { icon: TrendingUp,   label: 'Civic Score',       value: user?.civicScore ?? 0,     color: 'bg-violet-600', sub: 'your contribution' },
    { icon: Brain,        label: 'Trust Score',       value: `${user?.trustScore ?? 0}%`, color: 'bg-cyan-600', sub: user?.trustLevel },
  ];

  if (loading) return <PageSpinner />;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Your civic activity at a glance</p>
        </div>
        <Link to="/issues/report" className="btn-primary">
          <Plus className="w-4 h-4" /> Report Issue
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* AI banner */}
      <div className="card border-blue-800/40 bg-gradient-to-r from-blue-950/60 to-cyan-950/40 flex items-center gap-4">
        <div className="w-10 h-10 bg-blue-600/30 rounded-xl flex items-center justify-center shrink-0">
          <Brain className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-blue-300">Gemini AI is active</p>
          <p className="text-xs text-slate-500">Every issue you report is automatically analyzed, categorized, and routed to the right department.</p>
        </div>
      </div>

      {/* Recent issues */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-100">Recent Issues</h2>
          <Link to="/issues" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {issues.length === 0 ? (
          <div className="card text-center py-12">
            <AlertTriangle className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No issues reported yet</p>
            <Link to="/issues/report" className="btn-primary mt-4 inline-flex">Report your first issue</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {issues.map(issue => (
              <Link key={issue._id} to={`/issues/${issue._id}`} className="card-hover flex items-start gap-4 block">
                <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-slate-100 truncate">{issue.title}</p>
                    <div className="flex gap-2 shrink-0">
                      <StatusBadge status={issue.status} />
                      <PriorityBadge priority={issue.aiPriority || issue.priority} />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 truncate">{issue.location?.address || issue.location?.city || 'Location not set'}</p>
                  {issue.aiCategory && (
                    <p className="text-xs text-blue-400 mt-1 flex items-center gap-1">
                      <Brain className="w-3 h-3" /> {issue.aiCategory} · {issue.aiConfidence}% confidence
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
