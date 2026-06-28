import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MapPin, Plus, Search, Brain, ThumbsUp, RefreshCw } from 'lucide-react';
import { issuesApi } from '../../api/issuesApi';
import { StatusBadge, PriorityBadge } from '../../components/shared/StatusBadge';
import { PageSpinner } from '../../components/shared/Spinner';
import toast from 'react-hot-toast';

const STATUSES   = ['', 'pending', 'verified', 'in_progress', 'resolved', 'rejected'];
const CATEGORIES = ['', 'pothole', 'garbage', 'water_leakage', 'broken_street_light', 'drainage', 'road_damage', 'other'];
const PRIORITIES = ['', 'low', 'medium', 'high', 'urgent'];

const getFiltersFromParams = (searchParams) => ({
  status: searchParams.get('status') || '',
  category: searchParams.get('category') || '',
  priority: searchParams.get('priority') || '',
  search: searchParams.get('search') || '',
  page: Math.max(1, Number(searchParams.get('page')) || 1),
});

export default function IssuesPage() {
  const [issues,  setIssues]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [total,   setTotal]   = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = getFiltersFromParams(searchParams);

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.set('page', '1');
    setSearchParams(next);
  };

  const fetchIssues = useCallback(() => {
    setLoading(true);
    const params = { limit: 12, sort: '-createdAt', page: filters.page };
    if (filters.status)   params.status   = filters.status;
    if (filters.category) params.category = filters.category;
    if (filters.priority) params.priority = filters.priority;
    if (filters.search.trim()) params.search = filters.search.trim();

    issuesApi.getAll(params)
      .then(r => { setIssues(r.data.data.issues); setTotal(r.data.total); })
      .catch(() => toast.error('Failed to load issues.'))
      .finally(() => setLoading(false));
  }, [filters.status, filters.category, filters.priority, filters.search, filters.page]);

  useEffect(() => { fetchIssues(); }, [fetchIssues]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Civic Issues</h1>
          <p className="page-subtitle">{total} total issues in the community</p>
        </div>
        <Link to="/issues/report" className="btn-primary"><Plus className="w-4 h-4" /> Report Issue</Link>
      </div>

      {/* Filters */}
      <div className="card py-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input className="input pl-9 py-2" placeholder="Search issues..." value={filters.search} onChange={e => updateFilter('search', e.target.value)} />
          </div>
          <select className="input w-auto py-2 cursor-pointer" value={filters.status} onChange={e => updateFilter('status', e.target.value)}>
            {STATUSES.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
          </select>
          <select className="input w-auto py-2 cursor-pointer" value={filters.category} onChange={e => updateFilter('category', e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c ? c.replace('_', ' ') : 'All Categories'}</option>)}
          </select>
          <select className="input w-auto py-2 cursor-pointer" value={filters.priority} onChange={e => updateFilter('priority', e.target.value)}>
            {PRIORITIES.map(p => <option key={p} value={p}>{p || 'All Priorities'}</option>)}
          </select>
          <button onClick={fetchIssues} className="btn-secondary py-2 px-3"><RefreshCw className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Grid */}
      {loading ? <PageSpinner /> : (
        <>
          {issues.length === 0 ? (
            <div className="card text-center py-16">
              <MapPin className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No issues found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {issues.map(issue => (
                <Link key={issue._id} to={`/issues/${issue._id}`} className="card-hover block">
                  {/* Image */}
                  {issue.imageUrl && (
                    <div className="h-36 rounded-xl overflow-hidden mb-4 bg-slate-800">
                      <img src={issue.imageUrl} alt={issue.title} className="w-full h-full object-cover" />
                    </div>
                  )}

                  {/* Badges */}
                  <div className="flex gap-2 flex-wrap mb-3">
                    <StatusBadge status={issue.status} />
                    <PriorityBadge priority={issue.aiPriority || issue.priority} />
                  </div>

                  <h3 className="font-semibold text-slate-100 mb-1 line-clamp-2">{issue.title}</h3>
                  <p className="text-xs text-slate-500 mb-3 line-clamp-2">{issue.description}</p>

                  {/* AI tag */}
                  {issue.aiCategory && (
                    <div className="flex items-center gap-1.5 text-xs text-blue-400 mb-3">
                      <Brain className="w-3.5 h-3.5" />
                      <span>{issue.aiCategory}</span>
                      <span className="text-slate-600">·</span>
                      <span>{issue.aiConfidence}%</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{issue.location?.city || 'Unknown'}</span>
                    <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" />{issue.upvoteCount}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {total > 12 && (
            <div className="flex justify-center gap-3">
              <button disabled={filters.page === 1} onClick={() => updateFilter('page', String(filters.page - 1))} className="btn-secondary">Previous</button>
              <span className="flex items-center text-sm text-slate-400">Page {filters.page}</span>
              <button disabled={issues.length < 12} onClick={() => updateFilter('page', String(filters.page + 1))} className="btn-secondary">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
