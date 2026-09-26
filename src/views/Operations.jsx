import React, { useState, useEffect } from 'react';
import { 
  Package, Bike, MapPin, Timer, RefreshCw, 
  AlertTriangle, Radar, AlertOctagon, UserX, UserCheck
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Operations() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. SYNC DATA (Auto-Polls every 5 seconds)
  useEffect(() => {
    fetchOperationsData();
    const interval = setInterval(fetchOperationsData, 5000); 
    return () => clearInterval(interval);
  }, []);

  const fetchOperationsData = async () => {
    try {
      const token = localStorage.getItem('token');
      const ordersRes = await fetch(`${API_URL}/admin/orders`, { 
          headers: { 'Authorization': `Bearer ${token}` } 
      }); 
      
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        if (Array.isArray(ordersData)) {
            // 🛡️ Filter for the two FleetPulse operational states
            setOrders(ordersData.filter(o => 
              ['READY_FOR_PICKUP', 'ACCEPTED'].includes(o.status)
            ));
        }
      }
      setLoading(false);
    } catch (error) {
      console.error("Sync Error:", error);
    }
  };

  // 2. THE SLA FAIL-SAFE (Admin Override)
  const handleForceUnassign = async (orderId, riderName) => {
      const isConfirmed = window.confirm(
          `⚠️ WARNING: Force Unassign Rider?\n\nAre you sure you want to strip this order from ${riderName}? This will reset the order and broadcast it to the entire zone again. Only do this if the rider is unresponsive.`
      );

      if (!isConfirmed) return;

      const previousOrders = [...orders];
      
      // Optimistic UI Update: Flip it back to broadcasting
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'READY_FOR_PICKUP', rider: null } : o));

      try {
          const token = localStorage.getItem('token');
          const res = await fetch(`${API_URL}/orders/${orderId}/override`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` }
          });

          if (!res.ok) throw new Error("Failed to execute override command");
          
          fetchOperationsData(); // Re-sync

      } catch (error) {
          alert(`Override failed: ${error.message}`);
          setOrders(previousOrders); // Rollback
      }
  };

  // 3. UTILITIES
  const getWaitTime = (dateStr) => Math.floor((Date.now() - new Date(dateStr)) / 60000);
  
  const broadcastingOrders = orders.filter(o => o.status === 'READY_FOR_PICKUP');
  const claimedOrders = orders.filter(o => o.status === 'ACCEPTED');

  return (
    <div className="h-[calc(100vh-120px)] flex gap-6 font-sans text-slate-800">
      
      {/* ===================================================
          LEFT COL: BROADCASTING (Unclaimed)
      =================================================== */}
      <div className="w-1/2 flex flex-col bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-indigo-100 bg-indigo-50/50 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-indigo-900 tracking-tight flex items-center gap-2">
               <Radar className="text-indigo-600 animate-pulse" size={20} /> Active Broadcasts
            </h2>
            <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest mt-1">
                Pinging riders in zone...
            </p>
          </div>
          
          <button onClick={fetchOperationsData} className="p-2 hover:bg-indigo-100 rounded-full transition-colors">
             <RefreshCw className={`text-indigo-500 ${loading ? 'animate-spin' : ''}`} size={18} />
          </button>
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50/50">
          
          {broadcastingOrders.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-64 text-indigo-300 opacity-60">
               <Package size={64} className="mb-4" />
               <p className="font-black uppercase tracking-widest text-sm">No Active Broadcasts</p>
            </div>
          )}

          {broadcastingOrders.map(order => (
            <div key={order.id} className="p-5 rounded-2xl border-2 border-indigo-200 bg-white shadow-sm flex flex-col gap-4">
              <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                      <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1">
                          <Radar size={12} className="animate-pulse" /> Broadcasting
                      </span>
                      <span className="text-sm font-black text-slate-400">#{order.ticket_number}</span>
                  </div>
                  <div className="flex items-center gap-1 text-rose-600 font-bold text-xs bg-rose-50 px-2 py-1 rounded">
                     <Timer size={14} /> {getWaitTime(order.created_at)}m
                  </div>
              </div>
              
              <div>
                  <h3 className="font-black text-slate-800 text-lg uppercase italic">{order.restaurant?.restaurant_name}</h3>
                  <div className="flex items-center gap-1 text-sm text-slate-500 mt-1 font-bold">
                    <MapPin size={14} className="text-indigo-400" /> {order.delivery_address || "Pickup"}
                  </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===================================================
          RIGHT COL: THE LIVE FLEET (Claimed / SLA Monitor)
      =================================================== */}
      <div className="w-1/2 flex flex-col bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <div>
             <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
               <Bike className="text-emerald-500" size={20} /> Live Fleet Transit
             </h2>
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                 Riders en route to kitchen
             </p>
          </div>
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50/30">
            
            {claimedOrders.length === 0 && (
                <div className="h-64 flex flex-col items-center justify-center text-slate-300 opacity-60">
                    <UserCheck size={64} className="mb-4 text-slate-200" />
                    <p className="font-black uppercase tracking-widest text-sm">No Active Missions</p>
                </div>
            )}

            {claimedOrders.map(order => {
                const riderName = order.rider?.user?.full_name || "Unknown Rider";
                // ⏱️ SLA Timer Calculation (Time since accepted)
                const minsSinceAccept = order.accepted_at ? Math.floor((Date.now() - new Date(order.accepted_at)) / 60000) : 0;
                const isSLABreached = minsSinceAccept >= 10;

                return (
                    <div key={order.id} className={`p-5 rounded-2xl border-2 shadow-sm flex flex-col gap-4 ${isSLABreached ? 'border-rose-300 bg-rose-50' : 'border-emerald-200 bg-white'}`}>
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 ${isSLABreached ? 'bg-rose-500 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                                    {isSLABreached ? <AlertOctagon size={12} /> : <UserCheck size={12} />} 
                                    {isSLABreached ? 'SLA BREACHED' : 'Claimed'}
                                </span>
                                <span className="text-sm font-black text-slate-400">#{order.ticket_number}</span>
                            </div>
                            
                            {/* The SLA Timer Display */}
                            <div className={`flex items-center gap-1 font-bold text-xs px-2 py-1 rounded ${isSLABreached ? 'text-white bg-rose-600' : 'text-slate-600 bg-slate-100'}`}>
                                <Timer size={14} /> {minsSinceAccept}m elapsed
                            </div>
                        </div>

                        <div>
                            <h3 className="font-black text-slate-800 text-sm uppercase">Agent: {riderName}</h3>
                            <p className="text-xs text-slate-500 font-bold mt-1">Heading to: {order.restaurant?.restaurant_name}</p>
                        </div>

                        {/* 🚨 THE OVERRIDE FAIL-SAFE */}
                        <div className="pt-4 border-t border-slate-100 flex justify-end">
                            <button 
                                onClick={() => handleForceUnassign(order.id, riderName)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${isSLABreached ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-md shadow-rose-200' : 'bg-white border-2 border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200'}`}
                            >
                                <UserX size={14} /> Force Unassign
                            </button>
                        </div>
                    </div>
                )
            })}
        </div>
      </div>
    </div>
  );
}