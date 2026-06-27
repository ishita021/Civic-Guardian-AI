import { useState, useEffect, useCallback } from 'react';
import {
  Search, Filter, ChevronLeft, ChevronRight,
  Trash2, UserCheck, RefreshCw, AlertCircle,
  ArrowUpDown, CheckCircle2, Clock, XCircle,
} from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import LoadingSkeleton from '../../components/admin/LoadingSkeleton';
import ConfirmDialog   from '../../components/admin/ConfirmDialog';
import ErrorBoundary   from '../../components/admin/ErrorBoundary';

// ── Constants ──────────────────────────────────────────────────────────────────

const STATUSES    = ['pending', 'verified', 'in_progress', 'resolved', 'rejected', 'closed'];
const CATEGORIES  = ['pothole','garbage','water_leakage','broken_street_light','drainage','road_damage','encroachment','park_maintenance','noise_pollution','air_pollution','other'];
const PRIORITIES  = ['low','medium','high','urgent'];
const SEVERITIES  = ['low','medium','high','critical'];

const STATUS_COLORS = {
  pending:     'badge-yellow',
  verified:    'badge-blue',
  in_progress: 'badge-cyan',
  resolved:    'badge-green',
  rejected:    'badge-red',
  closed:      'badge-slate',
};

const PRIORITY_COLORS = {
  low:    'badge-slate',
  medium: 'badge-blue',
  high:   'badge-orange',
  urgent: 'badge-red',
};

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60)    return `${Math.floor(diff)}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(date).toLocaleDateString();
}

// ── Status Badge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  return (
    <span className={STATUS_COLORS[status] || 'badge-slate'}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [meta,       setMeta]       = useState({ total: 0, page: 1, pages: 1 });
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  // Filters & pagination
  const [search,   setSearch]   = useState('');
  const [status,   setStatus]   = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [severity, setSeverity] = useState('');
  const [sort,     setSort]     = useState('-createdAt');
  const [page,     setPage]     = useState(1);

  // Modals
  const [deleteTarget,   setDeleteTarget]   = useState(null);
  const [deleteLoading,  setDeleteLoading]  = useState(false);
  const [statusTarget,   setStatusTarget]   = useState(null); // { id, currentStatus }
  const [newStatus,      setNewStatus]      = useState('');
  const [statusLoading,  setStatusLoading]  = useState(false);
  const [assignTarget,   setAssignTarget]   = useState(null);
  const [assigneeId,     setAssigneeId]     = useState('');
  const [assignLoading,  setAssignLoading]  = useState(false);
  const [users,          setUsers]          = useState([]);

  // ── Fetch ────────────────────────────────────────────────────────────────────

  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getComplaints({
        page, limit: 15, search: search || undefined,
        status: status || undefined,
        category: category || undefined,
        priority: priority || undefined,
        severity: severity || undefined,
        sort,
      });
      setComplaints(res.data.data.complaints);
      setMeta(res.data.meta);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load complaints.');
    } finally {
      setLoading(false);
    }
  }, [page, search, status, category, priority, severity, sort]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  // Load users for assign dropdown once
  useEffect(() => {
    adminApi.getUsers({ limit: 100, role: 'moderator' })
      .then(r => setUsers(r.data.data.users))
      .catch(() => {});
  }, []);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, status, category, priority, severity, sort]);

  // ── Actions ──────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      await adminApi.deleteComplaint(deleteTarget._id);
      setDeleteTarget(null);
      fetchComplaints();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!statusTarget || !newStatus) return;
    try {
      setStatusLoading(true);
      await adminApi.updateComplaintStatus(statusTarget.id, { status: newStatus });
      setStatusTarget(null);
      setNewStatus('');
      fetchComplaints();
    } catch (err) {
      alert(err.response?.data?.message || 'Status update failed.');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!assignTarget || !assigneeId) return;
    try {
      setAssignLoading(true);
      await adminApi.assignComplaint(assignTarget._id, { assignedTo: assigneeId });
      setAssignTarget(null);
      setAssigneeId('');
      fetchComplaints();
    } catch (err) {
      alert(err.response?.data?.message || 'Assignment failed.');
    } finally {
      setAssignLoading(false);
    }
  };

  const toggleSort = (field) => {
    setSort((prev) => (prev === `-${field}` ? field : `-${field}`));
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <ErrorBoundary>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Manage Complaints</h1>
            <p className="page-subtitle">{meta.total} total complaints</p>
          </div>
          <button onClick={fetchComplaints} className="btn-secondary text-xs py-1.5 px-3 gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="card !p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                className="input pl-9 py-2 text-sm"
                placeholder="Search by title…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 text-xs">
              <Filter className="w-3.5 h-3.5" /> Filters:
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Status',   value: status,   setter: setStatus,   options: STATUSES   },
              { label: 'Category', value: category, setter: setCategory, options: CATEGORIES },
              { label: 'Priority', value: priority, setter: setPriority, options: PRIORITIES },
              { label: 'Severity', value: severity, setter: setSeverity, options: SEVERITIES },
            ].map(({ label, value, setter, options }) => (
              <select
                key={label}
                value={value}
                onChange={e => setter(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">{label}: All</option>
                {options.map(o => (
                  <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>
                ))}
              </select>
            ))}
          </div>
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
                    { label: 'Title',    field: 'title'     },
                    { label: 'Reporter', field: null         },
                    { label: 'Category', field: 'category'  },
                    { label: 'Status',   field: 'status'    },
                    { label: 'Priority', field: 'priority'  },
                    { label: 'Assigned', field: null         },
                    { label: 'Created',  field: 'createdAt' },
                    { label: 'Actions',  field: null         },
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
                          {label}
                          <ArrowUpDown className="w-3 h-3" />
                        </button>
                      ) : label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {loading ? (
                  <LoadingSkeleton rows={12} cols={8} />
                ) : complaints.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-slate-500">
                      No complaints found.
                    </td>
                  </tr>
                ) : (
                  complaints.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="px-4 py-3 max-w-[200px]">
                        <p className="text-slate-100 font-medium truncate">{c.title}</p>
                        <p className="text-xs text-slate-500 capitalize">{c.category?.replace(/_/g,' ')}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                            {c.createdBy?.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <span className="text-xs text-slate-300 truncate max-w-[100px]">
                            {c.createdBy?.name || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-400 capitalize">{c.category?.replace(/_/g,' ')}</span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-4 py-3">
                        <span className={PRIORITY_COLORS[c.priority] || 'badge-slate'}>
                          {c.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {c.assignedTo ? (
                          <span className="text-xs text-green-400">{c.assignedTo.name}</span>
                        ) : (
                          <span className="text-xs text-slate-600">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {timeAgo(c.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Change Status */}
                          <button
                            onClick={() => { setStatusTarget({ id: c._id, title: c.title }); setNewStatus(c.status); }}
                            title="Change Status"
                            className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-900/30 rounded-lg transition-all"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                          {/* Assign */}
                          <button
                            onClick={() => setAssignTarget(c)}
                            title="Assign"
                            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-900/30 rounded-lg transition-all"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </button>
                          {/* Delete */}
                          <button
                            onClick={() => setDeleteTarget(c)}
                            title="Delete"
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-900/30 rounded-lg transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="btn-secondary py-1 px-2 text-xs disabled:opacity-40"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  disabled={page >= meta.pages}
                  onClick={() => setPage(p => p + 1)}
                  className="btn-secondary py-1 px-2 text-xs disabled:opacity-40"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Delete Confirm ───────────────────────────────────────────────── */}
        <ConfirmDialog
          open={!!deleteTarget}
          title="Delete Complaint"
          message={`Permanently delete "${deleteTarget?.title}"? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          loading={deleteLoading}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />

        {/* ── Status Change Modal ──────────────────────────────────────────── */}
        {statusTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setStatusTarget(null)} />
            <div className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-sm p-6">
              <h3 className="text-base font-semibold text-slate-100 mb-1">Change Status</h3>
              <p className="text-sm text-slate-400 mb-4 truncate">{statusTarget.title}</p>
              <select
                value={newStatus}
                onChange={e => setNewStatus(e.target.value)}
                className="input mb-4"
              >
                {STATUSES.map(s => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </select>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setStatusTarget(null)} className="btn-secondary text-sm py-2 px-4">Cancel</button>
                <button onClick={handleStatusChange} disabled={statusLoading} className="btn-primary text-sm py-2 px-4">
                  {statusLoading ? 'Updating…' : 'Update'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Assign Modal ─────────────────────────────────────────────────── */}
        {assignTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAssignTarget(null)} />
            <div className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-sm p-6">
              <h3 className="text-base font-semibold text-slate-100 mb-1">Assign Complaint</h3>
              <p className="text-sm text-slate-400 mb-4 truncate">{assignTarget.title}</p>
              <select
                value={assigneeId}
                onChange={e => setAssigneeId(e.target.value)}
                className="input mb-4"
              >
                <option value="">Select a moderator…</option>
                {users.map(u => (
                  <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                ))}
              </select>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setAssignTarget(null)} className="btn-secondary text-sm py-2 px-4">Cancel</button>
                <button onClick={handleAssign} disabled={assignLoading || !assigneeId} className="btn-primary text-sm py-2 px-4">
                  {assignLoading ? 'Assigning…' : 'Assign'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
