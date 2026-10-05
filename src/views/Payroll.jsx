import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Banknote, ShieldCheck, CheckCircle2, 
  Loader2, RefreshCw, Send, AlertTriangle, Search, Smartphone
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://zamdey-backend.onrender.com/api';

export default function Payroll() {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRiders = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/admin/riders`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (res.ok) {
          const data = await res.json();
          setRiders(data);
      }
    } catch (error) {
      console.error("Payroll Sync Error:", error);
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchRiders(); }, []);

  // 🚀 HANDLE BATCH FLEET PAYOUT
  const handleExecutePayroll = async () => {
    if(!window.confirm(`⚠️ WARNING: This will mark all pending rider balances as PAID and zero out their wallets. Have you completed the MoMo transfers?`)) return;
    
    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/admin/payout/riders`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const result = await res.json();
      if(res.ok) {
          alert(`✅ ${result.message}`);
          fetchRiders(); // Refresh the list instantly
      } else { 
          alert(`❌ Error: ${result.message}`); 
      }
    } catch (error) { 
        alert("Network error processing fleet payroll."); 
    } finally { 
        setProcessing(false); 
    }
  };

  // Filter riders who are actually owed money
  const pendingPayroll = useMemo(() => {
    return riders.filter(r => r.wallet_balance > 0);
  }, [riders]);

  const filteredPayroll = pendingPayroll.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.phone?.includes(searchQuery)
  );

  const totalOwed = pendingPayroll.reduce((sum, r) => sum + r.wallet_balance, 0);

  if (loading) return (
    <div className="flex h-96 items-center justify-center flex-col">
       <Loader2 className="animate-spin text-slate-300 mb-4" size={40} />
       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Compiling Fleet Payroll...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto font-sans">
      
      {/* 💸 HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b-2 border-slate-900 pb-6 gap-4">
        <div>
           <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Fleet Payroll</h1>
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Logistics Batch Disbursement</p>
        </div>
        <div className="bg-indigo-50 text-indigo-700 px-5 sm:px-6 py-3 rounded-2xl border border-indigo-100 flex items-center gap-3">
            <ShieldCheck size={20} />
            <div>
               <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Payroll System</p>
               <p className="text-xs font-black uppercase flex items-center gap-1">Online & Secure <CheckCircle2 size={12}/></p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* TOTAL OWED CARD */}
        <div className="bg-slate-900 text-white p-5 sm:p-8 rounded-2xl sm:rounded-[32px] shadow-2xl relative overflow-hidden group md:col-span-2 flex flex-col justify-center">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Banknote size={100} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Total Fleet Liability</p>
            <h3 className="text-3xl sm:text-5xl font-black tracking-tighter">
              {totalOwed.toLocaleString()} <span className="text-lg text-slate-500">XAF</span>
            </h3>
            
            <div className="mt-6 sm:mt-8 flex gap-4">
                <button 
                  onClick={handleExecutePayroll}
                  disabled={processing || pendingPayroll.length === 0}
                  className="w-full sm:w-auto bg-emerald-500 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                >
                  {processing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  Execute Batch Payroll
                </button>
            </div>
        </div>

        {/* STATS CARD */}
        <div className="bg-white border-2 border-slate-100 p-5 sm:p-8 rounded-2xl sm:rounded-[32px] shadow-lg flex flex-col justify-center">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Users size={24} />
                </div>
                <div>
                    <h4 className="text-2xl font-black text-slate-900">{pendingPayroll.length}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Riders to Pay</p>
                </div>
            </div>
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <div className="flex gap-3">
                    <AlertTriangle className="text-amber-500 shrink-0" size={16} />
                    <p className="text-[9px] font-bold text-amber-700 uppercase leading-relaxed">
                        Ensure all MoMo transfers are successfully completed on your mobile device before executing the batch payroll command.
                    </p>
                </div>
            </div>
        </div>
      </div>

      {/* 📋 PAYROLL QUEUE */}
      <div className="bg-white rounded-2xl sm:rounded-[40px] border border-slate-100 shadow-xl overflow-hidden mt-4">
        <div className="p-4 sm:p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 uppercase italic flex items-center gap-2">
              <Users className="text-blue-500" /> Pending Disbursements
            </h3>
            <button onClick={fetchRiders} className="mt-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[9px] font-black uppercase text-slate-500 hover:bg-slate-50 transition-colors flex items-center gap-1 shadow-sm min-h-[36px]">
                <RefreshCw size={10} /> Sync Rider Wallets
            </button>
          </div>
          
          <div className="relative w-full md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search rider name or phone..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border-2 border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold text-slate-900 outline-none focus:border-blue-500 transition-colors min-h-[44px]"
            />
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="py-3.5 sm:py-4 px-4 sm:px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Rider Identity</th>
                <th className="py-3.5 sm:py-4 px-4 sm:px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Contact / MoMo</th>
                <th className="py-3.5 sm:py-4 px-4 sm:px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Zone</th>
                <th className="py-3.5 sm:py-4 px-4 sm:px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Owed Amount (XAF)</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayroll.length > 0 ? filteredPayroll.map((rider) => (
                <tr key={rider.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                  <td className="py-4 sm:py-5 px-4 sm:px-8">
                    <p className="text-sm font-black text-slate-900 uppercase">{rider.name}</p>
                    <p className="text-[10px] font-bold text-emerald-500 uppercase mt-1">Status: Active</p>
                  </td>
                  <td className="py-4 sm:py-5 px-4 sm:px-8">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-slate-100 text-slate-600">
                        <Smartphone size={16} />
                      </div>
                      <p className="text-xs font-black text-slate-900">{rider.phone || "No Phone Registered"}</p>
                    </div>
                  </td>
                  <td className="py-4 sm:py-5 px-4 sm:px-8">
                    <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest">
                        {rider.current_zone || "Global"}
                    </span>
                  </td>
                  <td className="py-4 sm:py-5 px-4 sm:px-8 text-right">
                    <span className="text-base sm:text-lg font-black text-slate-900">{rider.wallet_balance.toLocaleString()}</span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" className="py-16 text-center">
                    <CheckCircle2 size={32} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">All riders are fully paid.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}