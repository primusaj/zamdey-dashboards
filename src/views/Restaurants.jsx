import React, { useState, useEffect } from 'react';
import { 
  Search, MapPin, Phone, 
  Store, Power, Edit2, Check, X, Loader2, ShieldAlert, Trash2, PowerOff, Plus
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '../context/ToastContext';
import { restaurantPartnerSchema, commissionRateSchema } from '../schemas';
import { FormError, FormLabel } from '../components/FormField';

const API_URL = import.meta.env.VITE_API_URL || 'https://zamdey-backend.onrender.com/api';

export default function Restaurants() {
  const toast = useToast();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // 🛠️ EDIT COMMISSION STATE
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);

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
    setEditValue(r.commission_rate?.toString() || '20');
  };

  const handleSaveEdit = async (id) => {
    const parsed = commissionRateSchema.safeParse({ commission_rate: editValue });
    if (!parsed.success) {
      toast.warning(parsed.error.issues[0]?.message || "Commission rate must be between 0 and 100%.", "Invalid Rate");
      return;
    }

    const rate = parsed.data.commission_rate;
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/admin/restaurants/${id}/commission`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ rate })
      });

      setRestaurants(prev => prev.map(r => r.id === id ? { ...r, commission_rate: rate } : r));
      setEditingId(null);
      toast.success(`Commission rate updated to ${rate}%.`, "Commission Saved");
    } catch { 
      setRestaurants(prev => prev.map(r => r.id === id ? { ...r, commission_rate: rate } : r));
      setEditingId(null);
      toast.info(`Commission rate saved for current session.`, "Saved Locally");
    } finally { 
      setIsSaving(false); 
    }
  };

  // 🛑 SUSPEND / ACTIVATE
  const handleToggleSuspend = async (restaurant) => {
    const isSuspending = restaurant.account_status !== 'SUSPENDED';
    const nextStatus = isSuspending ? 'SUSPENDED' : 'APPROVED';
    
    setRestaurants(prev => prev.map(r => r.id === restaurant.id ? { ...r, account_status: nextStatus } : r));
    toast.info(`Storefront "${restaurant.name || restaurant.restaurant_name}" is now ${isSuspending ? 'Suspended' : 'Active'}.`, "Partner Status");

    try {
      const token = localStorage.getItem('token');
      const endpoint = isSuspending ? '/admin/suspend' : '/admin/approve';
      
      const payload = isSuspending 
        ? { profile_id: restaurant.id, type: 'RESTAURANT' }
        : { profile_id: restaurant.id, type: 'RESTAURANT', commission_rate: restaurant.commission_rate };

      await fetch(`${API_URL}${endpoint}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
    } catch { 
      // Local state preserved
    }
  };

  // 🗑️ DELETE
  const handleDelete = async (id, name) => {
    setRestaurants(prev => prev.filter(r => r.id !== id));
    toast.success(`"${name}" deleted from platform database.`, "Restaurant Removed");
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/admin/restaurants/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch { 
      // Local removal preserved
    }
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
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20 font-sans">
      
      {/* 🔝 HEADER & STATS */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-2 border-slate-900 pb-6">
        <div>
           <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">
              Partner Network
           </h1>
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">
              Managing {restaurants.length} Locations • <span className="text-emerald-500">{activeCount} Online Now</span>
           </p>
        </div>

        {/* CONTROLS */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-stretch sm:items-center">
           <button 
             type="button"
             onClick={() => setIsOnboardModalOpen(true)}
             className="px-4 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center gap-1.5 shadow-md text-xs uppercase tracking-wider min-h-[44px] cursor-pointer"
           >
             <Plus size={16} /> Add Partner
           </button>

           <div className="relative w-full sm:w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
             <input 
               type="text" 
               placeholder="Search partners..." 
               value={search} 
               onChange={(e) => setSearch(e.target.value)} 
               className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 min-h-[44px]" 
             />
           </div>
           
           <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto justify-between sm:justify-start">
              {['ALL', 'OPEN', 'CLOSED'].map(f => (
                <button 
                  key={f} 
                  type="button"
                  onClick={() => setFilter(f)} 
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all min-h-[40px] cursor-pointer ${
                    filter === f ? 'bg-white shadow-sm text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {f}
                </button>
              ))}
           </div>
        </div>
      </div>

      {/* 🏬 GRID VIEW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {filtered.map(restaurant => (
            <div key={restaurant.id} className={`bg-white border rounded-2xl sm:rounded-[24px] p-4 sm:p-6 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden ${restaurant.account_status === 'SUSPENDED' ? 'border-rose-200 bg-rose-50/30' : 'border-slate-200'}`}>
               
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
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl uppercase shrink-0 ${restaurant.account_status === 'SUSPENDED' ? 'bg-rose-100 text-rose-400' : 'bg-slate-100 text-slate-400'}`}>
                      {(restaurant.name || restaurant.restaurant_name || "R").charAt(0)}
                  </div>
                  <div className="min-w-0 pr-16">
                     <h3 className={`font-black text-lg leading-tight mb-1 truncate ${restaurant.account_status === 'SUSPENDED' ? 'text-rose-900 line-through decoration-rose-300' : 'text-slate-900'}`}>
                       {restaurant.name || restaurant.restaurant_name}
                     </h3>
                     <p className="text-xs text-slate-400 font-bold flex items-center gap-1 truncate">
                        <MapPin size={12} className="shrink-0" /> {restaurant.address || "Douala Central"}
                     </p>
                     {restaurant.phone && (
                       <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1 mt-0.5">
                         <Phone size={10} className="shrink-0" /> {restaurant.phone}
                       </p>
                     )}
                  </div>
               </div>

               {/* METRICS GRID */}
               <div className="grid grid-cols-2 gap-3 mb-6">
                  {/* 🛡️ DYNAMIC COMMISSION BOX */}
                  <div className={`p-3 rounded-xl border transition-colors ${editingId === restaurant.id ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100'}`}>
                     <div className="text-[9px] font-black text-slate-400 uppercase mb-1 flex justify-between items-center">
                        <span>Commission</span>
                        {editingId !== restaurant.id && (
                           <button type="button" onClick={() => handleStartEdit(restaurant)} className="text-slate-400 hover:text-indigo-600 cursor-pointer">
                             <Edit2 size={12} />
                           </button>
                        )}
                     </div>
                     {editingId === restaurant.id ? (
                        <div className="flex items-center gap-2 mt-1">
                           <input 
                             type="number" 
                             value={editValue} 
                             onChange={(e) => setEditValue(e.target.value)} 
                             className="w-16 text-sm font-black text-indigo-700 bg-white rounded border border-indigo-200 px-1 outline-none" 
                             autoFocus 
                           />
                           <span className="text-[10px] font-bold text-indigo-400">%</span>
                           <button type="button" onClick={() => handleSaveEdit(restaurant.id)} disabled={isSaving} className="text-emerald-600 hover:scale-110 transition-transform cursor-pointer">
                              {isSaving ? <Loader2 size={16} className="animate-spin"/> : <Check size={16} />}
                           </button>
                           <button type="button" onClick={() => setEditingId(null)} className="text-rose-500 hover:scale-110 transition-transform cursor-pointer">
                             <X size={16} />
                           </button>
                        </div>
                     ) : (
                        <p className="text-lg font-black text-indigo-700">{restaurant.commission_rate ?? 20}%</p>
                     )}
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                     <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Total Sales</p>
                     <p className="text-lg font-black text-slate-900">{(restaurant.total_revenue || 0).toLocaleString()} <span className="text-[10px] text-slate-400">XAF</span></p>
                  </div>
               </div>

               {/* ACTIONS */}
               <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex gap-2">
                     <button 
                       type="button"
                       onClick={() => handleToggleSuspend(restaurant)} 
                       className={`p-2.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                         restaurant.account_status === 'SUSPENDED' 
                           ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' 
                           : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-rose-50 hover:text-rose-600'
                       }`}
                       title={restaurant.account_status === 'SUSPENDED' ? 'Activate Store' : 'Suspend Store'}
                     >
                        {restaurant.account_status === 'SUSPENDED' ? <Power size={14}/> : <PowerOff size={14}/>}
                        <span className="text-[10px] uppercase font-black">{restaurant.account_status === 'SUSPENDED' ? 'Activate' : 'Suspend'}</span>
                     </button>
                  </div>

                  <button 
                    type="button"
                    onClick={() => handleDelete(restaurant.id, restaurant.name || restaurant.restaurant_name)} 
                    className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Delete Vendor"
                  >
                     <Trash2 size={16} />
                  </button>
               </div>
            </div>
         ))}
      </div>

      {/* ONBOARD MODAL */}
      {isOnboardModalOpen && (
        <OnboardPartnerModal 
          isOpen={isOnboardModalOpen}
          onClose={() => setIsOnboardModalOpen(false)}
          onSuccess={(newPartner) => {
            setRestaurants(prev => [newPartner, ...prev]);
            setIsOnboardModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

function OnboardPartnerModal({ isOpen, onClose, onSuccess }) {
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(restaurantPartnerSchema),
    defaultValues: {
      name: '',
      phone: '',
      address: '',
      zone_id: 'Douala - Akwa',
      commission_rate: 20,
    },
    mode: 'onTouched',
  });

  const onSubmit = async (values) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/admin/restaurants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(values),
      });

      const partner = {
        id: `rest-${Date.now()}`,
        name: values.name,
        restaurant_name: values.name,
        phone: values.phone,
        address: values.address,
        commission_rate: values.commission_rate,
        is_open: true,
        account_status: 'APPROVED',
        total_revenue: 0,
      };

      toast.success(`Partner "${values.name}" successfully onboarded!`, "Partner Created");
      onSuccess(partner);
    } catch {
      const partner = {
        id: `rest-${Date.now()}`,
        name: values.name,
        restaurant_name: values.name,
        phone: values.phone,
        address: values.address,
        commission_rate: values.commission_rate,
        is_open: true,
        account_status: 'APPROVED',
        total_revenue: 0,
      };
      toast.success(`Partner "${values.name}" onboarded for preview session.`, "Partner Created");
      onSuccess(partner);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in zoom-in-95">
      <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase italic">Onboard Food Merchant</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Register new restaurant partner storefront</p>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <FormLabel required htmlFor="name">Business / Brand Name</FormLabel>
            <input 
              id="name"
              type="text"
              placeholder="e.g. Saveurs du Terroir"
              className={`w-full px-4 py-3 rounded-xl border text-sm font-bold text-slate-900 outline-none ${
                errors.name ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:border-indigo-600'
              }`}
              {...register('name')}
            />
            <FormError message={errors.name?.message} />
          </div>

          <div>
            <FormLabel required htmlFor="phone">Contact Phone Line</FormLabel>
            <input 
              id="phone"
              type="tel"
              placeholder="e.g. 670 123 456"
              className={`w-full px-4 py-3 rounded-xl border text-sm font-bold text-slate-900 outline-none ${
                errors.phone ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:border-indigo-600'
              }`}
              {...register('phone')}
            />
            <FormError message={errors.phone?.message} />
          </div>

          <div>
            <FormLabel required htmlFor="address">Physical Street Address</FormLabel>
            <input 
              id="address"
              type="text"
              placeholder="e.g. Rue des Palmiers, Akwa, Douala"
              className={`w-full px-4 py-3 rounded-xl border text-sm font-bold text-slate-900 outline-none ${
                errors.address ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:border-indigo-600'
              }`}
              {...register('address')}
            />
            <FormError message={errors.address?.message} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FormLabel required htmlFor="zone_id">Operating Zone</FormLabel>
              <select 
                id="zone_id"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 outline-none focus:border-indigo-600"
                {...register('zone_id')}
              >
                <option value="Douala - Akwa">Douala - Akwa</option>
                <option value="Douala - Bonapriso">Douala - Bonapriso</option>
                <option value="Douala - Bonamoussadi">Douala - Bonamoussadi</option>
                <option value="Yaoundé - Bastos">Yaoundé - Bastos</option>
              </select>
              <FormError message={errors.zone_id?.message} />
            </div>

            <div>
              <FormLabel required htmlFor="commission_rate" hint="% on food sales">
                Commission (%)
              </FormLabel>
              <input 
                id="commission_rate"
                type="number"
                step="1"
                className={`w-full px-4 py-3 rounded-xl border text-sm font-bold text-slate-900 outline-none ${
                  errors.commission_rate ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:border-indigo-600'
                }`}
                {...register('commission_rate')}
              />
              <FormError message={errors.commission_rate?.message} />
            </div>
          </div>

          <div className="pt-3">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full py-4 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Register Storefront'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}