/**
 * StatCard
 * Reusable metric card for the admin dashboard overview.
 */
export default function StatCard({ label, value, icon: Icon, color = 'blue', trend, sub }) {
  const colors = {
    blue:   { bg: 'bg-blue-900/30',   icon: 'text-blue-400',   border: 'border-blue-700/30'   },
    green:  { bg: 'bg-green-900/30',  icon: 'text-green-400',  border: 'border-green-700/30'  },
    yellow: { bg: 'bg-yellow-900/30', icon: 'text-yellow-400', border: 'border-yellow-700/30' },
    red:    { bg: 'bg-red-900/30',    icon: 'text-red-400',    border: 'border-red-700/30'    },
    cyan:   { bg: 'bg-cyan-900/30',   icon: 'text-cyan-400',   border: 'border-cyan-700/30'   },
    purple: { bg: 'bg-purple-900/30', icon: 'text-purple-400', border: 'border-purple-700/30' },
    orange: { bg: 'bg-orange-900/30', icon: 'text-orange-400', border: 'border-orange-700/30' },
    slate:  { bg: 'bg-slate-800/60',  icon: 'text-slate-400',  border: 'border-slate-700/30'  },
  };

  const c = colors[color] || colors.blue;

  return (
    <div className={`card border ${c.border} hover:scale-[1.02] transition-transform duration-200`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
          {Icon && <Icon className={`w-5 h-5 ${c.icon}`} />}
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            trend >= 0 ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'
          }`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-100 mb-1">{value ?? '—'}</p>
      <p className="text-sm text-slate-400">{label}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}
