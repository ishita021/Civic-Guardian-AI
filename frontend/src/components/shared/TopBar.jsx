import { Bell, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function TopBar() {
  const { user } = useAuth();

  return (
    <header className="h-14 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between px-6">
      <div>
        <p className="text-xs text-slate-500">Welcome back,</p>
        <p className="text-sm font-semibold text-slate-100">{user?.name}</p>
      </div>
      <div className="flex items-center gap-3">
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
