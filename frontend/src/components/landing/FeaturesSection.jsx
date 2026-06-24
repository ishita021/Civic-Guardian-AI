import { Brain, Users, BarChart3, Bell, Zap, ShieldCheck } from 'lucide-react';

const FEATURES = [
  {
    icon:  Brain,
    title: 'AI Issue Detection',
    desc:  'Google Gemini instantly classifies every civic issue, assigns priority, and identifies the responsible government department — all in under a second.',
    color: 'from-blue-600 to-blue-500',
    glow:  'group-hover:shadow-blue-900/40',
  },
  {
    icon:  Users,
    title: 'Community Verification',
    desc:  'Citizens verify each other\'s reports using a trust-weighted voting system. Issues auto-escalate when community confidence crosses 60%.',
    color: 'from-cyan-600 to-cyan-500',
    glow:  'group-hover:shadow-cyan-900/40',
  },
  {
    icon:  BarChart3,
    title: 'Civic DNA Dashboard',
    desc:  'Real-time analytics show issue heatmaps, resolution rates, department performance, and civic health scores for your entire city.',
    color: 'from-violet-600 to-violet-500',
    glow:  'group-hover:shadow-violet-900/40',
  },
  {
    icon:  Bell,
    title: 'Community SOS Alerts',
    desc:  'Broadcast urgent local alerts to all citizens within a configurable radius. Critical issues get pushed to relevant authorities immediately.',
    color: 'from-orange-600 to-orange-500',
    glow:  'group-hover:shadow-orange-900/40',
  },
  {
    icon:  Zap,
    title: 'Before It Breaks',
    desc:  'AI-powered risk predictions identify infrastructure likely to fail based on historical issue patterns before they become emergencies.',
    color: 'from-yellow-600 to-yellow-500',
    glow:  'group-hover:shadow-yellow-900/40',
  },
  {
    icon:  ShieldCheck,
    title: 'Real-time Tracking',
    desc:  'Citizens track every issue from report to resolution. Status history, assigned departments, and resolution notes — all transparent.',
    color: 'from-green-600 to-green-500',
    glow:  'group-hover:shadow-green-900/40',
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="section bg-slate-950">
      <div className="container-xl">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-blue-400 font-semibold text-sm uppercase tracking-widest mb-3">Platform Features</p>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-100 mb-4">
            Everything your city needs
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            From AI-powered analysis to community-driven verification, Civic Guardian AI
            covers the full lifecycle of civic issue management.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc, color, glow }) => (
            <div key={title} className={`group card-hover cursor-default transition-all duration-300 ${glow}`}>
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-5 shadow-lg`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-2">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
