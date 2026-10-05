import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, History, Calendar, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://zamdey-backend.onrender.com/api:5000/api';

export default function RiderEarnings() {
  const [rider, setRider] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch(`${API_URL}/riders/dashboard`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
            const data = await res.json();
            setRider(data.profile);
            
            // ✅ Now this works because Controller sends 'DELIVERED' status
            const deliveredOrders = data.orders?.filter(o => o.status === 'DELIVERED') || [];
            setHistory(deliveredOrders);
        }
      } catch (error) {
        console.error("Earnings error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEarnings();
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-slate-900" /></div>;

  return (
    <div className="max-w-[480px] mx-auto space-y-6 pb-24 px-4 font-sans pt-6">
      
      {/* WALLET */}
      <div className="bg-slate-900 p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
        <div className="flex justify-between items-start mb-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Balance</p>
            <div className="bg-emerald-500/20 p-2 rounded-full"><Wallet size={20} className="text-emerald-400"/></div>
        </div>
        <h3 className="text-4xl font-black italic tracking-tighter mb-2">{rider?.wallet_balance?.toLocaleString() || 0} FRS</h3>
        <p className="text-[10px] text-slate-400 mb-6">Available for withdrawal</p>
        <button className="w-full bg-white text-slate-900 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-emerald-50 transition-colors">Request Payout</button>
        <div className="flex items-center gap-2 mt-6 justify-center opacity-50">
           <ShieldCheck size={10} className="text-emerald-400" />
           <span className="text-[8px] font-black uppercase tracking-wider">Secured by Pawapay</span>
        </div>
      </div>

      {/* HISTORY */}
      <div className="space-y-4">
        <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 px-2">
          <History size={14} className="text-slate-400" /> Recent Earnings
        </h4>

        {history.length > 0 ? (
            history.map(order => (
                <div key={order.id} className="bg-white border border-slate-200 rounded-2xl p-5 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600"><CheckCircle2 size={18} /></div>
                        <div>
                            <p className="text-xs font-black text-slate-900 uppercase truncate max-w-[120px]">{order.restaurant?.restaurant_name || "Delivery"}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ticket #{order.ticket_number}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-black text-emerald-600">+ {order.delivery_fee?.toLocaleString()} FRS</p>
                        <p className="text-[8px] font-bold text-slate-300 uppercase">{new Date(order.updated_at).toLocaleDateString()}</p>
                    </div>
                </div>
            ))
        ) : (
            <div className="text-center py-10 opacity-40"><p className="text-[10px] font-black uppercase">No completed deliveries yet</p></div>
        )}
      </div>
    </div>
  );
}