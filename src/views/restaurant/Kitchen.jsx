import React, { useState, useEffect } from 'react';
import { Timer, CheckCircle, Package, AlertCircle, ChefHat, RefreshCw, Loader2, Radar, ArrowRight } from 'lucide-react';

// 🔗 CONFIG: Point this to your backend
const API_URL = import.meta.env.VITE_API_URL || 'https://zamdey-backend.onrender.com/api:5000/api';

export default function Kitchen({ restaurantName }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🛰️ LIVE SYNC: Pulls active tickets
  const fetchKitchenRail = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Ensure this endpoint returns orders up to the 'ACCEPTED' state
      const res = await fetch(`${API_URL}/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        // 🛡️ Filter for active kitchen and outbound tickets
        const activeTickets = (data || []).filter(o => 
             ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'ACCEPTED'].includes(o.status)
        );
        setOrders(activeTickets);
      }
    } catch (error) {
      console.error("Kitchen Sync Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Poll every 5 seconds for new tickets and state changes (Socket fallback)
  useEffect(() => {
    fetchKitchenRail();
    const interval = setInterval(fetchKitchenRail, 5000); 
    return () => clearInterval(interval);
  }, []);

  // ⚡ STATUS UPDATER: Triggers Prep and Broadcasts
  const updateStatus = async (orderId, newStatus) => {
    const prevOrders = [...orders];
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) throw new Error("Failed to update");
      setTimeout(fetchKitchenRail, 500); 
    } catch (error) {
      alert("Connection Error: Ticket not updated");
      setOrders(prevOrders); 
    }
  };

  // 🤝 OPERATION FLEETPULSE: The Vendor Handshake
  const handleHandover = async (orderId) => {
    const prevOrders = [...orders];
    // Optimistically remove from screen assuming rider also clicked or will click soon
    setOrders(prev => prev.filter(o => o.id !== orderId)); 

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/orders/${orderId}/handshake`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Handshake failed");
      setTimeout(fetchKitchenRail, 500);
    } catch (error) {
      alert("Handshake failed. Ensure connection is active.");
      setOrders(prevOrders);
    }
  };

  // Grouping logic
  const pendingOrders = orders.filter(o => o.status === 'PENDING' || o.status === 'CONFIRMED');
  const preparingOrders = orders.filter(o => o.status === 'PREPARING');
  const readyOrders = orders.filter(o => o.status === 'READY_FOR_PICKUP');
  const acceptedOrders = orders.filter(o => o.status === 'ACCEPTED');

  if (loading) return (
    <div className="flex h-96 items-center justify-center flex-col">
       <Loader2 className="animate-spin text-slate-300 mb-4" size={40} />
       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Kitchen Rail...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans pb-24">
      
      {/* 🔝 KITCHEN HEADLINE */}
      <div className="flex justify-between items-end border-b-2 border-slate-900 pb-6">
        <div>
          <h2 className="text-slate-900 font-black text-2xl uppercase tracking-tighter leading-none mb-1">
            Kitchen Rail
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            {restaurantName} • Active Preparation Queue
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-lg border border-emerald-100 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest">Live Connection</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        
        {/* 🔥 ACTIVE PREP COLUMN */}
        <div className="col-span-12 lg:col-span-7 space-y-4">
          <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <ChefHat size={14} /> To Prepare ({pendingOrders.length + preparingOrders.length})
          </h3>
          
          {/* COMBINE PENDING & PREPARING FOR MAIN RAIL */}
          {[...pendingOrders, ...preparingOrders].map(order => (
            <div key={order.id} className="bg-white border-2 border-slate-900 rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">#{order.ticket_number}</p>
                  <h4 className="text-xl font-black text-slate-900 uppercase">
                    {order.items?.length || 0} Items
                  </h4>
                  <div className="mt-2 text-sm text-slate-600">
                    {order.items?.map((i, idx) => (
                        <div key={idx}><span className="font-bold">{i.quantity}x</span> {i.menu_item?.name}</div>
                    ))}
                  </div>
                </div>
                <div className={`px-3 py-1 rounded font-black text-[9px] uppercase tracking-widest ${
                  order.status === 'PREPARING' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {order.status}
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex gap-3">
                {order.status === 'PENDING' || order.status === 'CONFIRMED' ? (
                  <button 
                    onClick={() => updateStatus(order.id, 'PREPARING')}
                    className="flex-1 bg-slate-900 text-white py-4 rounded-lg font-black text-xs uppercase tracking-widest hover:bg-black transition-all"
                  >
                    Start Preparing
                  </button>
                ) : (
                  <button 
                    onClick={() => updateStatus(order.id, 'READY_FOR_PICKUP')}
                    className="flex-1 bg-indigo-600 text-white py-4 rounded-lg font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={16} /> Mark as Ready (Broadcast)
                  </button>
                )}
              </div>
            </div>
          ))}

          {pendingOrders.length === 0 && preparingOrders.length === 0 && (
            <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-xl opacity-40">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No active tickets</p>
            </div>
          )}
        </div>

        {/* 📦 OUTBOUND LOGISTICS COLUMN */}
        <div className="col-span-12 lg:col-span-5 space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
            Outbound Logistics ({readyOrders.length + acceptedOrders.length})
          </h3>
          
          {/* PHASE 1: BROADCASTING */}
          {readyOrders.map(order => (
            <div key={order.id} className="bg-slate-50 border border-indigo-200 rounded-xl p-5 flex items-center justify-between shadow-inner">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-500 shadow-sm border border-indigo-200 relative overflow-hidden">
                  <Radar size={20} className="animate-pulse absolute" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-900 uppercase">#{order.ticket_number}</p>
                  <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-tighter">Broadcasting to Zone...</p>
                </div>
              </div>
            </div>
          ))}

          {/* PHASE 2: CLAIMED & AWAITING HANDOVER */}
          {acceptedOrders.map(order => (
            <div key={order.id} className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex flex-col gap-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center text-white shadow-sm border border-emerald-600">
                    <Package size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-900 uppercase">#{order.ticket_number}</p>
                    <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-tighter">
                      Rider: {order.rider?.user?.full_name || 'En Route'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* THE HANDSHAKE BUTTON */}
              <button 
                onClick={() => handleHandover(order.id)}
                className="w-full bg-emerald-600 text-white py-3 rounded-lg font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
              >
                Handed to Rider <ArrowRight size={14} />
              </button>
            </div>
          ))}

          {readyOrders.length === 0 && acceptedOrders.length === 0 && (
             <div className="py-12 text-center border border-slate-100 rounded-xl bg-slate-50 opacity-50">
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dispatch Queue Clear</p>
             </div>
          )}
        </div>

      </div>
    </div>
  );
}