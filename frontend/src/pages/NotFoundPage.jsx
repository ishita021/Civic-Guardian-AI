import { Link } from 'react-router-dom';
import { Shield, Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <div className="inline-flex w-20 h-20 bg-slate-900 border border-slate-800 rounded-2xl items-center justify-center mb-6">
          <Shield className="w-10 h-10 text-slate-600" />
        </div>
        <h1 className="text-6xl font-extrabold text-slate-700 mb-3">404</h1>
        <h2 className="text-xl font-bold text-slate-300 mb-2">Page not found</h2>
        <p className="text-slate-500 mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/" className="btn-primary inline-flex gap-2">
          <Home className="w-4 h-4" /> Back to Home
        </Link>
      </div>
    </div>
  );
}
