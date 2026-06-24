import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, Shield, Loader2, Users, TrendingUp } from 'lucide-react';
import { verificationsApi } from '../../api/verificationsApi';
import { issuesApi } from '../../api/issuesApi';
import { PageSpinner } from '../../components/shared/Spinner';
import { StatusBadge } from '../../components/shared/StatusBadge';
import toast from 'react-hot-toast';
import clsx from 'clsx';

// ── Confidence meter ──────────────────────────────────────────
function ConfidenceMeter({ value }) {
  const color = value >= 70 ? 'bg-green-500' : value >= 40 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-slate-400">Community Confidence</span>
        <span className="text-sm font-bold text-slate-100">{value}%</span>
      </div>
      <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function VerificationsPage() {
  const { id }                   = useParams();
  const [issue, setIssue]         = useState(null);
  const [data,  setData]          = useState(null);
  const [myVote, setMyVote]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [comment, setComment]     = useState('');

  const fetchAll = async () => {
    try {
      const [issueRes, votesRes, myRes] = await Promise.all([
        issuesApi.getOne(id),
        verificationsApi.getVotes(id),
        verificationsApi.getMyVote(id),
      ]);
      setIssue(issueRes.data.data.issue);
      setData(votesRes.data.data);
      setMyVote(myRes.data.data.vote);
    } catch {
      toast.error('Failed to load verification data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [id]);

  const castVote = async (vote) => {
    setSubmitting(true);
    try {
      await verificationsApi.castVote(id, { vote, comment });
      toast.success(vote === 'verify' ? '✅ Issue verified!' : '❌ Issue rejected.');
      setComment('');
      await fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Vote failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const retract = async () => {
    setSubmitting(true);
    try {
      await verificationsApi.retract(id);
      toast.success('Vote retracted.');
      setMyVote(null);
      await fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not retract vote.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageSpinner />;

  const stats = data?.stats || {};

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <Link to={`/issues/${id}`} className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to issue
      </Link>

      {/* Issue summary */}
      {issue && (
        <div className="card">
          <div className="flex items-start gap-3">
            <Shield className="w-6 h-6 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="font-bold text-slate-100">{issue.title}</h1>
                <StatusBadge status={issue.status} />
              </div>
              <p className="text-sm text-slate-400">{issue.location?.address || issue.location?.city}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Users,      label: 'Total Votes', value: stats.totalVotes  || 0 },
          { icon: CheckCircle2,label: 'Verified',   value: stats.verifyCount || 0, color: 'text-green-400' },
          { icon: XCircle,    label: 'Rejected',    value: stats.rejectCount || 0, color: 'text-red-400'   },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card text-center py-4">
            <Icon className={clsx('w-6 h-6 mx-auto mb-1', color || 'text-slate-400')} />
            <p className="text-xl font-bold text-slate-100">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Confidence meter */}
      <div className="card">
        <ConfidenceMeter value={stats.confidence || 0} />
        <p className="text-xs text-slate-600 mt-3">Auto-verifies when ≥3 votes & ≥60% confidence</p>
      </div>

      {/* Vote form */}
      {myVote ? (
        <div className="card border-blue-800/40 bg-blue-950/20">
          <div className="flex items-center gap-3 mb-4">
            {myVote.vote === 'verify'
              ? <CheckCircle2 className="w-6 h-6 text-green-400" />
              : <XCircle     className="w-6 h-6 text-red-400" />}
            <div>
              <p className="font-semibold text-slate-100">
                You voted: <span className={myVote.vote === 'verify' ? 'text-green-400' : 'text-red-400'}>{myVote.vote}</span>
              </p>
              <p className="text-xs text-slate-500">{new Date(myVote.createdAt).toLocaleString()}</p>
            </div>
          </div>
          {myVote.comment && <p className="text-sm text-slate-400 italic mb-4">"{myVote.comment}"</p>}
          <button onClick={retract} disabled={submitting} className="btn-ghost text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 px-3 py-1.5">
            Retract vote (within 10 minutes)
          </button>
        </div>
      ) : (
        <div className="card">
          <h2 className="font-bold text-slate-100 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" /> Cast Your Vote
          </h2>
          <textarea
            className="input resize-none mb-4"
            rows={2}
            placeholder="Optional comment (max 300 chars)..."
            value={comment}
            onChange={e => setComment(e.target.value.slice(0, 300))}
          />
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => castVote('verify')}
              disabled={submitting}
              className="btn bg-green-700 hover:bg-green-600 text-white focus:ring-green-500 py-3"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              Verify Issue
            </button>
            <button
              onClick={() => castVote('reject')}
              disabled={submitting}
              className="btn bg-red-800/60 hover:bg-red-700/60 text-red-300 border border-red-700/50 focus:ring-red-500 py-3"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-5 h-5" />}
              Reject Issue
            </button>
          </div>
        </div>
      )}

      {/* Vote list */}
      {data?.votes?.length > 0 && (
        <div className="card">
          <h2 className="font-bold text-slate-100 mb-4">Community Votes ({data.votes.length})</h2>
          <div className="space-y-3">
            {data.votes.map((v, i) => (
              <div key={i} className="flex items-start gap-3 pb-3 border-b border-slate-800 last:border-0">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0">
                  {v.userId?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-300">{v.userId?.name || 'Anonymous'}</span>
                    <span className={clsx('text-xs font-bold', v.vote === 'verify' ? 'text-green-400' : 'text-red-400')}>
                      {v.vote === 'verify' ? '✓ Verified' : '✗ Rejected'}
                    </span>
                  </div>
                  {v.comment && <p className="text-xs text-slate-500 mt-0.5 italic">"{v.comment}"</p>}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-600">{new Date(v.createdAt).toLocaleDateString()}</span>
                    <span className="badge-slate text-xs py-0.5">Trust: {v.voterTrustScore}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
