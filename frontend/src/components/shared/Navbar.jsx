import { Link, useNavigate } from 'react-router-dom';
import { Filter, Menu, Search, Shield, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

const STATUSES = ['', 'pending', 'verified', 'in_progress', 'resolved', 'rejected', 'closed'];
const CATEGORIES = ['', 'pothole', 'garbage', 'water_leakage', 'broken_street_light', 'drainage', 'road_damage', 'encroachment', 'park_maintenance', 'noise_pollution', 'air_pollution', 'other'];

const formatOption = (value, fallback) => value ? value.replace(/_/g, ' ') : fallback;

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');

  const handleLogout = () => { logout(); navigate('/'); };
  const handleSearch = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (status) params.set('status', status);
    if (category) params.set('category', category);
    setOpen(false);
    navigate(`/issues${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex shrink-0 items-center gap-2.5 group">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/40 group-hover:shadow-blue-700/50 transition-all">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">
              <span className="gradient-text">Civic</span>
              <span className="text-slate-100"> Guardian</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/#features"    className="text-sm text-slate-400 hover:text-slate-100 transition-colors">Features</Link>
            <Link to="/#how-it-works"className="text-sm text-slate-400 hover:text-slate-100 transition-colors">How it Works</Link>
            <Link to="/#stats"       className="text-sm text-slate-400 hover:text-slate-100 transition-colors">Stats</Link>
          </div>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="btn-secondary text-sm py-2 px-4">Dashboard</Link>
                <button onClick={handleLogout} className="btn-ghost text-sm py-2 px-4">Sign out</button>
              </>
            ) : (
              <>
                <Link to="/login"    className="btn-ghost text-sm py-2 px-4">Sign in</Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-4">Get Started</Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden p-2 text-slate-400 hover:text-white" onClick={() => setOpen(!open)}>
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <form onSubmit={handleSearch} className="relative pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Link to="/issues" className="btn-secondary text-sm py-2 px-4 sm:mr-2">Issues Registered</Link>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                className="input h-10 rounded-lg py-2 pl-9 pr-3 w-full"
                placeholder="Search registered issues"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              <button
                type="button"
                className="btn-secondary h-10 rounded-lg px-3"
                onClick={() => setFiltersOpen((value) => !value)}
                aria-label="Filter issue search"
              >
                <Filter className="w-4 h-4" />
              </button>
              <button type="submit" className="btn-primary h-10 rounded-lg px-4">
                Search
              </button>
            </div>
          </div>
          {filtersOpen && (
            <div className="absolute left-0 right-0 top-full z-20 grid gap-2 rounded-xl border border-slate-800 bg-slate-900 p-3 shadow-xl shadow-black/30 sm:grid-cols-2">
              <select className="input rounded-lg py-2 capitalize" value={status} onChange={(event) => setStatus(event.target.value)}>
                {STATUSES.map((item) => <option key={item} value={item}>{formatOption(item, 'All statuses')}</option>)}
              </select>
              <select className="input rounded-lg py-2 capitalize" value={category} onChange={(event) => setCategory(event.target.value)}>
                {CATEGORIES.map((item) => <option key={item} value={item}>{formatOption(item, 'All categories')}</option>)}
              </select>
            </div>
          )}
        </form>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950 px-4 py-4 flex flex-col gap-3 animate-fade-in">          <Link to="/issues" className="btn-secondary" onClick={() => setOpen(false)}>Issues Registered</Link>          <Link to="/#features"     className="text-sm text-slate-400 py-2" onClick={() => setOpen(false)}>Features</Link>
          <Link to="/#how-it-works" className="text-sm text-slate-400 py-2" onClick={() => setOpen(false)}>How it Works</Link>
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="btn-secondary" onClick={() => setOpen(false)}>Dashboard</Link>
              <button onClick={() => { handleLogout(); setOpen(false); }} className="btn-ghost">Sign out</button>
            </>
          ) : (
            <>
              <Link to="/login"    className="btn-secondary" onClick={() => setOpen(false)}>Sign in</Link>
              <Link to="/register" className="btn-primary"   onClick={() => setOpen(false)}>Get Started</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
