import { useEffect, useRef, useState } from 'react';

const STATS = [
  { value: 12400,  suffix: '+', label: 'Issues Reported',     color: 'text-blue-400'   },
  { value: 8700,   suffix: '+', label: 'Issues Resolved',     color: 'text-green-400'  },
  { value: 94,     suffix: '%', label: 'AI Accuracy Rate',    color: 'text-cyan-400'   },
  { value: 3200,   suffix: '+', label: 'Active Citizens',     color: 'text-violet-400' },
  { value: 24,     suffix: 'h', label: 'Avg Resolution Time', color: 'text-yellow-400' },
  { value: 99,     suffix: '%', label: 'Uptime Guaranteed',   color: 'text-orange-400' },
];

function useCountUp(target, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

function StatCard({ value, suffix, label, color }) {
  const ref  = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.3 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const count = useCountUp(value, 2000, visible);

  return (
    <div ref={ref} className="card text-center group hover:border-slate-700 transition-all duration-300">
      <p className={`text-4xl sm:text-5xl font-extrabold mb-2 ${color} transition-all`}>
        {count.toLocaleString()}{suffix}
      </p>
      <p className="text-sm text-slate-400 font-medium">{label}</p>
    </div>
  );
}

export default function CivicStats() {
  return (
    <section id="stats" className="section bg-slate-900">
      <div className="container-xl">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-violet-400 font-semibold text-sm uppercase tracking-widest mb-3">Platform Impact</p>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-100 mb-4">
            Numbers that matter
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Real-time civic intelligence powering smarter cities
            and more responsive governments.
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
          {STATS.map((s) => <StatCard key={s.label} {...s} />)}
        </div>

        {/* CTA Banner */}
        <div className="mt-16 relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-600 p-px">
          <div className="rounded-[calc(1.5rem-1px)] bg-gradient-to-r from-blue-950/90 to-cyan-950/90 px-8 py-10 text-center">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
              Ready to make your city smarter?
            </h3>
            <p className="text-blue-200 mb-6 max-w-lg mx-auto">
              Join thousands of citizens building better communities with AI-powered civic intelligence.
            </p>
            <a href="/register" className="btn-primary px-8 py-3 text-base inline-flex">
              Join Civic Guardian AI →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
