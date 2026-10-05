import React, { useState, useEffect, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, DollarSign, Activity, Loader2, 
  CheckCircle, Calendar, ArrowUpRight, Clock, AlertCircle, RefreshCw
} from 'lucide-react';

// 🔗 CONFIG
const API_URL = import.meta.env.VITE_API_URL || 'https://zamdey-backend.onrender.com/api:5000/api';

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
        <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{value}</h3>
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
          <DollarSign size={12} /> Platform Net Profit
        </p>
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const [period, setPeriod] = useState('Daily'); 
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // 🔄 SYNC DATA (Delegating heavy math to the backend)
  const fetchAnalytics = async (manual = false) => {
    if (manual) setIsSyncing(true);
    try {
      const token = localStorage.getItem('token');
      // 🚨 FIX: Updated endpoint from /admin/stats to /admin/analytics to match your router!
      const res = await fetch(`${API_URL}/admin/analytics`, { 
          headers: { 'Authorization': `Bearer ${token}` } 
      });

      if (res.ok) {
         const data = await res.json();
         setDashboardData(data);
      }
    } catch (error) {
      console.error("Analytics sync failed:", error);
    } finally {
      setLoading(false);
      if (manual) setTimeout(() => setIsSyncing(false), 500); // UI feel
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(() => fetchAnalytics(false), 30000); // 30s live refresh
    return () => clearInterval(interval);
  }, []);

  // 📊 CHART ENGINE
  const chartData = useMemo(() => {
    if (!dashboardData?.orders) return [];

    const now = new Date();
    let dataPoints = [];

    // Filter only DELIVERED for revenue chart
    const relevantOrders = dashboardData.orders.filter(o => o.status === 'DELIVERED');

    if (period === 'Daily') {
       // 🕒 HOURLY BUCKETS (00:00 - 23:00)
       const buckets = Array(24).fill(0).map((_, i) => ({ 
          label: `${String(i).padStart(2, '0')}:00`, 
          rawHour: i,
          revenue: 0 
       }));

       relevantOrders.forEach(o => {
          const d = new Date(o.created_at);
          if (d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
             const hour = d.getHours();
             // Uses actual platform_profit from Escrow Settlement
             const profit = Number(o.platform_profit) || 0;
             buckets[hour].revenue += profit;
          }
       });
       dataPoints = buckets;

    } else if (period === 'Weekly') {
       // 📅 LAST 7 DAYS
       const buckets = Array(7).fill(0).map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return { 
             label: d.toLocaleDateString('en-US', { weekday: 'short' }), 
             dateStr: d.toDateString(),
             revenue: 0 
          };
       });

       relevantOrders.forEach(o => {
          const d = new Date(o.created_at);
          const profit = Number(o.platform_profit) || 0;
          const bucket = buckets.find(b => b.dateStr === d.toDateString());
          if (bucket) bucket.revenue += profit;
       });
       dataPoints = buckets;

    } else if (period === 'Monthly') {
       // 🗓️ 4 WEEKS VIEW
       const buckets = Array(4).fill(0).map((_, i) => ({ label: `Week ${i+1}`, revenue: 0 }));
       
       relevantOrders.forEach(o => {
          const d = new Date(o.created_at);
          const diffTime = Math.abs(now - d);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays <= 28) {
             const profit = Number(o.platform_profit) || 0;
             const weekIndex = 3 - Math.floor((diffDays - 1) / 7); 
             if (weekIndex >= 0) buckets[weekIndex].revenue += profit;
          }
       });
       dataPoints = buckets;
    }

    return dataPoints;
  }, [dashboardData, period]);

  if (loading) return (
    <div className="flex h-[80vh] items-center justify-center flex-col animate-in fade-in zoom-in duration-500">
       <div className="relative">
           <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full"></div>
           <Loader2 className="animate-spin text-indigo-600 relative z-10 mb-6" size={48} strokeWidth={3} />
       </div>
       <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Compiling Metrics...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-sans pb-24 max-w-7xl mx-auto">
      
      {/* 🚀 HEADER & TIME CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-2 border-slate-900 pb-6">
        <div>
           <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">
             Global Command
           </h1>
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-3">
             System-Wide Financials & Operations
           </p>
        </div>
        
        <div className="flex items-center gap-4">
            <button 
                onClick={() => fetchAnalytics(true)}
                disabled={isSyncing}
                className="w-10 h-10 rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all shadow-sm"
            >
                <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
            </button>

            <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                {['Daily', 'Weekly', 'Monthly'].map((t) => (
                <button 
                    key={t} 
                    onClick={() => setPeriod(t)} 
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all duration-300 flex items-center gap-2 ${
                    period === t 
                        ? 'bg-white text-indigo-700 shadow-sm scale-100' 
                        : 'text-slate-400 hover:text-slate-600 scale-95 hover:scale-100'
                    }`}
                >
                    {t === 'Daily' && <Clock size={12} />}
                    {t === 'Weekly' && <Calendar size={12} />}
                    {t}
                </button>
                ))}
            </div>
        </div>
      </div>

      {/* 💵 KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
            label="Platform Net Revenue" 
            value={`${(dashboardData?.metrics?.totalNet || 0).toLocaleString()}`} 
            sub="Zamdey Commission (Settled)"
            icon={TrendingUp}
            color="emerald"
        />
        <StatCard 
            label="Gross Volume (GMV)" 
            value={`${(dashboardData?.metrics?.totalGMV || 0).toLocaleString()}`} 
            sub={`${dashboardData?.metrics?.settledCount || 0} Completed Orders`}
            icon={DollarSign}
            color="indigo"
        />
        {/* 🚨 Pending Payouts Card */}
        <StatCard 
            label="Pending Payouts" 
            value={`${(dashboardData?.metrics?.pendingPayouts || 0).toLocaleString()}`} 
            sub="Awaiting Admin Processing"
            icon={AlertCircle}
            color="rose"
        />
        <StatCard 
            label="Fleet Status" 
            value={`${dashboardData?.metrics?.activeFleet || 0} / ${dashboardData?.metrics?.totalRiders || 0}`} 
            sub="Riders Online & Active"
            icon={CheckCircle}
            color="blue"
        />
      </div>

      <div className="grid grid-cols-12 gap-8">
        
        {/* 📈 MAIN CHART AREA */}
        <div className="col-span-12 lg:col-span-8 bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl relative overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-slate-900 font-black text-2xl uppercase tracking-tighter italic">Revenue Trend</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Platform Profit • {period} View</p>
            </div>
            <div className="px-5 py-2.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl text-xs font-black uppercase tracking-wider shadow-sm flex items-center gap-2">
               <TrendingUp size={14} /> + {chartData.reduce((a,b) => a + b.revenue, 0).toLocaleString()} XAF
            </div>
          </div>
          
          <div className="flex-1 w-full min-h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                   dataKey="label" 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{fontSize: 10, fill: '#94A3B8', fontWeight: 800}} 
                   dy={15}
                />
                <YAxis 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{fontSize: 10, fill: '#94A3B8', fontWeight: 800}} 
                   tickFormatter={(val) => `${val > 0 ? val/1000 + 'k' : '0'}`} 
                   dx={-10}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#4F46E5', strokeWidth: 2, strokeDasharray: '4 4' }} />
                <Area 
                   type="monotone" 
                   dataKey="revenue" 
                   stroke="#4F46E5" 
                   strokeWidth={5} 
                   fillOpacity={1} 
                   fill="url(#colorRevenue)" 
                   activeDot={{ r: 8, strokeWidth: 3, stroke: '#ffffff', fill: '#4F46E5', shadow: '0 4px 14px rgba(0,0,0,0.2)' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 📜 RECENT LEDGER */}
        <div className="col-span-12 lg:col-span-4 bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl flex flex-col">
          <div className="flex justify-between items-center mb-8">
             <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">Recent Activity</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Live Order Ledger</p>
             </div>
             <button className="w-10 h-10 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center transition-colors shadow-sm border border-slate-200">
                <ArrowUpRight size={18} />
             </button>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar max-h-[400px]">
             {dashboardData?.orders?.slice(0, 10).map((o, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors cursor-default border border-transparent hover:border-slate-100 group">
                   <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-black uppercase shadow-sm transition-transform group-hover:scale-110 ${
                          o.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-600 border border-emerald-200' : 
                          o.status === 'CANCELLED' ? 'bg-rose-100 text-rose-600 border border-rose-200' : 'bg-amber-100 text-amber-600 border border-amber-200'
                      }`}>
                          {o.status === 'DELIVERED' ? 'OK' : o.status === 'CANCELLED' ? 'XX' : '..'}
                      </div>
                      <div>
                         <p className="text-sm font-black text-slate-900">#{o.ticket_number}</p>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 flex items-center gap-1">
                            <Clock size={10} /> {new Date(o.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                         </p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-sm font-black text-slate-900">{o.total_amount.toLocaleString()} XAF</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                          {o.restaurant?.restaurant_name?.slice(0, 15) || 'Vendor'}
                      </p>
                   </div>
                </div>
             ))}
             
             {(!dashboardData?.orders || dashboardData.orders.length === 0) && (
                <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-[32px] bg-slate-50/50">
                    <Activity size={40} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-400 text-xs font-black uppercase tracking-widest">No recent activity</p>
                    <p className="text-slate-400 text-[10px] font-bold mt-1">Orders will appear here.</p>
                </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}