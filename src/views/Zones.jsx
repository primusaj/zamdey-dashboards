import React, { useState, useEffect } from 'react';
import { MapPin, Plus, X, Globe, TrendingUp, ShieldCheck, Trash2, Loader2, DollarSign } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Zones({ locations = [], setLocations }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 💰 UPDATED STATE: Includes base_price now
  const [newZone, setNewZone] = useState({ name: "", base_price: 1000, risk: "Low" });
  const [loading, setLoading] = useState(false);

  // 🔄 1. FETCH ZONES
  const fetchZones = async () => {
    try {
      const res = await fetch(`${API_URL}/zones`);
      if (res.ok) {
        const data = await res.json();
        
        // Map backend data to UI format
        const formatted = data.map(z => ({
          ...z,
          // Use real DB status if available, else default to 'Active'
          status: z.is_active === false ? 'Inactive' : 'Active', 
          risk: 'Low' // We still simulate risk for UI flair (can be added to DB later)
        }));
        setLocations(formatted);
      }
    } catch (error) {
      console.error("Failed to sync zones");
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  // ➕ 2. CREATE ZONE (Send Price to Backend)
  const handleAddZone = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
          name: newZone.name,
          base_price: parseFloat(newZone.base_price) // 💰 Send price
      };

      const res = await fetch(`${API_URL}/zones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        await fetchZones(); 
        setIsModalOpen(false);
        setNewZone({ name: "", base_price: 1000, risk: "Low" });
      } else {
        const err = await res.json();
        alert("Error: " + (err.error || "Failed to create zone"));
      }
    } catch (error) {
      alert("Network Error: Could not save zone.");
    } finally {
      setLoading(false);
    }
  };

  // 🗑️ 3. DELETE ZONE (Real API Call)
  const deleteZone = async (id) => {
    if (!window.confirm("Confirm zone decommission? Operations in this area will cease.")) return;

    // Optimistic Update (Remove immediately for speed)
    const originalList = [...locations];
    setLocations(locations.filter(l => l.id !== id));

    try {
        const res = await fetch(`${API_URL}/zones/${id}`, { method: 'DELETE' });
        
        if (!res.ok) {
            // Revert if failed
            setLocations(originalList);
            alert("Cannot delete zone. It might contain Active Restaurants.");
        }
    } catch (e) {
        setLocations(originalList);
        alert("Server Error: Could not delete.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans pb-24">
      
      {/* 🔝 HEADER */}
      <div className="flex justify-between items-center border-b-2 border-slate-900 pb-6">
        <div>
          <h2 className="text-slate-900 font-black text-2xl uppercase tracking-tighter">Expansion Board</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Territorial Parameter Management</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 text-white px-6 py-3 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-md flex items-center gap-2"
        >
          <Plus size={16} /> New Zone
        </button>
      </div>

      {/* 🗺️ ZONE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {locations.map((zone) => (
          <div key={zone.id} className="bg-white border border-slate-200 rounded-xl shadow-sm hover:border-slate-400 transition-all flex flex-col group">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-50 flex justify-between items-start">
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
            <div className="p-5 flex-1">
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight mb-4">{zone.name}</h3>
              
              <div className="grid grid-cols-2 gap-2">
                {/* 💰 Price Badge */}
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <p className="text-[8px] font-bold text-slate-400 uppercase mb-0.5">Base Fee</p>
                  <p className="text-[10px] font-black text-slate-700 flex items-center gap-1">
                    <DollarSign size={10} className="text-emerald-500" />
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
            <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-50 flex justify-end">
              <button 
                onClick={() => deleteZone(zone.id)}
                className="text-slate-300 hover:text-rose-600 transition-colors p-1"
                title="Decommission Zone"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}

        {/* ➕ GHOST CARD */}
        <div 
          onClick={() => setIsModalOpen(true)}
          className="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-8 text-slate-300 hover:border-indigo-300 hover:text-indigo-400 cursor-pointer transition-all bg-slate-50/20"
        >
          <Globe size={32} strokeWidth={1.5} />
          <p className="mt-2 font-black text-[9px] uppercase tracking-widest text-center">Establish New<br/>Territory</p>
        </div>
      </div>

      {/* 📋 MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4">
          <div className="bg-white w-full max-w-sm border border-slate-200 shadow-2xl p-10 animate-in zoom-in-95 relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900"><X size={20} /></button>
            
            <div className="mb-8">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">New Zone</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Platform expansion setting</p>
            </div>
            
            <form onSubmit={handleAddZone} className="space-y-6">
              {/* NAME INPUT */}
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase mb-1.5 block tracking-widest">Zone Name</label>
                <input 
                  required 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 font-bold text-slate-900 outline-none focus:border-slate-900 transition-all placeholder:text-slate-200" 
                  placeholder="e.g. COMMERCIAL AVENUE" 
                  value={newZone.name}
                  onChange={(e) => setNewZone({...newZone, name: e.target.value})} 
                />
              </div>

              {/* 💰 PRICE INPUT */}
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase mb-1.5 block tracking-widest">Base Delivery Fee (XAF)</label>
                <div className="relative">
                    <span className="absolute left-4 top-3.5 text-slate-400 font-bold text-xs">FCFA</span>
                    <input 
                    required 
                    type="number" 
                    min="0"
                    step="100"
                    className="w-full bg-slate-50 border border-slate-200 pl-14 pr-4 py-3 font-bold text-slate-900 outline-none focus:border-slate-900 transition-all" 
                    value={newZone.base_price}
                    onChange={(e) => setNewZone({...newZone, base_price: e.target.value})} 
                    />
                </div>
              </div>

              {/* RISK TOGGLE */}
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase mb-1.5 block tracking-widest">Risk Factor</label>
                <div className="grid grid-cols-2 gap-3">
                  {['Low', 'High'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setNewZone({...newZone, risk: r})}
                      className={`py-3 rounded-lg font-black text-[10px] uppercase tracking-widest border-2 transition-all ${
                        newZone.risk === r ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-100 text-slate-400'
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
                className="w-full bg-slate-900 text-white py-4 rounded-lg font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:bg-black transition-all active:scale-95 flex justify-center"
              >
                {loading ? <Loader2 className="animate-spin" /> : 'Deploy Zone'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}