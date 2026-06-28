import { Bell, Filter, Plus, Search, X } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

const STATUSES = ['', 'pending', 'verified', 'in_progress', 'resolved', 'rejected', 'closed'];
const CATEGORIES = ['', 'pothole', 'garbage', 'water_leakage', 'broken_street_light', 'drainage', 'road_damage', 'encroachment', 'park_maintenance', 'noise_pollution', 'air_pollution', 'other'];
const PRIORITIES = ['', 'low', 'medium', 'high', 'urgent'];

const labelize = (value, fallback) => value ? value.replace(/_/g, ' ') : fallback;

export default function TopBar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [query, setQuery] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [priority, setPriority] = useState(searchParams.get('priority') || '');

  useEffect(() => {
    setQuery(searchParams.get('search') || '');
    setStatus(searchParams.get('status') || '');
    setCategory(searchParams.get('category') || '');
    setPriority(searchParams.get('priority') || '');
  }, [searchParams]);

  const submitSearch = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('search', query.trim());
    if (status) params.set('status', status);
    if (category) params.set('category', category);
    if (priority) params.set('priority', priority);
    navigate(`/issues${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const clearSearch = () => {
    setQuery('');
    setStatus('');
    setCategory('');
    setPriority('');
    navigate('/issues');
  };

  return (
    <header className="min-h-14 bg-slate-900/50 border-b border-slate-800 flex flex-col xl:flex-row xl:items-center gap-3 px-4 py-3 xl:px-6">
      <div className="min-w-40">
        <p className="text-xs text-slate-500">Welcome back,</p>
        <p className="text-sm font-semibold text-slate-100">{user?.name}</p>
      </div>
      <form onSubmit={submitSearch} className="relative flex-1 w-full max-w-3xl">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              className="input h-10 pl-9 pr-10 py-2 rounded-lg"
              placeholder="Search registered issues"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            {(query || status || category || priority) && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-200"
                aria-label="Clear issue search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((value) => !value)}
            className="btn-secondary h-10 px-3 rounded-lg"
            aria-label="Toggle issue filters"
          >
            <Filter className="w-4 h-4" />
          </button>
          <button type="submit" className="btn-primary h-10 px-4 rounded-lg">
            Search
          </button>
        </div>
        {showFilters && (
          <div className="absolute z-20 mt-2 grid w-full gap-2 rounded-xl border border-slate-800 bg-slate-900 p-3 shadow-xl shadow-black/30 sm:grid-cols-3">
            <select className="input py-2 cursor-pointer rounded-lg" value={status} onChange={(event) => setStatus(event.target.value)}>
              {STATUSES.map((item) => <option key={item} value={item}>{labelize(item, 'All statuses')}</option>)}
            </select>
            <select className="input py-2 cursor-pointer rounded-lg" value={category} onChange={(event) => setCategory(event.target.value)}>
              {CATEGORIES.map((item) => <option key={item} value={item}>{labelize(item, 'All categories')}</option>)}
            </select>
            <select className="input py-2 cursor-pointer rounded-lg" value={priority} onChange={(event) => setPriority(event.target.value)}>
              {PRIORITIES.map((item) => <option key={item} value={item}>{labelize(item, 'All priorities')}</option>)}
            </select>
          </div>
        )}
      </form>
      <div className="flex items-center gap-3 self-end xl:self-auto">
        <Link to="/issues/report" className="btn-primary py-1.5 px-3 text-xs gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Report Issue
        </Link>
        <button className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full" />
        </button>
      </div>
    </header>
  );
}
