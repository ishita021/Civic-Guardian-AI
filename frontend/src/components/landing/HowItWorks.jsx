import { Camera, Brain, Users, CheckCircle2, ArrowRight } from 'lucide-react';

const STEPS = [
  {
    step: '01',
    icon: Camera,
    title: 'Citizen Reports',
    desc:  'A citizen spots a pothole, garbage pile, or broken street light and reports it via the app with a photo and location.',
    color: 'border-blue-700/50 bg-blue-950/30',
    iconColor: 'text-blue-400',
  },
  {
    step: '02',
    icon: Brain,
    title: 'Gemini AI Analyzes',
    desc:  'Google Gemini AI instantly classifies the issue, assigns an urgency priority, and identifies the responsible government department.',
    color: 'border-cyan-700/50 bg-cyan-950/30',
    iconColor: 'text-cyan-400',
  },
  {
    step: '03',
    icon: Users,
    title: 'Community Verifies',
    desc:  'Nearby citizens verify the issue using a trust-weighted voting system. A confidence score is calculated from all votes.',
    color: 'border-violet-700/50 bg-violet-950/30',
    iconColor: 'text-violet-400',
  },
  {
    step: '04',
    icon: CheckCircle2,
    title: 'Authority Resolves',
    desc:  'Verified issues are escalated to the right department. Citizens track real-time progress until the issue is fully resolved.',
    color: 'border-green-700/50 bg-green-950/30',
    iconColor: 'text-green-400',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="section bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="container-xl">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-cyan-400 font-semibold text-sm uppercase tracking-widest mb-3">The Process</p>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-100 mb-4">
            From report to resolution
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            A four-step intelligent pipeline that turns citizen observations
            into government action.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Connecting line (desktop) */}
          <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-blue-800/0 via-blue-600/40 to-blue-800/0" />

          {STEPS.map(({ step, icon: Icon, title, desc, color, iconColor }, i) => (
            <div key={step} className="relative flex flex-col items-center text-center">
              {/* Step bubble */}
              <div className={`relative z-10 w-20 h-20 rounded-2xl border-2 ${color} flex items-center justify-center mb-6 shadow-lg`}>
                <Icon className={`w-8 h-8 ${iconColor}`} />
                <span className="absolute -top-2 -right-2 bg-slate-950 border border-slate-700 text-slate-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {step}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-2">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>

              {/* Arrow (mobile) */}
              {i < STEPS.length - 1 && (
                <div className="lg:hidden mt-4 text-slate-700">
                  <ArrowRight className="w-5 h-5 rotate-90 mx-auto" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
