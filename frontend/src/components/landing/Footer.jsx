import { Shield, Github, Twitter, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const LINKS = {
  Product:  [{ label: 'Features', to: '/#features' }, { label: 'How It Works', to: '/#how-it-works' }, { label: 'Statistics', to: '/#stats' }],
  Platform: [{ label: 'Dashboard', to: '/dashboard' }, { label: 'Report Issue', to: '/issues/report' }, { label: 'Verify Issues', to: '/verifications' }],
  Company:  [{ label: 'About', to: '/' }, { label: 'Privacy Policy', to: '/' }, { label: 'Terms of Use', to: '/' }],
};

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/40">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg">
                <span className="gradient-text">Civic</span>
                <span className="text-slate-100"> Guardian AI</span>
              </span>
            </Link>
            <p className="text-slate-500 text-sm leading-relaxed mb-5">
              AI-powered civic intelligence platform helping citizens report, verify, and track public infrastructure issues.
            </p>
            <div className="flex gap-3">
              {[Github, Twitter, Mail].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-all">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([heading, items]) => (
            <div key={heading}>
              <h4 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">{heading}</h4>
              <ul className="space-y-2.5">
                {items.map(({ label, to }) => (
                  <li key={label}>
                    <Link to={to} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-600">© {new Date().getFullYear()} Civic Guardian AI. Built for smarter cities.</p>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span>Powered by</span>
            <span className="text-blue-500 font-semibold">Google Gemini AI</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
