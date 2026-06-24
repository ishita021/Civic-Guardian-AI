import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Brain, MapPin, User, ThumbsUp, CheckCircle2, Clock, Building2 } from 'lucide-react';
import { issuesApi } from '../../api/issuesApi';
import { StatusBadge, PriorityBadge } from '../../components/shared/StatusBadge';
import { PageSpinner } from '../../components/shared/Spinner';
import toast from 'react-hot-toast';

export default function IssueDetailPage() {
  const { id }           = useParams();
  const [issue, setIssue]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [upvoting, setUpvoting] = useState(false);

  useEffect(() => {
    issuesApi.getOne(id)
      .then(r  => setIssue(r.data.data.issue))
      .catch(() => toast.error('Failed to load issue.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpvote = async () => {
    setUpvoting(true);
    try {
      const r = await issuesApi.upvote(id);
      setIssue(prev => ({ ...prev, upvoteCount: r.data.data.upvoteCount }));
    } catch { toast.error('Upvote failed.'); }
    finally { setUpvoting(false); }
  };

  if (loading) return <PageSpinner />;
  if (!issue)  return <div className="card text-center py-16 text-slate-400">Issue not found.</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Back */}
      <Link to="/issues" className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to issues
      </Link>

      {/* Header card */}
      <div className="card">
        <div className="flex flex-wrap gap-2 mb-4">
          <StatusBadge status={issue.status} />
          <PriorityBadge priority={issue.aiPriority || issue.priority} />
          <span className="badge-slate">{issue.category?.replace('_', ' ')}</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-100 mb-3">{issue.title}</h1>
        <p className="text-slate-400 leading-relaxed mb-5">{issue.description}</p>

        {/* Meta */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2 text-slate-400">
            <User className="w-4 h-4 text-slate-600" />
            <span>{issue.createdBy?.name || 'Unknown'}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <MapPin className="w-4 h-4 text-slate-600" />
            <span>{issue.location?.address || issue.location?.city || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Clock className="w-4 h-4 text-slate-600" />
            <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* AI Analysis card */}
      {issue.aiCategory && (
        <div className="card border-blue-800/40 bg-blue-950/20">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-blue-400" />
            <h2 className="font-bold text-slate-100">Gemini AI Analysis</h2>
            <span className="badge-blue ml-auto">{issue.aiConfidence}% confidence</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500 text-xs mb-1">Detected Category</p>
              <p className="text-slate-200 font-medium">{issue.aiCategory}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs mb-1">AI Priority</p>
              <PriorityBadge priority={issue.aiPriority} />
            </div>
            <div>
              <p className="text-slate-500 text-xs mb-1 flex items-center gap-1"><Building2 className="w-3 h-3" /> Department</p>
              <p className="text-slate-200 font-medium">{issue.aiDepartment}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs mb-1">Suggested Resolution</p>
              <p className="text-slate-300 text-xs leading-relaxed">{issue.aiSuggestion}</p>
            </div>
          </div>
          {issue.aiTags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {issue.aiTags.map(tag => <span key={tag} className="badge-slate text-xs">{tag}</span>)}
            </div>
          )}
        </div>
      )}

      {/* Image */}
      {issue.imageUrl && (
        <div className="card overflow-hidden p-0">
          <img src={issue.imageUrl} alt={issue.title} className="w-full h-64 object-cover rounded-2xl" />
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <button onClick={handleUpvote} disabled={upvoting} className="btn-secondary gap-2">
          <ThumbsUp className="w-4 h-4" /> Upvote ({issue.upvoteCount})
        </button>
        <Link to={`/issues/${id}/verify`} className="btn-primary gap-2">
          <CheckCircle2 className="w-4 h-4" /> Verify This Issue
        </Link>
      </div>

      {/* Status History */}
      {issue.statusHistory?.length > 0 && (
        <div className="card">
          <h2 className="font-bold text-slate-100 mb-4">Status History</h2>
          <div className="space-y-3">
            {issue.statusHistory.map((h, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 shrink-0" />
                <div>
                  <StatusBadge status={h.status} />
                  {h.note && <p className="text-slate-500 text-xs mt-1">{h.note}</p>}
                  <p className="text-slate-600 text-xs mt-0.5">{new Date(h.changedAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
