import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { authApi } from '../../api/authApi';
import { User, Shield, TrendingUp, MapPin, CheckCircle2, Lock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, refreshUser }    = useAuth();
  const [loading, setLoading]    = useState(false);
  const [pwdForm, setPwdForm]    = useState({ currentPassword: '', newPassword: '' });

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwdForm.newPassword.length < 8) { toast.error('New password must be at least 8 chars.'); return; }
    setLoading(true);
    try {
      await authApi.updatePassword(pwdForm);
      toast.success('Password updated!');
      setPwdForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  const LEVEL_COLOR = { guardian: 'text-yellow-400', trusted: 'text-blue-400', active: 'text-cyan-400', newcomer: 'text-slate-400', unverified: 'text-slate-600' };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">Your civic identity and activity</p>
      </div>

      {/* Profile card */}
      <div className="card">
        <div className="flex items-center gap-5 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-blue-900/40">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">{user?.name}</h2>
            <p className="text-slate-400 text-sm">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="badge-blue capitalize">{user?.role}</span>
              <span className={`text-xs font-semibold capitalize ${LEVEL_COLOR[user?.trustLevel] || 'text-slate-400'}`}>
                ⬡ {user?.trustLevel}
              </span>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: MapPin,       label: 'Reported',   value: user?.issuesReported ?? 0,        color: 'text-blue-400'   },
            { icon: CheckCircle2, label: 'Verified',   value: user?.issuesVerified ?? 0,        color: 'text-green-400'  },
            { icon: TrendingUp,   label: 'Civic Score',value: user?.civicScore ?? 0,             color: 'text-violet-400' },
            { icon: Shield,       label: 'Trust',      value: `${user?.trustScore ?? 0}%`,       color: 'text-cyan-400'   },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-slate-800/60 rounded-xl p-4 text-center">
              <Icon className={`w-5 h-5 mx-auto mb-1.5 ${color}`} />
              <p className="text-lg font-bold text-slate-100">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Trust bar */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-400">Trust Score Progress</span>
            <span className="text-xs text-slate-400">{user?.trustScore ?? 0} / 100</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full transition-all duration-500" style={{ width: `${user?.trustScore ?? 0}%` }} />
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="card">
        <h2 className="font-bold text-slate-100 mb-5 flex items-center gap-2">
          <Lock className="w-5 h-5 text-slate-400" /> Change Password
        </h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="label">Current Password</label>
            <input type="password" className="input" placeholder="••••••••" value={pwdForm.currentPassword} onChange={e => setPwdForm(p => ({ ...p, currentPassword: e.target.value }))} />
          </div>
          <div>
            <label className="label">New Password</label>
            <input type="password" className="input" placeholder="Min 8 chars, 1 number" value={pwdForm.newPassword} onChange={e => setPwdForm(p => ({ ...p, newPassword: e.target.value }))} />
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
