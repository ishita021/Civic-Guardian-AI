import { Link, useNavigate } from 'react-router-dom';
import { Shield, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
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
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950 px-4 py-4 flex flex-col gap-3 animate-fade-in">
          <Link to="/#features"     className="text-sm text-slate-400 py-2" onClick={() => setOpen(false)}>Features</Link>
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
