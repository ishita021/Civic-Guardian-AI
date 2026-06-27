import { useState, useCallback, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Upload, Loader2, Brain, X, Image as ImageIcon } from 'lucide-react';
import { issuesApi } from '../../api/issuesApi';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'pothole',
  'garbage',
  'water_leakage',
  'broken_street_light',
  'drainage',
  'road_damage',
  'encroachment',
  'park_maintenance',
  'noise_pollution',
  'air_pollution',
  'other'
];
const SEVERITIES = ['low', 'medium', 'high', 'critical'];

export default function ReportIssuePage() {
  const navigate = useNavigate();
  
  // State variables
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    severity: 'medium',
    location: {
      coordinates: [0, 0], // [longitude, latitude]
      address: '',
      city: '',
      ward: ''
    }
  });

  // State setters
  const setField = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) {
      setErrors(e => ({ ...e, [field]: null }));
    }
  };

  const setLocField = (field, value) => {
    setForm(f => ({
      ...f,
      location: { ...f.location, [field]: value }
    }));
    if (errors[field] || errors.location) {
      setErrors(e => ({ ...e, [field]: null, location: null }));
    }
  };

  // Unmount cleanup for preview URL
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  // Image helpers
  const processFile = (selectedFile) => {
    if (!selectedFile) return;

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(selectedFile.type)) {
      toast.error('Unsupported file type. Please upload a JPEG, PNG, WebP, or GIF image.');
      return;
    }

    // Check size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      toast.error('File is too large. Maximum size is 5MB.');
      return;
    }

    // Revoke previous URL if any
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setFile(selectedFile);
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreview(objectUrl);
  };

  const handleImageChange = (e) => {
    const selectedFile = e.target.files[0];
    processFile(selectedFile);
  };

  const removeImage = () => {
    setFile(null);
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
  };

  // Drag & Drop handlers
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  // Geolocation handler
  const captureGPSLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setForm(f => ({
          ...f,
          location: {
            ...f.location,
            coordinates: [coords.longitude, coords.latitude]
          }
        }));
        setLocating(false);
        if (errors.coordinates) {
          setErrors(e => ({ ...e, coordinates: null }));
        }
        toast.success('GPS coordinates captured successfully!');
      },
      (err) => {
        setLocating(false);
        console.error('GPS error:', err);
        toast.error('Could not retrieve your location. Please enter details manually.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Validation
  const validateForm = () => {
    const errs = {};
    if (!form.title.trim()) {
      errs.title = 'Title is required.';
    } else if (form.title.length < 5) {
      errs.title = 'Title must be at least 5 characters.';
    } else if (form.title.length > 150) {
      errs.title = 'Title cannot exceed 150 characters.';
    }

    if (!form.description.trim()) {
      errs.description = 'Description is required.';
    } else if (form.description.length < 10) {
      errs.description = 'Description must be at least 10 characters.';
    } else if (form.description.length > 2000) {
      errs.description = 'Description cannot exceed 2000 characters.';
    }

    if (!form.category) {
      errs.category = 'Category is required.';
    }

    // Coordinates validation
    if (form.location.coordinates[0] === 0 && form.location.coordinates[1] === 0) {
      errs.coordinates = 'Please capture GPS coordinates for mapping.';
    }

    // General location details check
    if (!form.location.address.trim()) {
      errs.address = 'Street address is required.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the errors in the form before submitting.');
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title.trim());
      fd.append('description', form.description.trim());
      fd.append('category', form.category);
      fd.append('severity', form.severity);
      fd.append('location', JSON.stringify(form.location));

      if (file) {
        fd.append('images', file);
      }

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
    <div className="max-w-2xl mx-auto animate-fade-in px-4 py-8">
      <Link to="/issues" className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to issues
      </Link>

      <div className="mb-6">
        <h1 className="page-title text-3xl font-extrabold tracking-tight">Report a Civic Issue</h1>
        <p className="page-subtitle flex items-center gap-1.5 text-slate-400 mt-2">
          <Brain className="w-4 h-4 text-blue-400" />
          Gemini AI will automatically analyze and route your report to the correct department.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        {/* Title */}
        <div>
          <label className="label block text-sm font-medium text-slate-300 mb-1.5">
            Issue Title <span className="text-red-400">*</span>
          </label>
          <input
            className={`input w-full px-4 py-3 bg-slate-800 border rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
              errors.title ? 'border-red-500 focus:ring-red-500' : 'border-slate-700'
            }`}
            placeholder="e.g. Large pothole blocking traffic on Main Street"
            value={form.title}
            onChange={e => setField('title', e.target.value)}
          />
          {errors.title && <p className="error-msg text-xs text-red-400 mt-1">{errors.title}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="label block text-sm font-medium text-slate-300 mb-1.5">
            Detailed Description <span className="text-red-400">*</span>
          </label>
          <textarea
            className={`input w-full px-4 py-3 bg-slate-800 border rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
              errors.description ? 'border-red-500 focus:ring-red-500' : 'border-slate-700'
            }`}
            rows={4}
            placeholder="Describe the issue in detail. Add landmarks, size of the damage, or how long it has been present. The AI uses this for routing."
            value={form.description}
            onChange={e => setField('description', e.target.value)}
          />
          {errors.description && <p className="error-msg text-xs text-red-400 mt-1">{errors.description}</p>}
        </div>

        {/* Category + Severity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label block text-sm font-medium text-slate-300 mb-1.5">
              Category <span className="text-red-400">*</span>
            </label>
            <select
              className={`input w-full px-4 py-3 bg-slate-800 border rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                errors.category ? 'border-red-500 focus:ring-red-500' : 'border-slate-700'
              }`}
              value={form.category}
              onChange={e => setField('category', e.target.value)}
            >
              <option value="">Select category</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>
                  {c.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
            {errors.category && <p className="error-msg text-xs text-red-400 mt-1">{errors.category}</p>}
          </div>
          <div>
            <label className="label block text-sm font-medium text-slate-300 mb-1.5">Severity</label>
            <select
              className="input w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={form.severity}
              onChange={e => setField('severity', e.target.value)}
            >
              {SEVERITIES.map(s => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Location Details */}
        <div className="border-t border-slate-800 pt-6">
          <label className="label block text-sm font-bold text-slate-200 mb-3">Location Details</label>
          <div className="space-y-4">
            <button
              type="button"
              onClick={captureGPSLocation}
              disabled={locating}
              className="btn-secondary w-full md:w-auto flex items-center justify-center gap-2 text-sm bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2.5 rounded-xl transition-all disabled:opacity-50"
            >
              {locating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Locating...
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4 text-blue-400" />
                  Capture My GPS Coordinates <span className="text-red-400 font-semibold">*</span>
                </>
              )}
            </button>
            
            {errors.coordinates && <p className="error-msg text-xs text-red-400 mt-1">{errors.coordinates}</p>}
            
            {form.location.coordinates[0] !== 0 && (
              <p className="text-xs text-green-400 bg-green-950/20 border border-green-800/30 rounded-lg p-2 flex items-center gap-1.5">
                ✓ GPS Coordinates: Long: {form.location.coordinates[0].toFixed(5)}, Lat: {form.location.coordinates[1].toFixed(5)}
              </p>
            )}

            <div>
              <label className="label block text-xs text-slate-400 mb-1">Street Address <span className="text-red-400">*</span></label>
              <input
                className={`input w-full px-4 py-3 bg-slate-800 border rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.address ? 'border-red-500 focus:ring-red-500' : 'border-slate-700'
                }`}
                placeholder="e.g. 123 Main Road, near Metro Station"
                value={form.location.address}
                onChange={e => setLocField('address', e.target.value)}
              />
              {errors.address && <p className="error-msg text-xs text-red-400 mt-1">{errors.address}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="label block text-xs text-slate-400 mb-1">City</label>
                <input
                  className="input w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="e.g. Bangalore"
                  value={form.location.city}
                  onChange={e => setLocField('city', e.target.value)}
                />
              </div>
              <div>
                <label className="label block text-xs text-slate-400 mb-1">Ward / Area</label>
                <input
                  className="input w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="e.g. Ward 10"
                  value={form.location.ward}
                  onChange={e => setLocField('ward', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Image Upload Component */}
        <div className="border-t border-slate-800 pt-6">
          <label className="label block text-sm font-bold text-slate-200 mb-3">Attach Photo</label>
          
          {preview ? (
            <div className="relative rounded-xl overflow-hidden h-56 bg-slate-950 border border-slate-800 group shadow-inner">
              <img src={preview} alt="preview" className="w-full h-full object-contain" />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-3 right-3 bg-red-600/90 text-white rounded-full p-2 hover:bg-red-500 transition-all duration-200 shadow-md flex items-center justify-center"
                aria-label="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-0 inset-x-0 bg-slate-900/80 backdrop-blur-sm p-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-300">
                <span className="truncate max-w-[80%] font-medium">{file?.name}</span>
                <span>{(file?.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            </div>
          ) : (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 transition-all ${
                dragActive 
                  ? 'border-blue-500 bg-blue-950/20' 
                  : 'border-slate-700 hover:border-blue-600/60 bg-slate-900'
              }`}
            >
              <Upload className={`w-8 h-8 mb-3 transition-colors ${dragActive ? 'text-blue-400' : 'text-slate-500'}`} />
              <p className="text-sm font-medium text-slate-300 text-center mb-1">
                Drag and drop your image here, or{' '}
                <label htmlFor="issue-image" className="text-blue-400 hover:underline cursor-pointer">
                  browse files
                </label>
              </p>
              <p className="text-xs text-slate-500 text-center">
                Supports JPEG, PNG, WebP, GIF (max 5MB)
              </p>
              <input
                id="issue-image"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>
          )}
        </div>

        {/* AI Notice Alert Box */}
        <div className="flex items-start gap-3 bg-blue-950/20 border border-blue-900/40 rounded-xl p-4">
          <Brain className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-400 leading-relaxed">
            <span className="text-blue-400 font-semibold">Gemini AI Engine:</span> After you submit, the AI will perform classification, determine category alignment, analyze severity matching, and assign the appropriate department automatically.
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3.5 text-base rounded-xl font-bold flex items-center justify-center gap-2 transition-all bg-blue-600 hover:bg-blue-500 text-white shadow-lg disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting & Analyzing with Gemini AI...
            </>
          ) : (
            <>
              <Brain className="w-5 h-5" />
              Submit Report & Run AI Analysis
            </>
          )}
        </button>
      </form>
    </div>
  );
}
