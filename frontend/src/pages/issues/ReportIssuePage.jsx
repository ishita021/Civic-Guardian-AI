import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Upload, Loader2, Brain } from 'lucide-react';
import { issuesApi } from '../../api/issuesApi';
import toast from 'react-hot-toast';

const CATEGORIES = ['pothole','garbage','water_leakage','broken_street_light','drainage','road_damage','encroachment','park_maintenance','noise_pollution','air_pollution','other'];
const SEVERITIES = ['low','medium','high','critical'];

export default function ReportIssuePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [form, setForm] = useState({
    title: '', description: '', category: '', severity: 'medium',
    location: { coordinates: [0, 0], address: '', city: '', ward: '' },
  });

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));
  const setLoc = (field, value) => setForm(f => ({ ...f, location: { ...f.location, [field]: value } }));

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
  };

  const getLocation = () => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported.'); return; }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setForm(f => ({ ...f, location: { ...f.location, coordinates: [coords.longitude, coords.latitude] } }));
        toast.success('Location captured!');
      },
      () => toast.error('Could not get location. Please enter manually.')
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.category) {
      toast.error('Please fill all required fields.'); return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('category', form.category);
      fd.append('severity', form.severity);
      fd.append('location', JSON.stringify(form.location));

      const fileInput = document.getElementById('issue-image');
      if (fileInput?.files[0]) fd.append('images', fileInput.files[0]);

      const res = await issuesApi.create(fd);
      toast.success('Issue reported and analyzed by AI!');
      navigate(`/issues/${res.data.data.issue._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to report issue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <Link to="/issues" className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to issues
      </Link>

      <div className="mb-6">
        <h1 className="page-title">Report a Civic Issue</h1>
        <p className="page-subtitle flex items-center gap-1.5">
          <Brain className="w-4 h-4 text-blue-400" />
          Gemini AI will automatically analyze and categorize your report
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        {/* Title */}
        <div>
          <label className="label">Issue Title <span className="text-red-400">*</span></label>
          <input className="input" placeholder="e.g. Large pothole on Main Street" value={form.title} onChange={e => set('title', e.target.value)} />
        </div>

        {/* Description */}
        <div>
          <label className="label">Description <span className="text-red-400">*</span></label>
          <textarea className="input resize-none" rows={4} placeholder="Describe the issue in detail — the AI uses this to analyze and route it correctly." value={form.description} onChange={e => set('description', e.target.value)} />
        </div>

        {/* Category + Severity */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Category <span className="text-red-400">*</span></label>
            <select className="input cursor-pointer" value={form.category} onChange={e => set('category', e.target.value)}>
              <option value="">Select category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Severity</label>
            <select className="input cursor-pointer" value={form.severity} onChange={e => set('severity', e.target.value)}>
              {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="label">Location</label>
          <div className="space-y-3">
            <input className="input" placeholder="Street address" value={form.location.address} onChange={e => setLoc('address', e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <input className="input" placeholder="City" value={form.location.city} onChange={e => setLoc('city', e.target.value)} />
              <input className="input" placeholder="Ward / Area" value={form.location.ward} onChange={e => setLoc('ward', e.target.value)} />
            </div>
            <button type="button" onClick={getLocation} className="btn-secondary gap-2 text-sm">
              <MapPin className="w-4 h-4" /> Use My GPS Location
            </button>
            {form.location.coordinates[0] !== 0 && (
              <p className="text-xs text-green-400">✓ GPS coordinates captured: {form.location.coordinates[1].toFixed(4)}, {form.location.coordinates[0].toFixed(4)}</p>
            )}
          </div>
        </div>

        {/* Image upload */}
        <div>
          <label className="label">Photo (optional)</label>
          {preview && (
            <div className="mb-3 rounded-xl overflow-hidden h-40 bg-slate-800">
              <img src={preview} alt="preview" className="w-full h-full object-cover" />
            </div>
          )}
          <label htmlFor="issue-image" className="flex items-center gap-3 cursor-pointer border-2 border-dashed border-slate-700 hover:border-blue-600 rounded-xl p-5 transition-colors group">
            <Upload className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
            <span className="text-sm text-slate-500 group-hover:text-slate-300 transition-colors">Click to upload photo (JPEG, PNG, WebP · max 5MB)</span>
            <input id="issue-image" type="file" accept="image/*" className="hidden" onChange={handleImage} />
          </label>
        </div>

        {/* AI notice */}
        <div className="flex items-start gap-3 bg-blue-950/30 border border-blue-800/40 rounded-xl p-4">
          <Brain className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-400 leading-relaxed">
            After submission, <span className="text-blue-400 font-medium">Gemini AI</span> will automatically detect the category, assign a priority level, identify the responsible department, and suggest a resolution.
          </p>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
          {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing with AI...</> : 'Submit & Analyze with AI'}
        </button>
      </form>
    </div>
  );
}
