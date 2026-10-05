import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MapPin, Plus, X, Globe, ShieldCheck, Trash2, Loader2, DollarSign } from 'lucide-react';
import { API_URL, DEFAULT_ZONES, fetchSafeZones } from '../config';
import { useToast } from '../context/ToastContext';
import { zoneFormSchema } from '../schemas';
import { FormError, FormLabel } from '../components/FormField';

export default function Zones({ locations = [], setLocations }) {
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(zoneFormSchema),
    defaultValues: {
      name: '',
      base_price: 1000,
      risk: 'Low',
      is_active: true,
    },
    mode: 'onTouched',
  });

  const selectedRisk = watch('risk');

  // 🔄 1. FETCH ZONES
  const fetchZones = useCallback(async () => {
    try {
      const data = await fetchSafeZones();
      if (Array.isArray(data) && data.length > 0) {
        const formatted = data.map(z => ({
          ...z,
          status: z.is_active === false ? 'Inactive' : 'Active', 
          risk: z.risk || 'Low'
        }));
        setLocations(formatted);
      } else if (!locations || locations.length === 0) {
        setLocations(DEFAULT_ZONES);
      }
    } catch {
      if (!locations || locations.length === 0) {
        setLocations(DEFAULT_ZONES);
      }
    }
  }, [locations, setLocations]);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  // ➕ 2. CREATE ZONE WITH REACT HOOK FORM + ZOD
  const onSubmitZone = async (formData) => {
    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        base_price: Number(formData.base_price),
        risk: formData.risk,
      };

      const res = await fetch(`${API_URL}/zones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchZones(); 
        setIsModalOpen(false);
        reset();
        toast.success(`Territory "${formData.name}" successfully deployed at ${formData.base_price.toLocaleString()} XAF base fee.`, 'Zone Deployed');
      } else {
        const err = await res.json().catch(() => ({}));
        // Fallback optimistic addition if server is in demo/stub mode
        const newLocalZone = {
          id: `zone-${Date.now()}`,
          name: formData.name,
          base_price: Number(formData.base_price),
          risk: formData.risk,
          is_active: true,
          status: 'Active',
        };
        setLocations(prev => [newLocalZone, ...prev]);
        setIsModalOpen(false);
        reset();
        toast.info(err.error || `Added zone "${formData.name}" in local territory session.`, 'Territory Configured');
      }
    } catch {
      // Local fallback
      const newLocalZone = {
        id: `zone-${Date.now()}`,
        name: formData.name,
        base_price: Number(formData.base_price),
        risk: formData.risk,
        is_active: true,
        status: 'Active',
      };
      setLocations(prev => [newLocalZone, ...prev]);
      setIsModalOpen(false);
      reset();
      toast.info(`Configured "${formData.name}" locally in offline mode.`, 'Offline Addition');
    } finally {
      setLoading(false);
    }
  };

  // 🗑️ 3. DELETE ZONE
  const deleteZone = async (id, zoneName) => {
    // Optimistic Update
    setLocations(locations.filter(l => l.id !== id));

    try {
      const res = await fetch(`${API_URL}/zones/${id}`, { method: 'DELETE' });
      
      if (!res.ok) {
        // If server failed, keep local change in preview or revert if conflict
        toast.warning(`Zone "${zoneName}" removed from current session view.`, 'Zone Decommissioned');
      } else {
        toast.success(`Zone "${zoneName}" successfully decommissioned.`, 'Decommission Complete');
      }
    } catch {
      toast.info(`Zone "${zoneName}" removed from current session.`, 'Removed Locally');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans pb-24">
      
      {/* 🔝 HEADER */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b-2 border-slate-900 pb-6 gap-4">
        <div>
          <h2 className="text-slate-900 font-black text-xl sm:text-2xl uppercase tracking-tighter">Expansion Board</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Territorial Parameter Management</p>
        </div>
        
        <button 
          onClick={() => {
            reset();
            setIsModalOpen(true);
          }}
          className="w-full sm:w-auto bg-slate-900 text-white px-6 py-3 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-md flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
        >
          <Plus size={16} /> New Zone
        </button>
      </div>

      {/* 🗺️ ZONE GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {locations.map((zone) => (
          <div key={zone.id} className="bg-white border border-slate-200 rounded-xl shadow-sm hover:border-slate-400 transition-all flex flex-col group">
            
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-50 flex justify-between items-start">
              <div className="p-2.5 bg-slate-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <MapPin size={18} />
              </div>
              <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase border ${
                  zone.status === 'Active' 
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                  : 'bg-rose-50 text-rose-600 border-rose-100'
              }`}>
                {zone.status}
              </span>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-5 flex-1">
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight mb-4 truncate">{zone.name}</h3>
              
              <div className="grid grid-cols-2 gap-2">
                {/* 💰 Price Badge */}
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <p className="text-[8px] font-bold text-slate-400 uppercase mb-0.5">Base Fee</p>
                  <p className="text-[10px] font-black text-slate-700 flex items-center gap-1 truncate">
                    <DollarSign size={10} className="text-emerald-500 shrink-0" />
                    {zone.base_price?.toLocaleString()} XAF
                  </p>
                </div>
                
                {/* Risk Badge */}
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <p className="text-[8px] font-bold text-slate-400 uppercase mb-0.5">Risk</p>
                  <p className="text-[10px] font-black text-slate-700 flex items-center gap-1">
                    <ShieldCheck size={10} className={zone.risk === 'Low' ? 'text-emerald-500' : 'text-amber-500'} />
                    {zone.risk}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-4 sm:px-5 py-3 bg-slate-50/50 border-t border-slate-50 flex justify-end">
              <button 
                onClick={() => deleteZone(zone.id, zone.name)}
                className="text-slate-400 hover:text-rose-600 transition-colors p-2 rounded-lg hover:bg-white cursor-pointer"
                title="Decommission Zone"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}

        {/* ➕ GHOST CARD */}
        <div 
          onClick={() => {
            reset();
            setIsModalOpen(true);
          }}
          className="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-6 sm:p-8 text-slate-300 hover:border-indigo-300 hover:text-indigo-400 cursor-pointer transition-all bg-slate-50/20 min-h-[140px]"
        >
          <Globe size={32} strokeWidth={1.5} />
          <p className="mt-2 font-black text-[9px] uppercase tracking-widest text-center">Establish New<br/>Territory</p>
        </div>
      </div>

      {/* 📋 MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-3 sm:p-4">
          <div className="bg-white w-full max-w-sm border border-slate-200 shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 relative rounded-2xl sm:rounded-3xl max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="absolute top-4 sm:top-6 right-4 sm:right-6 text-slate-400 hover:text-slate-900 p-2 cursor-pointer"
            >
              <X size={20} />
            </button>
            
            <div className="mb-6 pr-6">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">New Territory Zone</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Platform coverage & rate configuration</p>
            </div>
            
            <form onSubmit={handleSubmit(onSubmitZone)} className="space-y-5">
              {/* NAME INPUT */}
              <div>
                <FormLabel required htmlFor="zone-name">Zone Title</FormLabel>
                <input 
                  id="zone-name"
                  type="text" 
                  className={`w-full bg-slate-50 border px-4 py-3 font-bold text-slate-900 outline-none rounded-xl transition-all ${
                    errors.name ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:border-slate-900'
                  }`} 
                  placeholder="e.g. Douala - Akwa Central" 
                  {...register('name')}
                />
                <FormError message={errors.name?.message} />
              </div>

              {/* 💰 PRICE INPUT */}
              <div>
                <FormLabel required htmlFor="zone-price" hint="300 - 25,000 XAF">Base Delivery Fee</FormLabel>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-slate-400 font-bold text-xs">XAF</span>
                  <input 
                    id="zone-price"
                    type="number" 
                    step="50"
                    className={`w-full bg-slate-50 border pl-14 pr-4 py-3 font-bold text-slate-900 outline-none rounded-xl transition-all ${
                      errors.base_price ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:border-slate-900'
                    }`} 
                    placeholder="1000"
                    {...register('base_price')}
                  />
                </div>
                <FormError message={errors.base_price?.message} />
              </div>

              {/* RISK TOGGLE */}
              <div>
                <FormLabel>Risk Classification</FormLabel>
                <div className="grid grid-cols-2 gap-3">
                  {['Low', 'High'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setValue('risk', r, { shouldValidate: true })}
                      className={`py-3 rounded-xl font-black text-[10px] uppercase tracking-widest border-2 transition-all cursor-pointer ${
                        selectedRisk === r 
                          ? 'bg-slate-900 border-slate-900 text-white shadow-sm' 
                          : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {r} Risk
                    </button>
                  ))}
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:bg-black transition-all active:scale-95 flex justify-center items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : 'Deploy Zone'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}