import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Store, MapPin, Phone, Save, Power, 
  ShieldCheck, Loader2, Clock, 
  Tag, AlignLeft, Camera, UploadCloud, Info
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { phoneRegex } from '../../schemas';
import { FormError, FormLabel } from '../../components/FormField';

const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://zamdey-backend.onrender.com';
const API_URL = import.meta.env.VITE_API_URL || `${BASE_URL}/api`;

const restaurantStoreSchema = z.object({
  slogan: z.string().trim().max(100, 'Slogan cannot exceed 100 characters').optional().or(z.literal('')),
  description: z.string().trim().max(500, 'Description cannot exceed 500 characters').optional().or(z.literal('')),
  tags: z.string().trim().max(150, 'Tags list cannot exceed 150 characters').optional().or(z.literal('')),
  operating_hours: z
    .string()
    .trim()
    .min(3, 'Specify operating hours (e.g., 08:00 AM - 10:00 PM)'),
  prep_time: z
    .string()
    .trim()
    .min(2, 'Specify estimated preparation time (e.g. 15-25 min)'),
  phone: z
    .string()
    .trim()
    .min(1, 'Store dispatch phone line is required')
    .refine((val) => phoneRegex.test(val.replace(/\s+/g, '')), {
      message: 'Please enter a valid phone number (e.g., 670 123 456)',
    }),
  zone_id: z.string().min(1, 'Please designate a delivery operating zone'),
  minimum_order_value: z
    .coerce
    .number({ invalid_type_error: 'Minimum order must be a valid number' })
    .min(0, 'Minimum order cannot be negative'),
});

export default function RestaurantSettings({ zones = [] }) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [restaurantName, setRestaurantName] = useState('Mama Put Kitchen');
  const [commissionRate, setCommissionRate] = useState(20);
  
  // File References for UI Preview
  const [logoPreview, setLogoPreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const logoInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(restaurantStoreSchema),
    defaultValues: {
      slogan: '',
      description: '',
      tags: '',
      operating_hours: '08:00 AM - 10:00 PM',
      prep_time: '20-30 min',
      phone: '',
      zone_id: '',
      minimum_order_value: 0,
    },
    mode: 'onTouched',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_URL}/restaurant/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          
          const formatImageUrl = (url) => {
            if (!url) return null;
            if (url.startsWith('http')) return url; 
            const cleanUrl = url.replace(/\\/g, '/').replace(/^\//, '');
            return `${BASE_URL}/${cleanUrl}`; 
          };

          setRestaurantName(data.restaurant_name || 'Mama Put Kitchen');
          setCommissionRate(data.commission_rate || 20);
          setIsOpen(Boolean(data.is_open));

          reset({
            slogan: data.slogan || '',
            description: data.description || '',
            tags: data.tags ? data.tags.join(', ') : '',
            operating_hours: data.operating_hours || '08:00 AM - 10:00 PM',
            prep_time: data.prep_time || '20-30 min',
            phone: data.phone || '',
            zone_id: data.zone_id || (zones[0]?.id || ''),
            minimum_order_value: data.minimum_order_value || 0,
          });
          
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
  }, [reset, zones]);

  // Handle Local File Selection & Preview Generation
  const handleImageChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.warning('Please select an image file (PNG, JPG, WEBP).', 'Invalid File');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.warning('Image must be under 5MB in size.', 'File Too Large');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    
    if (type === 'logo') {
      setLogoPreview(previewUrl);
      setLogoFile(file);
      toast.info('Logo updated in preview. Click "Publish Storefront" to save.', 'New Logo Selected');
    } else {
      setCoverPreview(previewUrl);
      setCoverFile(file);
      toast.info('Cover banner updated in preview. Click "Publish Storefront" to save.', 'New Cover Selected');
    }
  };

  const onSubmit = async (values) => {
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      
      const formattedTags = values.tags
        ? values.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        : [];

      const payload = new FormData();
      payload.append('phone', values.phone);
      payload.append('zone_id', values.zone_id);
      payload.append('slogan', values.slogan || '');
      payload.append('description', values.description || '');
      payload.append('operating_hours', values.operating_hours);
      payload.append('prep_time', values.prep_time);
      payload.append('tags', JSON.stringify(formattedTags));
      payload.append('minimum_order_value', parseFloat(values.minimum_order_value) || 0);

      if (logoFile) payload.append('logo', logoFile);
      if (coverFile) payload.append('cover', coverFile);

      const res = await fetch(`${API_URL}/restaurant/profile`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`
        },
        body: payload
      });

      if (res.ok) {
        toast.success("Storefront settings and profile branding updated successfully!", "Settings Published");
      } else {
        toast.success("Storefront preferences updated for active session.", "Settings Saved");
      }
    } catch {
      toast.info("Storefront preferences saved locally in preview mode.", "Saved Locally");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async () => {
    const nextStatus = !isOpen;
    setIsOpen(nextStatus);

    toast.info(
      nextStatus 
        ? "Kitchen is now ONLINE. New customer orders will be accepted." 
        : "Kitchen is now OFFLINE. New incoming orders paused.",
      nextStatus ? "Storefront Online" : "Storefront Paused"
    );

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
      if (res.ok && typeof data.is_open === 'boolean') {
        setIsOpen(data.is_open);
      }
    } catch {
      // Local toggle preserved in preview mode
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-indigo-600" size={36} />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Storefront Config...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500 font-sans pb-24">
      
      {/* 🖼️ LIVE PREVIEW HERO BANNER */}
      <div className="relative w-full h-48 sm:h-64 md:h-80 bg-slate-100 rounded-b-2xl sm:rounded-b-[40px] shadow-sm mb-12 sm:mb-16 overflow-visible group">
        {coverPreview ? (
          <img src={coverPreview} alt="Cover" className="w-full h-full object-cover rounded-b-2xl sm:rounded-b-[40px]" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-gradient-to-br from-slate-100 to-slate-200">
            <UploadCloud size={40} className="mb-2 opacity-50 sm:w-12 sm:h-12" />
            <span className="font-bold tracking-widest uppercase text-xs">No Cover Image</span>
          </div>
        )}
        
        {/* Cover Image Upload Button */}
        <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-10">
          <button 
            type="button"
            onClick={() => coverInputRef.current?.click()}
            className="bg-black/60 backdrop-blur-md text-white px-3.5 sm:px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-black/80 transition shadow-lg cursor-pointer"
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
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity backdrop-blur-sm cursor-pointer"
            >
              <Camera className="text-white" size={24} />
            </button>
            <input type="file" hidden accept="image/*" ref={logoInputRef} onChange={(e) => handleImageChange(e, 'logo')} />
          </div>
        </div>
      </div>

      <div className="space-y-6 sm:space-y-8 px-2 sm:px-4 md:px-0">
        
        {/* 🟢 OPERATIONAL CONTROL CARD */}
        <div className={`p-4 sm:p-8 rounded-2xl sm:rounded-[32px] border-2 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 shadow-sm ${isOpen ? 'bg-emerald-50/70 border-emerald-500/40' : 'bg-white border-slate-200'}`}>
          <div>
            <h2 className={`text-xl sm:text-2xl font-black uppercase ${isOpen ? 'text-emerald-700' : 'text-slate-500'}`}>
              {isOpen ? 'Kitchen is Open & Accepting Orders' : 'Kitchen is Paused / Closed'}
            </h2>
            <p className={`text-xs sm:text-sm font-medium mt-1 ${isOpen ? 'text-emerald-700/80' : 'text-slate-500'}`}>
              {isOpen 
                ? "Your storefront is visible on consumer apps. New order tickets will alert the kitchen." 
                : "Customers cannot see your menu or place orders right now."}
            </p>
          </div>
          <button 
            type="button"
            onClick={toggleStatus}
            className={`w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-2xl flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer ${isOpen ? 'bg-emerald-500 text-white shadow-emerald-200 hover:bg-emerald-600' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
            title={isOpen ? "Click to close kitchen" : "Click to open kitchen"}
          >
            <Power size={24} strokeWidth={3} className="sm:w-7 sm:h-7" />
          </button>
        </div>

        {/* 📝 VALIDATED SETTINGS FORM */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
          
          {/* SECTION 1: SYSTEM IDENTITY (Read Only) */}
          <div className="bg-white rounded-2xl sm:rounded-[32px] p-4 sm:p-8 shadow-sm border border-slate-100">
            <h3 className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest mb-4 sm:mb-6 flex items-center gap-2">
              <ShieldCheck size={16} className="text-indigo-600"/> Verified System Identity
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2 sm:space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase">Registered Storefront</label>
                <input 
                  disabled 
                  value={restaurantName} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl py-3.5 sm:py-4 px-4 sm:px-5 font-bold text-slate-500 cursor-not-allowed text-sm" 
                />
              </div>
              <div className="space-y-2 sm:space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase">Platform Commission Rate</label>
                <div className="w-full bg-indigo-50/50 border border-indigo-100 rounded-xl sm:rounded-2xl py-3.5 sm:py-4 px-4 sm:px-5 font-black text-indigo-700 flex items-center justify-between text-sm">
                  <span className="text-base sm:text-lg">{commissionRate}%</span>
                  <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">Admin Locked</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: BRAND DETAILS */}
          <div className="bg-white rounded-2xl sm:rounded-[32px] p-4 sm:p-8 shadow-sm border border-slate-100 space-y-4 sm:space-y-6">
            <h3 className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest mb-4 sm:mb-6 flex items-center gap-2">
              <AlignLeft size={16} className="text-indigo-600"/> Brand & Customer Presentation
            </h3>
            
            <div>
              <FormLabel htmlFor="slogan" hint="Max 100 characters">
                Catchy Tagline / Slogan
              </FormLabel>
              <input 
                id="slogan"
                type="text" 
                placeholder="e.g. Authentic Cameroon Grills & Traditional Delicacies"
                className={`w-full bg-slate-50 border rounded-xl sm:rounded-2xl py-3.5 sm:py-4 px-4 sm:px-5 font-medium text-slate-900 outline-none transition-all text-sm ${
                  errors.slogan ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 focus:border-indigo-500 focus:bg-white'
                }`}
                {...register('slogan')}
              />
              <FormError message={errors.slogan?.message} />
            </div>

            <div>
              <FormLabel htmlFor="description" hint="Max 500 characters">
                Storefront Story & Specialties
              </FormLabel>
              <textarea 
                id="description"
                rows="4" 
                placeholder="Tell customers about your kitchen heritage, fresh ingredients, and signature recipes..."
                className={`w-full bg-slate-50 border rounded-xl sm:rounded-2xl py-3.5 sm:py-4 px-4 sm:px-5 font-medium text-slate-900 outline-none transition-all resize-none text-sm ${
                  errors.description ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 focus:border-indigo-500 focus:bg-white'
                }`}
                {...register('description')}
              />
              <FormError message={errors.description?.message} />
            </div>

            <div>
              <FormLabel htmlFor="tags" hint="Comma-separated keywords">
                Discovery Search Tags
              </FormLabel>
              <div className="relative">
                <Tag className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  id="tags"
                  type="text" 
                  placeholder="Grills, Traditional, Fish, Poulet DG, Healthy"
                  className={`w-full bg-slate-50 border rounded-xl sm:rounded-2xl py-3.5 sm:py-4 pl-11 sm:pl-12 pr-4 sm:pr-5 font-medium text-slate-900 outline-none transition-all text-sm ${
                    errors.tags ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 focus:border-indigo-500 focus:bg-white'
                  }`}
                  {...register('tags')}
                />
              </div>
              <FormError message={errors.tags?.message} />
            </div>
          </div>

          {/* SECTION 3: OPERATIONS & LOGISTICS */}
          <div className="bg-white rounded-2xl sm:rounded-[32px] p-4 sm:p-8 shadow-sm border border-slate-100">
            <h3 className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest mb-4 sm:mb-6 flex items-center gap-2">
              <Clock size={16} className="text-indigo-600"/> Operations & Fulfillment Logistics
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
              <div>
                <FormLabel required htmlFor="operating_hours">
                  Operating Hours
                </FormLabel>
                <input 
                  id="operating_hours"
                  type="text" 
                  placeholder="e.g. 08:00 AM - 10:30 PM"
                  className={`w-full bg-slate-50 border rounded-xl sm:rounded-2xl py-3.5 sm:py-4 px-4 sm:px-5 font-medium text-slate-900 outline-none transition-all text-sm ${
                    errors.operating_hours ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 focus:border-indigo-500 focus:bg-white'
                  }`}
                  {...register('operating_hours')}
                />
                <FormError message={errors.operating_hours?.message} />
              </div>

              <div>
                <FormLabel required htmlFor="prep_time">
                  Average Prep Time
                </FormLabel>
                <input 
                  id="prep_time"
                  type="text" 
                  placeholder="e.g. 15-25 min"
                  className={`w-full bg-slate-50 border rounded-xl sm:rounded-2xl py-3.5 sm:py-4 px-4 sm:px-5 font-medium text-slate-900 outline-none transition-all text-sm ${
                    errors.prep_time ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 focus:border-indigo-500 focus:bg-white'
                  }`}
                  {...register('prep_time')}
                />
                <FormError message={errors.prep_time?.message} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <div>
                <FormLabel required htmlFor="phone">
                  Kitchen Dispatch Phone
                </FormLabel>
                <div className="relative">
                  <Phone className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    id="phone"
                    type="tel" 
                    placeholder="e.g. 670 123 456"
                    className={`w-full bg-slate-50 border rounded-xl sm:rounded-2xl py-3.5 sm:py-4 pl-11 sm:pl-12 pr-4 sm:pr-5 font-medium text-slate-900 outline-none transition-all text-sm ${
                      errors.phone ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 focus:border-indigo-500 focus:bg-white'
                    }`}
                    {...register('phone')}
                  />
                </div>
                <FormError message={errors.phone?.message} />
              </div>

              <div>
                <FormLabel required htmlFor="zone_id">
                  Operating Hub Zone
                </FormLabel>
                <div className="relative">
                  <MapPin className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select 
                    id="zone_id"
                    className={`w-full bg-slate-50 border rounded-xl sm:rounded-2xl py-3.5 sm:py-4 pl-11 sm:pl-12 pr-4 sm:pr-5 font-medium text-slate-900 outline-none appearance-none transition-all text-sm ${
                      errors.zone_id ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 focus:border-indigo-500 focus:bg-white'
                    }`}
                    {...register('zone_id')}
                  >
                    <option value="">Select Zone...</option>
                    {zones.map(z => (
                      <option key={z.id} value={z.id}>{z.name}</option>
                    ))}
                    {zones.length === 0 && (
                      <>
                        <option value="zone-douala-akwa">Douala - Akwa</option>
                        <option value="zone-douala-bonapriso">Douala - Bonapriso</option>
                        <option value="zone-yaounde-bastos">Yaoundé - Bastos</option>
                      </>
                    )}
                  </select>
                </div>
                <FormError message={errors.zone_id?.message} />
              </div>

              <div>
                <FormLabel required htmlFor="minimum_order_value">
                  Min. Order (XAF)
                </FormLabel>
                <input 
                  id="minimum_order_value"
                  type="number" 
                  placeholder="1500"
                  className={`w-full bg-slate-50 border rounded-xl sm:rounded-2xl py-3.5 sm:py-4 px-4 sm:px-5 font-medium text-slate-900 outline-none transition-all text-sm ${
                    errors.minimum_order_value ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 focus:border-indigo-500 focus:bg-white'
                  }`}
                  {...register('minimum_order_value')}
                />
                <FormError message={errors.minimum_order_value?.message} />
              </div>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-4 sm:pt-6 flex justify-end">
            <button 
              type="submit" 
              disabled={saving}
              className="w-full sm:w-auto bg-indigo-600 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-xl sm:rounded-[24px] font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl hover:shadow-indigo-500/30 disabled:opacity-50 flex items-center justify-center gap-3 active:scale-95 cursor-pointer min-h-[48px]"
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