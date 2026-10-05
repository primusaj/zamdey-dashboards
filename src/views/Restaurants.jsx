import React, { useState, useEffect } from 'react';
import { 
  Search, MapPin, Phone, 
  Store, Power, Edit2, Check, X, Loader2, ShieldAlert, Trash2, PowerOff
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://zamdey-backend.onrender.com/api:5000/api';

export default function Restaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // 🛠️ EDIT STATE
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // 🔄 FETCH
  const fetchRestaurants = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/admin/restaurants`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRestaurants(data);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  // ✏️ COMMISSION EDIT
  const handleStartEdit = (r) => {
    setEditingId(r.id);
    setEditValue(r.commission_rate);
  };

  const handleSaveEdit = async (id) => {
    const num = parseFloat(editValue);
    if (isNaN(num) || num < 0 || num > 100) return alert("Please enter a valid percentage (0-100)");

    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/admin/restaurants/${id}/commission`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ rate: num })
      });

      if (res.ok) {
        setRestaurants(prev => prev.map(r => r.id === id ? { ...r, commission_rate: num } : r));
        setEditingId(null);
      } else { alert("Failed to update commission"); }
    } catch (error) { console.error("Save Error:", error); } finally { setIsSaving(false); }
  };

  // 🛑 SUSPEND / ACTIVATE
  const handleToggleSuspend = async (restaurant) => {
      const isSuspending = restaurant.account_status !== 'SUSPENDED';
      const actionText = isSuspending ? 'SUSPEND' : 'ACTIVATE';
      
      if(!window.confirm(`⚠️ Are you sure you want to ${actionText} ${restaurant.name}?`)) return;
      
      try {
        const token = localStorage.getItem('token');
        const endpoint = isSuspending ? '/admin/suspend' : '/admin/approve';
        
        const payload = isSuspending 
            ? { profile_id: restaurant.id, type: 'RESTAURANT' }
            : { profile_id: restaurant.id, type: 'RESTAURANT', commission_rate: restaurant.commission_rate };

        const res = await fetch(`${API_URL}${endpoint}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
  
        if (res.ok) { fetchRestaurants(); } else { alert("Action failed"); }
      } catch (error) { alert("Network Error"); }
  };

  // 🗑️ DELETE
  const handleDelete = async (id, name) => {
      if(!window.confirm(`🧨 DANGER: Permanently delete ${name} and all their data? This cannot be undone.`)) return;
      
      try {
          const token = localStorage.getItem('token');
          const res = await fetch(`${API_URL}/admin/restaurants/${id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (res.ok) {
              setRestaurants(prev => prev.filter(r => r.id !== id));
          } else { alert("Failed to delete restaurant"); }
      } catch (error) { alert("Network Error"); }
  };

  // 🔍 FILTER LOGIC
  const filtered = restaurants.filter(r => {
    const matchesSearch = (r.name || r.restaurant_name || "").toLowerCase().includes(search.toLowerCase());
    const matchesFilter = 
      filter === 'ALL' ? true :
      filter === 'OPEN' ? r.is_open :
      filter === 'CLOSED' ? !r.is_open : true;
    return matchesSearch && matchesFilter;
  });

  const activeCount = restaurants.filter(r => r.is_open).length;

  if (loading) return (
    <div className="flex h-96 items-center justify-center flex-col">
       <Loader2 className="animate-spin text-slate-300 mb-4" size={40} />
       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Vendors...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* 🔝 HEADER & STATS */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-2 border-slate-900 pb-6">
        <div>
           <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">
              Partner Network
           </h1>
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">
              Managing {restaurants.length} Locations • <span className="text-emerald-500">{activeCount} Online Now</span>
           </p>
        </div>

        {/* CONTROLS */}
        <div className="flex gap-3">
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
             <input type="text" placeholder="Search partners..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 w-64" />
           </div>
           
           <div className="flex bg-slate-100 p-1 rounded-xl">
              {['ALL', 'OPEN', 'CLOSED'].map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${filter === f ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
                  {f}
                </button>
              ))}
           </div>
        </div>
      </div>

      {/* 🏬 GRID VIEW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {filtered.map(restaurant => (
            <div key={restaurant.id} className={`bg-white border rounded-[24px] p-6 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden ${restaurant.account_status === 'SUSPENDED' ? 'border-rose-200 bg-rose-50/30' : 'border-slate-200'}`}>
               
               {/* STATUS BADGES */}
               <div className="absolute top-4 right-4 flex gap-2">
                   {restaurant.account_status === 'SUSPENDED' && (
                       <div className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border bg-rose-100 text-rose-600 border-rose-200 flex items-center gap-1">
                          <ShieldAlert size={10}/> Suspended
                       </div>
                   )}
                   <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      restaurant.is_open ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                   }`}>
                      {restaurant.is_open ? 'Open' : 'Closed'}
                   </div>
               </div>

               {/* MAIN INFO */}
               <div className="flex items-start gap-4 mb-6">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl uppercase ${restaurant.account_status === 'SUSPENDED' ? 'bg-rose-100 text-rose-400' : 'bg-slate-100 text-slate-300'}`}>
                      {(restaurant.name || "R").charAt(0)}
                  </div>
                  <div>
                     <h3 className={`font-black text-lg leading-tight mb-1 ${restaurant.account_status === 'SUSPENDED' ? 'text-rose-900 line-through decoration-rose-300' : 'text-slate-900'}`}>{restaurant.name}</h3>
                     <p className="text-xs text-slate-400 font-bold flex items-center gap-1">
                        <MapPin size={12} /> {restaurant.address || "No Address"}
                     </p>
                  </div>
               </div>

               {/* METRICS GRID */}
               <div className="grid grid-cols-2 gap-3 mb-6">
                  {/* 🛡️ DYNAMIC COMMISSION BOX */}
                  <div className={`p-3 rounded-xl border transition-colors ${editingId === restaurant.id ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100'}`}>
                     <p className="text-[9px] font-black text-slate-400 uppercase mb-1 flex justify-between">
                        Commission
                        {editingId !== restaurant.id && (
                           <button onClick={() => handleStartEdit(restaurant)} className="text-slate-400 hover:text-indigo-600"><Edit2 size={12} /></button>
                        )}
                     </p>
                     {editingId === restaurant.id ? (
                        <div className="flex items-center gap-2 mt-1">
                           <input type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="w-16 text-sm font-black text-indigo-700 bg-white rounded border border-indigo-200 px-1 outline-none" autoFocus />
                           <span className="text-[10px] font-bold text-indigo-400">%</span>
                           <button onClick={() => handleSaveEdit(restaurant.id)} disabled={isSaving} className="text-emerald-600 hover:scale-110 transition-transform">
                              {isSaving ? <Loader2 size={16} className="animate-spin"/> : <Check size={16} />}
                           </button>
                           <button onClick={() => setEditingId(null)} className="text-rose-500 hover:scale-110 transition-transform"><X size={16} /></button>
                        </div>
                     ) : (
                        <p className="text-sm font-black text-slate-900">{restaurant.commission_rate}%</p>
                     )}
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-100">
                     <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Wallet</p>
                     <p className="text-sm font-black text-emerald-600">{(restaurant.wallet_balance || 0).toLocaleString()} FRS</p>
                  </div>
               </div>

               {/* FOOTER ACTIONS */}
               <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                     <Phone size={14} /> {restaurant.phone}
                  </div>
                  <div className="flex gap-2">
                     <button 
                        onClick={() => handleToggleSuspend(restaurant)}
                        className={`p-2 rounded-lg transition-colors border ${restaurant.account_status === 'SUSPENDED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-500 hover:text-white' : 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-500 hover:text-white'}`}
                        title={restaurant.account_status === 'SUSPENDED' ? "Re-Activate Account" : "Suspend Account"}
                     >
                        <PowerOff size={16} />
                     </button>
                     <button 
                        onClick={() => handleDelete(restaurant.id, restaurant.name)}
                        className="p-2 bg-rose-50 text-rose-500 border border-rose-100 rounded-lg hover:bg-rose-500 hover:text-white transition-colors"
                        title="Delete Restaurant"
                     >
                        <Trash2 size={16} />
                     </button>
                  </div>
               </div>
            </div>
         ))}
      </div>
    </div>
  );
}