import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { 
  Wallet, ArrowUpRight, RefreshCw, Loader2, 
  ShieldCheck, CheckCircle2, Banknote, Clock, 
  Smartphone, Search, Check, XCircle, Zap
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const COLORS = ['#10B981', '#3B82F6', '#6366F1']; 

export default function Finances() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Action States
  const [processingId, setProcessingId] = useState(null);
  const [processingRiders, setProcessingRiders] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchFinances = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/admin/finances`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (res.ok) setData(await res.json());
    } catch (error) {
      console.error("Finance Sync Error:", error);
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchFinances(); }, []);

  // 🚀 1. VENDOR PAYOUT: APPROVE & FIRE PAWAPAY
  const handleApprovePayout = async (requestId, amount, vendorName) => {
    if(!window.confirm(`⚠️ WARNING: This will instantly send ${amount.toLocaleString()} XAF to ${vendorName} via real Mobile Money. Continue?`)) return;
    
    setProcessingId(requestId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/admin/payouts/${requestId}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const result = await res.json();
      if(res.ok) {
          alert("✅ " + result.message);
          fetchFinances(); // Refresh the list instantly
      } else { 
          alert(`❌ Error: ${result.message}`); 
      }
    } catch (error) { 
        alert("Network error processing payout."); 
    } finally { 
        setProcessingId(null); 
    }
  };

  // 🛑 2. VENDOR PAYOUT: REJECT & REFUND WALLET
  const handleRejectPayout = async (requestId, amount, vendorName) => {
    if(!window.confirm(`Are you sure you want to REJECT this payout? \n\nThe ${amount.toLocaleString()} XAF will be refunded back to ${vendorName}'s virtual wallet.`)) return;
    
    setProcessingId(requestId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/admin/payouts/${requestId}/reject`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const result = await res.json();
      if(res.ok) {
          alert("✅ " + result.message);
          fetchFinances(); // Refresh the list instantly
      } else { 
          alert(`❌ Error: ${result.message}`); 
      }
    } catch (error) { 
        alert("Network error rejecting payout."); 
    } finally { 
        setProcessingId(null); 
    }
  };

  // 🛵 3. RIDER PAYROLL: BATCH PROCESS
  const handleRunRiderPayroll = async () => {
    if(!window.confirm(`⚠️ CRITICAL ACTION: This will automatically send Mobile Money transfers to ALL Riders currently owed money. Proceed with Payroll?`)) return;
    
    setProcessingRiders(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/admin/payouts/riders/process`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const result = await res.json();
      if(res.ok) {
          alert("🎉 " + result.message);
          fetchFinances(); 
      } else { 
          alert(`❌ Error: ${result.message}`); 
      }
    } catch (error) { 
        alert("Network error processing payroll."); 
    } finally { 
        setProcessingRiders(false); 
    }
  };

  const splits = useMemo(() => {
    if (!data) return [];
    const totalGMV = data.gross_revenue || 0;
    const platform = data.net_revenue || 0;
    const riders = data.rider_payouts || 0;
    const vendors = totalGMV - platform - riders;

    return [
      { name: 'Vendor Earnings', value: vendors, color: '#10B981' }, 
      { name: 'Rider Earnings', value: riders, color: '#3B82F6' },  
      { name: 'Platform Profit', value: platform, color: '#6366F1' } 
    ];
  }, [data]);

  const filteredRequests = data?.vendor_requests?.filter(req => 
    req.restaurant.restaurant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.restaurant.momo_number?.includes(searchQuery)
  ) || [];

  if (loading) return (
    <div className="flex h-96 items-center justify-center flex-col">
       <Loader2 className="animate-spin text-slate-300 mb-4" size={40} />
       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Auditing Ledger...</p>
    </div>
  );

  const totalRevenue = data?.gross_revenue || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto font-sans">
      
      {/* 💸 HEADER */}
      <div className="flex justify-between items-end border-b-2 border-slate-900 pb-6">
        <div>
           <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Financial Ledger</h1>
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Revenue Splits & Vendor Payouts</p>
        </div>
        <div className="flex items-center gap-4">
            {/* 🛵 MASTER RIDER PAYROLL BUTTON */}
            <button 
                onClick={handleRunRiderPayroll}
                disabled={processingRiders}
                className="bg-blue-600 text-white px-6 py-3 rounded-2xl border border-blue-700 flex items-center gap-3 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
            >
                {processingRiders ? <Loader2 size={20} className="animate-spin" /> : <Zap size={20} />}
                <div>
                   <p className="text-[9px] font-black uppercase tracking-widest text-blue-200">Fleet Operations</p>
                   <p className="text-xs font-black uppercase">Run Rider Payroll</p>
                </div>
            </button>

            <div className="bg-emerald-50 text-emerald-700 px-6 py-3 rounded-2xl border border-emerald-100 flex items-center gap-3">
                <ShieldCheck size={20} />
                <div>
                   <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Ledger Status</p>
                   <p className="text-xs font-black uppercase flex items-center gap-1">PawaPay Online <CheckCircle2 size={12}/></p>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        
        {/* 🍰 THE SPLIT CHART (VISUALIZATION) */}
        <div className="col-span-12 lg:col-span-8 bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl relative overflow-hidden">
           <div className="flex justify-between items-center mb-8">
              <h3 className="font-black text-xl text-slate-900 uppercase italic">Revenue Distribution</h3>
              <button onClick={fetchFinances} className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-bold uppercase text-slate-500 hover:bg-slate-200 transition-colors flex items-center gap-1">
                 <RefreshCw size={10} /> Sync Live Data
              </button>
           </div>
           
           <div className="flex flex-col md:flex-row items-center justify-center gap-12">
              <div className="h-[300px] w-[300px] relative">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={splits} innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value" stroke="none">
                        {splits.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                      </Pie>
                      <RechartsTooltip formatter={(value) => `${value.toLocaleString()} XAF`} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold'}} />
                    </PieChart>
                 </ResponsiveContainer>
                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-xs font-bold text-slate-400 uppercase">Total GMV</p>
                    <p className="text-2xl font-black text-slate-900">{totalRevenue.toLocaleString()}</p>
                    <p className="text-[10px] font-bold text-slate-300">XAF</p>
                 </div>
              </div>

              <div className="space-y-6 flex-1 w-full max-w-xs">
                 {splits.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-md transition-all">
                       <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-xs font-black text-slate-700 uppercase">{item.name}</span>
                       </div>
                       <div className="text-right">
                          <span className="block text-sm font-black text-slate-900">{item.value.toLocaleString()} XAF</span>
                          <span className="block text-[9px] font-bold text-slate-400">
                            {totalRevenue > 0 ? ((item.value / totalRevenue) * 100).toFixed(1) : 0}%
                          </span>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* 💰 PLATFORM PROFIT CARD */}
        <div className="col-span-12 lg:col-span-4">
           <div className="bg-slate-900 text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden group h-full flex flex-col justify-center">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                 <Wallet size={120} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Platform Net Revenue</p>
              <h3 className="text-5xl font-black tracking-tighter">
                {(data?.net_revenue || 0).toLocaleString()} <span className="text-lg text-slate-500">XAF</span>
              </h3>
              <p className="text-xs font-medium text-slate-400 mt-4 leading-relaxed">
                 This is Zamdey's pure profit after all vendor and rider allocations are calculated from the gross volume.
              </p>
           </div>
        </div>

        {/* 📋 VENDOR PAYOUT QUEUE */}
        <div className="col-span-12 bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden mt-4">
          <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase italic flex items-center gap-2">
                <Banknote className="text-emerald-500" /> Vendor Withdrawal Requests
              </h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Review and process approved earnings via PawaPay</p>
            </div>
            
            <div className="relative w-full md:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search vendor or number..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border-2 border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Restaurant</th>
                  <th className="py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount (XAF)</th>
                  <th className="py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">MoMo Details</th>
                  <th className="py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.length > 0 ? filteredRequests.map((req) => (
                  <tr key={req.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                    <td className="py-5 px-8">
                      <p className="text-sm font-black text-slate-900 uppercase">{req.restaurant.restaurant_name}</p>
                      <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-1">
                        <Clock size={10} /> {new Date(req.created_at).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="py-5 px-8">
                      <span className="text-lg font-black text-emerald-600">{req.amount.toLocaleString()}</span>
                    </td>
                    <td className="py-5 px-8">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${req.restaurant.momo_provider === 'MTN' ? 'bg-yellow-100 text-yellow-700' : 'bg-orange-100 text-orange-700'}`}>
                          <Smartphone size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900">{req.restaurant.momo_number}</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase">{req.restaurant.momo_account_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-8">
                      {req.status === 'PENDING' ? (
                        <span className="bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1 w-max">
                          <Clock size={10} /> Unpaid
                        </span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1 w-max">
                          <CheckCircle2 size={10} /> Paid
                        </span>
                      )}
                    </td>
                    <td className="py-5 px-8 text-right">
                      {req.status === 'PENDING' && (
                        <div className="flex items-center justify-end gap-2">
                           <button 
                             onClick={() => handleRejectPayout(req.id, req.amount, req.restaurant.restaurant_name)}
                             disabled={processingId === req.id}
                             className="bg-rose-50 text-rose-600 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center gap-2 disabled:opacity-50"
                           >
                             {processingId === req.id ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                             Reject & Refund
                           </button>
                           <button 
                             onClick={() => handleApprovePayout(req.id, req.amount, req.restaurant.restaurant_name)}
                             disabled={processingId === req.id}
                             className="bg-slate-900 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
                           >
                             {processingId === req.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                             Approve & Pay
                           </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="py-16 text-center">
                      <Banknote size={32} className="mx-auto text-slate-300 mb-3" />
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No pending payout requests</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}