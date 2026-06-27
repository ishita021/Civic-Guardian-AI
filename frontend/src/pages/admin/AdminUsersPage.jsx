import { useState, useEffect, useCallback } from 'react';
import {
  Search, RefreshCw, AlertCircle, Users,
  ChevronLeft, ChevronRight, ArrowUpDown,
  Trash2, Shield, ShieldOff, UserCog,
} from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import LoadingSkeleton from '../../components/admin/LoadingSkeleton';
import ConfirmDialog   from '../../components/admin/ConfirmDialog';
import ErrorBoundary   from '../../components/admin/ErrorBoundary';

const ROLES = ['citizen', 'moderator', 'admin'];

const ROLE_COLORS = {
  admin:     'badge-red',
  moderator: 'badge-blue',
  citizen:   'badge-slate',
};

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60)    return `${Math.floor(diff)}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(date).toLocaleDateString();
}

export default function AdminUsersPage() {
  const [users,   setUsers]   = useState([]);
  const [meta,    setMeta]    = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [role,   setRole]   = useState('');
  const [sort,   setSort]   = useState('-createdAt');
  const [page,   setPage]   = useState(1);

  // Modals
  const [deactivateTarget,  setDeactivateTarget]  = useState(null);
  const [deactivateLoading, setDeactivateLoading] = useState(false);
  const [roleTarget,        setRoleTarget]        = useState(null);
  const [newRole,           setNewRole]           = useState('');
  const [roleLoading,       setRoleLoading]       = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getUsers({
        page, limit: 15,
        search:   search || undefined,
        role:     role   || undefined,
        sort,
      });
      setUsers(res.data.data.users);
      setMeta(res.data.meta);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [page, search, role, sort]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { setPage(1); }, [search, role, sort]);

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    try {
      setDeactivateLoading(true);
      await adminApi.deleteUser(deactivateTarget._id);
      setDeactivateTarget(null);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Deactivation failed.');
    } finally {
      setDeactivateLoading(false);
    }
  };

  const handleRoleChange = async () => {
    if (!roleTarget || !newRole) return;
    try {
      setRoleLoading(true);
      await adminApi.updateUser(roleTarget._id, { role: newRole });
      setRoleTarget(null);
      setNewRole('');
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Role update failed.');
    } finally {
      setRoleLoading(false);
    }
  };

  const toggleSort = (field) =>
    setSort((prev) => (prev === `-${field}` ? field : `-${field}`));

  return (
    <ErrorBoundary>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" /> Manage Users
            </h1>
            <p className="page-subtitle">{meta.total} registered users</p>
          </div>
          <button onClick={fetchUsers} className="btn-secondary text-xs py-1.5 px-3 gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="card !p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              className="input pl-9 py-2 text-sm"
              placeholder="Search by name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            value={role}
            onChange={e => setRole(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Role: All</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-900/20 border border-red-700/40 rounded-xl text-red-400">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Table */}
        <div className="card !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/50">
                  {[
                    { label: 'User',          field: 'name'        },
                    { label: 'Role',          field: 'role'        },
                    { label: 'Civic Score',   field: 'civicScore'  },
                    { label: 'Issues',        field: 'issuesReported' },
                    { label: 'Status',        field: null          },
                    { label: 'Joined',        field: 'createdAt'   },
                    { label: 'Actions',       field: null          },
                  ].map(({ label, field }) => (
                    <th
                      key={label}
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider"
                    >
                      {field ? (
                        <button
                          onClick={() => toggleSort(field)}
                          className="flex items-center gap-1 hover:text-slate-200 transition-colors"
                        >
                          {label} <ArrowUpDown className="w-3 h-3" />
                        </button>
                      ) : label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {loading ? (
                  <LoadingSkeleton rows={10} cols={7} />
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-slate-500">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {u.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-slate-100 font-medium truncate">{u.name}</p>
                            <p className="text-xs text-slate-500 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={ROLE_COLORS[u.role] || 'badge-slate'}>{u.role}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-300 font-semibold">{u.civicScore}</td>
                      <td className="px-4 py-3 text-slate-300">{u.issuesReported}</td>
                      <td className="px-4 py-3">
                        <span className={u.isActive !== false ? 'badge-green' : 'badge-red'}>
                          {u.isActive !== false ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {timeAgo(u.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Change Role */}
                          <button
                            onClick={() => { setRoleTarget(u); setNewRole(u.role); }}
                            title="Change Role"
                            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-900/30 rounded-lg transition-all"
                          >
                            <UserCog className="w-3.5 h-3.5" />
                          </button>
                          {/* Deactivate */}
                          {u.isActive !== false && (
                            <button
                              onClick={() => setDeactivateTarget(u)}
                              title="Deactivate User"
                              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-900/30 rounded-lg transition-all"
                            >
                              <ShieldOff className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 bg-slate-900/50">
              <p className="text-xs text-slate-500">
                Page {meta.page} of {meta.pages} ({meta.total} total)
              </p>
              <div className="flex items-center gap-2">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-secondary py-1 px-2 text-xs disabled:opacity-40">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button disabled={page >= meta.pages} onClick={() => setPage(p => p + 1)} className="btn-secondary py-1 px-2 text-xs disabled:opacity-40">
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Deactivate Confirm ───────────────────────────────────────────── */}
        <ConfirmDialog
          open={!!deactivateTarget}
          title="Deactivate User"
          message={`Deactivate account for "${deactivateTarget?.name}"? They won't be able to log in.`}
          confirmLabel="Deactivate"
          danger
          loading={deactivateLoading}
          onConfirm={handleDeactivate}
          onCancel={() => setDeactivateTarget(null)}
        />

        {/* ── Role Change Modal ────────────────────────────────────────────── */}
        {roleTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setRoleTarget(null)} />
            <div className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-sm p-6">
              <h3 className="text-base font-semibold text-slate-100 mb-1">Change Role</h3>
              <p className="text-sm text-slate-400 mb-4">{roleTarget.name}</p>
              <select
                value={newRole}
                onChange={e => setNewRole(e.target.value)}
                className="input mb-4"
              >
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setRoleTarget(null)} className="btn-secondary text-sm py-2 px-4">Cancel</button>
                <button onClick={handleRoleChange} disabled={roleLoading} className="btn-primary text-sm py-2 px-4">
                  {roleLoading ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
