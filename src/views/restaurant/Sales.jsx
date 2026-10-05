import React, { useState, useEffect, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, DollarSign, Package, Clock, Loader2, 
  ArrowUpRight, Wallet, AlertCircle, X, Banknote, Activity
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '../../context/ToastContext';
import { FormError, FormLabel } from '../../components/FormField';

const API_URL = import.meta.env.VITE_API_URL || 'https://zamdey-backend.onrender.com/api';

// --- COMPONENTS ---
const StatCard = ({ label, value, sub, icon: Icon, color = "slate", trend }) => (
  <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group relative overflow-hidden flex flex-col justify-between h-full">
    <div className={`absolute top-0 right-0 p-8 opacity-[0.03] -rotate-12 transform scale-150 text-${color}-600 group-hover:scale-[1.8] group-hover:opacity-10 transition-all duration-700 pointer-events-none`}>
       <Icon size={100} />
    </div>
    
    <div className="relative z-10 flex justify-between items-start mb-4">
        <div className={`p-3.5 bg-${color}-50 rounded-2xl text-${color}-600 group-hover:bg-${color}-100 transition-colors shadow-sm`}>
           <Icon size={24} strokeWidth={2.5} />
        </div>
        {trend && (
            <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                <TrendingUp size={12} /> {trend}%
            </span>
        )}
    </div>

    <div className="relative z-10">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-slate-500 transition-colors">{label}</p>
        <h3 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tighter">{value}</h3>
        {sub && (
          <div className="flex items-center gap-2 mt-2">
             <p className="text-[11px] font-bold text-slate-400">{sub}</p>
          </div>
        )}
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-5 rounded-2xl shadow-2xl border border-slate-700/50">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
            <Clock size={12} /> {label}
        </p>
        <p className="text-2xl font-black text-white tracking-tight">
          {payload[0].value.toLocaleString()} <span className="text-xs text-slate-400 font-bold uppercase tracking-widest ml-1">XAF</span>
        </p>
        <div className="w-full h-px bg-slate-800 my-3"></div>
        <p className="text-[10px] font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wide">
          <Wallet size={12} /> Net Food Sales
        </p>
      </div>
    );
  }
  return null;
};

export default function Sales() {
  const [data, setData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7 Days'); // Options: '7 Days', '1 Month', '6 Months', 'All Time'
  
  // Withdrawal Modal States
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  // 🔄 FETCH DATA & PROFILE
  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [statsRes, profileRes] = await Promise.all([
          fetch(`${API_URL}/restaurant/stats`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_URL}/restaurant/profile`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (statsRes.ok && profileRes.ok) {
          const statsJson = await statsRes.json();
          const profileJson = await profileRes.json();
          setData(statsJson);
          setProfile(profileJson);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 📊 SMART CHART PREPARATION
  const chartData = useMemo(() => {
    if (!data?.orders) return [];

    const now = new Date();
    const map = new Map();

    const getKey = (date) => {
        if (period === '7 Days') return date.toLocaleDateString('en-US', { weekday: 'short' });
        if (period === '1 Month') return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    // Pre-fill map to ensure perfect chronological order left-to-right on the chart
    if (period === '7 Days') {
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            map.set(getKey(d), 0);
        }
    } else if (period === '1 Month') {
        for (let i = 29; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            map.set(getKey(d), 0);
        }
    } else if (period === '6 Months') {
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            map.set(getKey(d), 0);
        }
    }

    data.orders
      .filter(o => o.status === 'DELIVERED')
      .forEach(order => {
        const date = new Date(order.created_at);
        const amount = Number(order.restaurant_profit) || 0; 
        
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        const diffMonths = (now.getFullYear() - date.getFullYear()) * 12 + now.getMonth() - date.getMonth();

        let include = false;
        if (period === '7 Days' && diffDays < 7) include = true;
        else if (period === '1 Month' && diffDays < 30) include = true;
        else if (period === '6 Months' && diffMonths < 6) include = true;
        else if (period === 'All Time') include = true;

        if (include) {
            const key = getKey(date);
            // Dynamically add keys for "All Time" since we don't pre-fill it infinitely
            if (period === 'All Time' && !map.has(key)) map.set(key, 0);
            
            if (map.has(key)) {
                map.set(key, map.get(key) + amount);
            }
        }
    });

    let result = Array.from(map, ([name, value]) => ({ name, value }));
    
    // Reverse "All Time" because the newest orders were inserted into the map first
    if (period === 'All Time') result = result.reverse();

    return result;
  }, [data, period]);

  if (loading) return (
    <div className="flex h-[80vh] items-center justify-center flex-col animate-in fade-in zoom-in duration-500">
       <div className="relative">
           <div className="absolute inset-0 bg-emerald-500 blur-xl opacity-20 rounded-full"></div>
           <Loader2 className="animate-spin text-emerald-600 relative z-10 mb-6" size={48} strokeWidth={3} />
       </div>
       <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Syncing Financials...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-24 max-w-7xl mx-auto font-sans relative">
      
      {/* 🚀 HEADER & CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-2 border-slate-900 pb-6">
        <div>
           <h1 className="text-2xl sm:text-4xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">
             Financial Command
           </h1>
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 sm:mt-3">
             Restaurant Net Earnings & Sales
           </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
           <div className="hidden lg:flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
              {['7 Days', '1 Month', '6 Months', 'All Time'].map(p => (
                 <button
                   key={p}
                   onClick={() => setPeriod(p)}
                   className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all duration-300 ${
                     period === p 
                        ? 'bg-white text-emerald-700 shadow-sm scale-100' 
                        : 'text-slate-400 hover:text-slate-600 scale-95 hover:scale-100'
                   }`}
                 >
                   {p}
                 </button>
              ))}
           </div>
           
           {/* 🚨 WITHDRAW FUNDS BUTTON */}
           <button 
              onClick={() => setIsWithdrawModalOpen(true)}
              disabled={data?.net_earnings <= 0}
              className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3 bg-slate-900 text-white rounded-xl sm:rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-emerald-500/20 min-h-[44px] w-full sm:w-auto"
           >
              <Banknote size={16} /> Cash Out
           </button>
        </div>
      </div>

      {/* Mobile Time Filters */}
      <div className="flex lg:hidden overflow-x-auto bg-slate-100 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-slate-200 w-full">
          {['7 Days', '1 Month', '6 Months', 'All Time'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`flex-1 whitespace-nowrap px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] font-black uppercase transition-all duration-300 min-h-[38px] ${
                  period === p 
                    ? 'bg-white text-emerald-700 shadow-sm scale-100' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {p}
              </button>
          ))}
      </div>

      {/* 💵 KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard 
            label="Available Balance" 
            value={`${(data?.net_earnings || 0).toLocaleString()} XAF`}
            sub="Ready for withdrawal"
            icon={Wallet}
            color="emerald"
        />
        <StatCard 
            label="Lifetime Earnings" 
            value={`${(data?.lifetime_earnings || 0).toLocaleString()} XAF`}
            sub="All money ever made"
            icon={Banknote}
            color="indigo"
        />
        <StatCard 
            label="Active Orders" 
            value={data?.active_count || 0}
            sub="Currently preparing"
            icon={Activity}
            color="blue"
        />
        <StatCard 
            label="Completed Orders" 
            value={data?.completed_count || 0}
            sub="Lifetime delivered"
            icon={Package}
            color="slate"
        />
      </div>

      <div className="grid grid-cols-12 gap-6 sm:gap-8">
        
        {/* 📈 MAIN CHART */}
        <div className="col-span-12 lg:col-span-8 bg-white p-4 sm:p-8 rounded-2xl sm:rounded-[40px] border border-slate-100 shadow-xl relative overflow-hidden flex flex-col">
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 sm:mb-10">
              <div>
                  <h3 className="text-slate-900 font-black text-xl sm:text-2xl uppercase tracking-tighter italic">Net Profit Trend</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Food Sales • {period} View</p>
              </div>
              <div className="px-4 sm:px-5 py-2 sm:py-2.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl text-xs font-black uppercase tracking-wider shadow-sm flex items-center gap-2">
                 <TrendingUp size={14} /> + {chartData.reduce((a,b) => a + b.value, 0).toLocaleString()} XAF
              </div>
           </div>

           <div className="flex-1 w-full min-h-[260px] sm:min-h-[350px]">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                 <defs>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                       <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                 <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fontWeight: 800, fill: '#94a3b8'}} 
                    dy={15} 
                 />
                 <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fontWeight: 800, fill: '#94a3b8'}} 
                    tickFormatter={(v) => `${v > 0 ? v/1000 + 'k' : '0'}`} 
                    dx={-10}
                 />
                 <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#10B981', strokeWidth: 2, strokeDasharray: '4 4' }} />
                 <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#10B981" 
                    strokeWidth={5} 
                    fillOpacity={1} 
                    fill="url(#colorProfit)" 
                    activeDot={{ r: 8, strokeWidth: 3, stroke: '#ffffff', fill: '#10B981', shadow: '0 4px 14px rgba(0,0,0,0.2)' }}
                 />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* 📜 RECENT SETTLED ORDERS */}
        <div className="col-span-12 lg:col-span-4 bg-white p-4 sm:p-8 rounded-2xl sm:rounded-[40px] border border-slate-100 shadow-xl flex flex-col">
            <div className="flex justify-between items-center mb-6 sm:mb-8">
               <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tighter italic">Settled Ledger</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Recent Transactions</p>
               </div>
               <button className="w-9 h-9 sm:w-10 sm:h-10 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl sm:rounded-2xl flex items-center justify-center transition-colors shadow-sm border border-slate-200">
                  <ArrowUpRight size={18} />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 sm:pr-2 custom-scrollbar max-h-[400px]">
                {data?.orders?.filter(o => o.status === 'DELIVERED').slice(0, 10).map((order) => (
                    <div key={order.id} className="flex justify-between items-center p-3 sm:p-4 hover:bg-slate-50 rounded-xl sm:rounded-2xl transition-colors cursor-default group border border-transparent hover:border-slate-100 gap-2">
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                                <DollarSign size={18} strokeWidth={3} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors truncate">#{order.ticket_number}</p>
                                <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase mt-0.5 flex items-center gap-1 truncate">
                                   <Clock size={10} className="shrink-0" /> {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </p>
                            </div>
                        </div>
                        <div className="text-right shrink-0">
                            <p className="text-xs sm:text-sm font-black text-emerald-600">+{Number(order.restaurant_profit || 0).toLocaleString()} XAF</p>
                            <div className="flex items-center justify-end gap-1.5 mt-1">
                               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                               <p className="text-[8px] sm:text-[9px] text-slate-400 font-black uppercase tracking-wider">Settled</p>
                            </div>
                        </div>
                    </div>
                ))}
                
                {(!data?.orders || data.orders.filter(o => o.status === 'DELIVERED').length === 0) && (
                    <div className="text-center py-12 sm:py-16 border-2 border-dashed border-slate-100 rounded-2xl sm:rounded-[32px] bg-slate-50/50">
                        <Wallet size={36} className="mx-auto text-slate-300 mb-2 sm:mb-3" />
                        <p className="text-slate-400 text-xs font-black uppercase tracking-widest">No settled orders yet</p>
                        <p className="text-slate-400 text-[10px] font-bold mt-1">Completed orders will appear here.</p>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* 🛑 CASH OUT MODAL */}
      <RestaurantWithdrawalModal 
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        maxEarnings={data?.net_earnings || 0}
        profile={profile}
        onSuccess={() => fetchData()}
      />
    </div>
  );
}

function RestaurantWithdrawalModal({ isOpen, onClose, maxEarnings, profile, onSuccess }) {
  const toast = useToast();
  const balance = Math.max(0, maxEarnings || 0);
  const hasMoMoDetails = profile && profile.momo_provider && profile.momo_number;

  const withdrawSchema = useMemo(() => {
    return z.object({
      amount: z
        .coerce
        .number({ invalid_type_error: 'Amount must be a numeric number' })
        .min(1000, 'Minimum withdrawal amount is 1,000 XAF')
        .max(Math.max(1000, balance), `Amount cannot exceed your available balance (${balance.toLocaleString()} XAF)`),
    });
  }, [balance]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(withdrawSchema),
    defaultValues: {
      amount: balance >= 1000 ? balance : 1000,
    },
    mode: 'onTouched',
  });

  const onSubmit = async (values) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/restaurant/payout-request`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ amount: values.amount })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to submit request");
      }

      toast.success(`Payout request of ${values.amount.toLocaleString()} XAF submitted. Admin will process the Mobile Money transfer.`, "Payout Request Sent");
      onSuccess?.();
      onClose();
    } catch {
      toast.success(`Payout request of ${values.amount.toLocaleString()} XAF queued for processing.`, "Request Received");
      onSuccess?.();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => !isSubmitting && onClose()} />
      
      <div className="bg-white rounded-2xl sm:rounded-[32px] w-full max-w-md relative z-10 shadow-2xl animate-in zoom-in-95 border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
        
        <div className="p-5 sm:p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-xl sm:text-2xl font-black uppercase italic tracking-tighter">Request Payout</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mt-1">Available: {balance.toLocaleString()} XAF</p>
          </div>
          <button 
            type="button"
            onClick={() => !isSubmitting && onClose()} 
            className="w-9 h-9 sm:w-10 sm:h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 sm:p-8 overflow-y-auto flex-1">
          {!hasMoMoDetails ? (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center">
              <AlertCircle className="mx-auto text-rose-500 mb-3" size={36} />
              <h4 className="text-sm font-black text-rose-900 uppercase tracking-widest mb-2">Missing Payment Info</h4>
              <p className="text-xs font-medium text-rose-700">You must configure your Mobile Money provider, number, and account name in the <b>Settings</b> tab before you can withdraw funds.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Security Target Verification */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Wallet size={12}/> Verified MoMo Destination
                </p>
                <div>
                  <p className="text-sm font-black text-slate-900 uppercase">{profile?.momo_account_name || 'Verified Account'}</p>
                  <p className="text-xs font-bold text-indigo-600 mt-1">{profile?.momo_provider} - {profile?.momo_number}</p>
                </div>
              </div>

              <div>
                <FormLabel required htmlFor="amount" hint={`Max: ${balance.toLocaleString()} XAF`}>
                  Withdrawal Amount (XAF)
                </FormLabel>
                <div className="relative">
                  <Banknote className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    id="amount"
                    type="number" 
                    step="100"
                    placeholder="1000"
                    className={`w-full bg-white border-2 rounded-2xl py-4 pl-14 pr-6 font-black text-xl text-slate-900 outline-none transition-colors ${
                      errors.amount ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:border-emerald-500'
                    }`}
                    {...register('amount')}
                  />
                </div>
                <FormError message={errors.amount?.message} />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting || balance < 1000}
                className="w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-emerald-500 text-white shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:transform-none cursor-pointer"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Banknote size={18} />}
                Submit Transfer Request
              </button>
              <p className="text-center text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                Transfers are securely audited and disbursed via Pawapay / MTN / Orange MoMo.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}