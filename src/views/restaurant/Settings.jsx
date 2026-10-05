import React, { useState, useEffect, useRef } from 'react';
import { 
  Store, MapPin, Phone, Save, Power, 
  ShieldCheck, Loader2, Clock, 
  Tag, AlignLeft, Camera, UploadCloud
} from 'lucide-react';

// 🚨 ADDED BASE_URL so we can point images to the backend port (5000) instead of frontend port (5173)
const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://zamdey-backend.onrender.com';
const API_URL = import.meta.env.VITE_API_URL || `${BASE_URL}/api`;

export default function RestaurantSettings({ zones = [] }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // File References for immediate UI Preview
  const [logoPreview, setLogoPreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const logoInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const [formData, setFormData] = useState({
    restaurant_name: '', 
    commission_rate: 20, 
    isOpen: false,
    phone: '',
    address: '',
    zone_id: '',
    slogan: '',
    description: '',
    operating_hours: '',
    prep_time: '',
    minimum_order_value: '0',
    tags: '', 
    logoFile: null, 
    coverFile: null 
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch(`${API_URL}/restaurant/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            const data = await res.json();
            
            // 🚨 THE FIX: This forces the image URLs to fetch from your backend port
            const formatImageUrl = (url) => {
              if (!url) return null;
              if (url.startsWith('http')) return url; // Already a full web link
              // Clean up slashes and attach the backend server URL
              const cleanUrl = url.replace(/\\/g, '/').replace(/^\//, '');
              return `${BASE_URL}/${cleanUrl}`; 
            };

            setFormData({
                restaurant_name: data.restaurant_name || '',
                commission_rate: data.commission_rate || 20,
                isOpen: data.is_open || false,
                phone: data.phone || '',
                address: data.address || '',
                zone_id: data.zone_id || '',
                slogan: data.slogan || '',
                description: data.description || '',
                operating_hours: data.operating_hours || '',
                prep_time: data.prep_time || '',
                minimum_order_value: data.minimum_order_value?.toString() || '0',
                tags: data.tags ? data.tags.join(', ') : '', 
                logoFile: null,
                coverFile: null
            });
            
            // 🚨 Use the formatter to set the previews!
            if (data.logo_url) setLogoPreview(formatImageUrl(data.logo_url));
            if (data.cover_image) setCoverPreview(formatImageUrl(data.cover_image));
        }
      } catch (error) {
        console.error("Settings sync failed:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Handle Local File Selection & Preview Generation
  const handleImageChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    
    if (type === 'logo') {
      setLogoPreview(previewUrl);
      setFormData(prev => ({ ...prev, logoFile: file }));
    } else {
      setCoverPreview(previewUrl);
      setFormData(prev => ({ ...prev, coverFile: file }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      
      const formattedTags = formData.tags
        ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        : [];

      // We MUST use FormData to send physical files to the backend
      const payload = new FormData();
      payload.append('phone', formData.phone);
      payload.append('address', formData.address);
      payload.append('zone_id', formData.zone_id);
      payload.append('slogan', formData.slogan);
      payload.append('description', formData.description);
      payload.append('operating_hours', formData.operating_hours);
      payload.append('prep_time', formData.prep_time);
      payload.append('tags', JSON.stringify(formattedTags));
      payload.append('minimum_order_value', parseFloat(formData.minimum_order_value) || 0);

      if (formData.logoFile) payload.append('logo', formData.logoFile);
      if (formData.coverFile) payload.append('cover', formData.coverFile);

      const res = await fetch(`${API_URL}/restaurant/profile`, {
        method: 'PUT',
        headers: { 
            'Authorization': `Bearer ${token}`
        },
        body: payload
      });

      if (res.ok) {
        alert("Storefront updated successfully!");
      } else {
        throw new Error("Update failed");
      }
    } catch (error) {
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async () => {
    const newStatus = !formData.isOpen;
    setFormData(prev => ({ ...prev, isOpen: newStatus }));

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/restaurant/status`, {
        method: 'PATCH',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json(); 
      if (!res.ok) throw new Error(data.message || `Server Error`);
      setFormData(prev => ({ ...prev, isOpen: data.is_open }));
    } catch (error) {
      alert(`Failed to toggle status: ${error.message}`);
      setFormData(prev => ({ ...prev, isOpen: !newStatus })); 
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-slate-900" /></div>;

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500 font-sans pb-24">
      
      {/* 🖼️ LIVE PREVIEW HERO BANNER */}
      <div className="relative w-full h-48 sm:h-64 md:h-80 bg-slate-100 rounded-b-2xl sm:rounded-b-[40px] shadow-sm mb-12 sm:mb-16 overflow-visible group">
        {/* Cover Image Background */}
        {coverPreview ? (
          <img src={coverPreview} alt="Cover" className="w-full h-full object-cover rounded-b-2xl sm:rounded-b-[40px]" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
            <UploadCloud size={40} className="mb-2 opacity-50 sm:w-12 sm:h-12" />
            <span className="font-bold tracking-widest uppercase text-xs">No Cover Image</span>
          </div>
        )}
        
        {/* Cover Image Upload Button */}
        <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-10">
          <button 
            onClick={() => coverInputRef.current?.click()}
            className="bg-black/50 backdrop-blur-md text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-black/70 transition min-h-[36px]"
          >
            <Camera size={14} /> Change Cover
          </button>
          <input type="file" hidden accept="image/*" ref={coverInputRef} onChange={(e) => handleImageChange(e, 'cover')} />
        </div>

        {/* Floating Logo Profile Picture */}
        <div className="absolute -bottom-10 sm:-bottom-12 left-4 sm:left-8 md:left-12">
          <div className="relative group/logo">
            <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full border-4 border-white bg-slate-200 shadow-xl overflow-hidden flex items-center justify-center">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Store size={32} className="text-slate-400 sm:w-10 sm:h-10" />
              )}
            </div>
            
            {/* Logo Upload Overlay */}
            <button 
              onClick={() => logoInputRef.current?.click()}
              className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity backdrop-blur-sm"
            >
              <Camera className="text-white" size={24} />
            </button>
            <input type="file" hidden accept="image/*" ref={logoInputRef} onChange={(e) => handleImageChange(e, 'logo')} />
          </div>
        </div>
      </div>

      <div className="space-y-6 sm:space-y-8 px-2 sm:px-4 md:px-0">
        
        {/* 🟢 OPERATIONAL CONTROL CARD */}
        <div className={`p-4 sm:p-8 rounded-2xl sm:rounded-[32px] border-2 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 shadow-sm ${formData.isOpen ? 'bg-emerald-50 border-emerald-500/30' : 'bg-white border-slate-200'}`}>
          <div>
            <h2 className={`text-xl sm:text-2xl font-black uppercase ${formData.isOpen ? 'text-emerald-700' : 'text-slate-400'}`}>
              {formData.isOpen ? 'Kitchen is Open' : 'Kitchen is Closed'}
            </h2>
            <p className={`text-xs sm:text-sm font-medium mt-1 ${formData.isOpen ? 'text-emerald-600/80' : 'text-slate-500'}`}>
              {formData.isOpen 
                ? "Your menu is live. Customers are actively ordering." 
                : "Customers cannot see your menu or place orders right now."}
            </p>
          </div>
          <button 
            onClick={toggleStatus}
            className={`w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-2xl flex items-center justify-center transition-all shadow-md active:scale-95 ${formData.isOpen ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
          >
            <Power size={24} strokeWidth={3} className="sm:w-7 sm:h-7" />
          </button>
        </div>

        {/* 📝 SETTINGS FORM */}
        <form onSubmit={handleSave} className="space-y-6 sm:space-y-8">
          
          {/* SECTION 1: SYSTEM IDENTITY (Read Only) */}
          <div className="bg-white rounded-2xl sm:rounded-[32px] p-4 sm:p-8 shadow-sm border border-slate-100">
            <h3 className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest mb-4 sm:mb-6 flex items-center gap-2"><ShieldCheck size={16}/> System Identity</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2 sm:space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase">Business Name</label>
                <input disabled value={formData.restaurant_name} className="w-full bg-slate-50 border-0 rounded-xl sm:rounded-2xl py-3.5 sm:py-4 px-4 sm:px-5 font-bold text-slate-400 cursor-not-allowed text-sm" />
              </div>
              <div className="space-y-2 sm:space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase">Agreed Commission</label>
                <div className="w-full bg-indigo-50/50 border border-indigo-100 rounded-xl sm:rounded-2xl py-3.5 sm:py-4 px-4 sm:px-5 font-black text-indigo-700 flex items-center justify-between text-sm">
                  <span className="text-base sm:text-lg">{formData.commission_rate}%</span>
                  <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">Locked by Admin</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: BRAND DETAILS */}
          <div className="bg-white rounded-2xl sm:rounded-[32px] p-4 sm:p-8 shadow-sm border border-slate-100 space-y-4 sm:space-y-6">
            <h3 className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest mb-4 sm:mb-6 flex items-center gap-2"><AlignLeft size={16}/> Brand Details</h3>
            
            <div className="space-y-2 sm:space-y-3">
              <label className="text-xs font-bold text-slate-700 uppercase ml-1">Slogan</label>
              <input 
                type="text" value={formData.slogan} onChange={(e) => setFormData({...formData, slogan: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 rounded-xl sm:rounded-2xl py-3.5 sm:py-4 px-4 sm:px-5 font-medium text-slate-900 outline-none transition-all text-sm"
                placeholder="e.g., The best food in the city"
              />
            </div>

            <div className="space-y-2 sm:space-y-3">
              <label className="text-xs font-bold text-slate-700 uppercase ml-1">Full Description</label>
              <textarea 
                rows="4" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 rounded-xl sm:rounded-2xl py-3.5 sm:py-4 px-4 sm:px-5 font-medium text-slate-900 outline-none transition-all resize-none text-sm"
                placeholder="Tell customers your story and what makes your food special..."
              />
            </div>

            <div className="space-y-2 sm:space-y-3">
              <label className="text-xs font-bold text-slate-700 uppercase ml-1">Search Tags</label>
              <div className="relative">
                <Tag className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" value={formData.tags} onChange={(e) => setFormData({...formData, tags: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 rounded-xl sm:rounded-2xl py-3.5 sm:py-4 pl-11 sm:pl-12 pr-4 sm:pr-5 font-medium text-slate-900 outline-none transition-all text-sm"
                  placeholder="Fast Food, Vegan, Drinks (Comma separated)"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: OPERATIONS & LOGISTICS */}
          <div className="bg-white rounded-2xl sm:rounded-[32px] p-4 sm:p-8 shadow-sm border border-slate-100">
            <h3 className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest mb-4 sm:mb-6 flex items-center gap-2"><Clock size={16}/> Operations & Logistics</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
              <div className="space-y-2 sm:space-y-3">
                <label className="text-xs font-bold text-slate-700 uppercase ml-1">Operating Hours</label>
                <input 
                  type="text" value={formData.operating_hours} onChange={(e) => setFormData({...formData, operating_hours: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 rounded-xl sm:rounded-2xl py-3.5 sm:py-4 px-4 sm:px-5 font-medium text-slate-900 outline-none transition-all text-sm"
                  placeholder="08:00 AM - 10:00 PM"
                />
              </div>
              <div className="space-y-2 sm:space-y-3">
                <label className="text-xs font-bold text-slate-700 uppercase ml-1">Avg. Prep Time</label>
                <input 
                  type="text" value={formData.prep_time} onChange={(e) => setFormData({...formData, prep_time: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 rounded-xl sm:rounded-2xl py-3.5 sm:py-4 px-4 sm:px-5 font-medium text-slate-900 outline-none transition-all text-sm"
                  placeholder="15-25 min"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <div className="space-y-2 sm:space-y-3">
                <label className="text-xs font-bold text-slate-700 uppercase ml-1">Phone Line</label>
                <div className="relative">
                  <Phone className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 rounded-xl sm:rounded-2xl py-3.5 sm:py-4 pl-11 sm:pl-12 pr-4 sm:pr-5 font-medium text-slate-900 outline-none transition-all text-sm"
                    placeholder="+237..."
                  />
                </div>
              </div>
              <div className="space-y-2 sm:space-y-3">
                <label className="text-xs font-bold text-slate-700 uppercase ml-1">Delivery Zone</label>
                <div className="relative">
                  <MapPin className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select 
                    value={formData.zone_id} onChange={(e) => setFormData({...formData, zone_id: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 rounded-xl sm:rounded-2xl py-3.5 sm:py-4 pl-11 sm:pl-12 pr-4 sm:pr-5 font-medium text-slate-900 outline-none appearance-none transition-all text-sm"
                  >
                    <option value="">Select Zone...</option>
                    {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-2 sm:space-y-3">
                <label className="text-xs font-bold text-slate-700 uppercase ml-1">Min. Order (XAF)</label>
                <input 
                  type="number" value={formData.minimum_order_value} onChange={(e) => setFormData({...formData, minimum_order_value: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 rounded-xl sm:rounded-2xl py-3.5 sm:py-4 px-4 sm:px-5 font-medium text-slate-900 outline-none transition-all text-sm"
                  placeholder="1500"
                />
              </div>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-4 sm:pt-6 flex justify-end">
            <button 
              type="submit" 
              disabled={saving}
              className="w-full sm:w-auto bg-indigo-600 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-xl sm:rounded-[24px] font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl hover:shadow-indigo-500/30 disabled:opacity-50 flex items-center justify-center gap-3 active:scale-95 min-h-[48px]"
            >
              {saving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>}
              Publish Storefront
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}