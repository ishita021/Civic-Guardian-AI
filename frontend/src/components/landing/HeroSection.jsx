import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Sparkles, MapPin, CheckCircle } from 'lucide-react';

const TRUST_BADGES = [
  { icon: CheckCircle, label: 'AI-Powered Analysis' },
  { icon: Shield,      label: 'Verified by Community' },
  { icon: MapPin,      label: 'Location-Aware' },
];

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-slate-950 pt-20 pb-32">
      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-cyan-500/8 rounded-full blur-[100px]" />
        {/* Dot grid overlay */}
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Eyebrow label */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-950/60 border border-blue-800/60 text-blue-400 text-sm font-medium mb-8 animate-fade-in">
          <Sparkles className="w-4 h-4" />
          Powered by Google Gemini AI
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 animate-slide-up">
          <span className="text-slate-100">Your City.</span>
          <br />
          <span className="gradient-text">Your Voice.</span>
          <br />
          <span className="text-slate-100">Our AI.</span>
        </h1>

        {/* Subheading */}
        <p className="max-w-2xl mx-auto text-lg sm:text-xl text-slate-400 leading-relaxed mb-10 animate-slide-up">
          Civic Guardian AI turns citizen reports into government action.
          Report potholes, water leaks, and broken infrastructure — our AI
          instantly classifies, prioritises, and routes every issue to the
          right department.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14 animate-slide-up">
          <Link to="/register" className="btn-primary px-8 py-3.5 text-base">
            Start Reporting Free
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link to="/#how-it-works" className="btn-secondary px-8 py-3.5 text-base">
            See How It Works
          </Link>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-6 animate-fade-in">
          {TRUST_BADGES.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-sm text-slate-500">
              <Icon className="w-4 h-4 text-blue-500" />
              {label}
            </div>
          ))}
        </div>

        {/* Hero mockup card */}
        <div className="mt-20 max-w-3xl mx-auto animate-fade-in">
          <div className="card border-slate-700/80 shadow-2xl shadow-blue-950/40 text-left">
            {/* Card header */}
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-800">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/70" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <span className="w-3 h-3 rounded-full bg-green-500/70" />
              </div>
              <span className="text-xs text-slate-600 ml-2">Gemini AI — Issue Analysis</span>
            </div>
            {/* Simulated AI output */}
            <div className="font-mono text-sm space-y-2">
              <p><span className="text-slate-500">input:</span>  <span className="text-slate-300">"Large pothole near market road causing accidents"</span></p>
              <p className="text-slate-600">──────────────────────────────────────</p>
              <p><span className="text-cyan-400">category:</span>    <span className="text-white">"Road Damage"</span></p>
              <p><span className="text-cyan-400">priority:</span>    <span className="text-red-400">"urgent"</span></p>
              <p><span className="text-cyan-400">confidence:</span>  <span className="text-green-400">95%</span></p>
              <p><span className="text-cyan-400">department:</span>  <span className="text-white">"Road Maintenance Department"</span></p>
              <p><span className="text-cyan-400">resolution:</span>  <span className="text-white">"Immediate road repair and barricading required"</span></p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
