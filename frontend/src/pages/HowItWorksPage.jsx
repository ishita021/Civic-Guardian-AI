import { Link } from 'react-router-dom';
import { ArrowRight, Brain, Camera, CheckCircle2, ClipboardList, MapPin, Search, ShieldCheck, Users } from 'lucide-react';

const STEPS = [
  {
    icon: Camera,
    title: 'A citizen reports a problem',
    text: 'Someone notices a pothole, garbage pile, broken street light, water leak, or similar civic issue. They submit a short description, photo, category, severity, and location.',
  },
  {
    icon: Brain,
    title: 'AI understands the report',
    text: 'Gemini AI reads the title and description, then suggests the likely category, priority, department, and next action. If AI is unavailable, the issue is still saved safely.',
  },
  {
    icon: MapPin,
    title: 'The issue is mapped and listed',
    text: 'Every report is stored with address and GPS coordinates, so citizens and officials can see what is happening in each area.',
  },
  {
    icon: Users,
    title: 'The community verifies it',
    text: 'Other users can confirm or reject a report. Once enough people confirm it, the issue becomes verified and gains more trust.',
  },
  {
    icon: ClipboardList,
    title: 'Officials track progress',
    text: 'Admins and moderators can update status from pending to in progress, resolved, rejected, or closed, with a clear history.',
  },
  {
    icon: CheckCircle2,
    title: 'Citizens see the outcome',
    text: 'Everyone can search, filter, and follow registered issues, making civic problems easier to find and easier to solve.',
  },
];

const FLOW = [
  'Report',
  'AI analysis',
  'Public issue list',
  'Community verification',
  'Department action',
  'Resolution',
];

export default function HowItWorksPage() {
  return (
    <div className="bg-slate-950">
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <span className="badge-blue mb-5">Project workflow</span>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-100 sm:text-5xl">
              How Civic Guardian AI works
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-400">
              Civic Guardian AI connects citizens, AI, community verification, and local authorities in one simple loop. The goal is to turn scattered complaints into organized, searchable, trackable civic action.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/issues/report" className="btn-primary px-6 py-3">
                Report an Issue
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/issues" className="btn-secondary px-6 py-3">
                <Search className="h-4 w-4" />
                Browse Issues
              </Link>
            </div>
          </div>

          <div className="mt-12 grid gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-xl shadow-black/20 md:grid-cols-6">
            {FLOW.map((item, index) => (
              <div key={item} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs font-semibold text-blue-400">Step {index + 1}</p>
                <p className="mt-2 text-sm font-semibold text-slate-100">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-2 lg:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, text }) => (
            <article key={title} className="card">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/15 text-blue-300">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-100">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-800 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-center">
          <div>
            <span className="badge-cyan mb-4">Why it matters</span>
            <h2 className="text-3xl font-bold text-slate-100">Simple for citizens. Useful for administrators.</h2>
            <p className="mt-4 text-slate-400 leading-7">
              Citizens get a clean way to report and search problems. Administrators get structured reports with category, priority, status, location, and AI suggestions. That makes civic work easier to prioritize and easier to explain.
            </p>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-green-400" />
              <p className="font-semibold text-slate-100">Core promise</p>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-400">
              Every issue should be easy to report, easy to find, easy to verify, and easy to track until it reaches an outcome.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
