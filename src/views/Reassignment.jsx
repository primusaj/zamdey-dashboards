import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, Bike, User, MapPin, AlertCircle, ArrowRightLeft, 
  CheckCircle, Loader2, Timer, ShieldAlert, RadioReceiver, Phone
} from 'lucide-react';

// 🔗 CONFIG: Point this to your backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Reassignment() {
  const [activeOrders, setActiveOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // 📋 LOAD LIVE DATA
  useEffect(() => {
    fetchReassignmentData();
    const interval = setInterval(fetchReassignmentData, 5000); // Auto-refresh
    return () => clearInterval(interval);
  }, []);

  const fetchReassignmentData = async () => {
    try {
      const token = localStorage.getItem('token');
      // Fetch Orders that are currently "ACCEPTED" (In transit to restaurant) or "ON_THE_WAY"
      const ordersRes = await fetch(`${API_URL}/admin/orders`, {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          if (Array.isArray(ordersData)) {
              // Filter for active fleet missions
              const inFlight = ordersData.filter(o => ['ACCEPTED', 'PICKED_UP', 'ON_THE_WAY'].includes(o.status));
              setActiveOrders(inFlight);
              
              // Update selected order data if it's currently open
              if (selectedOrder) {
                  const updatedSelected = inFlight.find(o => o.id === selectedOrder.id);
                  if (!updatedSelected) setSelectedOrder(null);
                  else setSelectedOrder(updatedSelected);
              }
          }
      }
      setLoading(false);
    } catch (error) {
      console.error("Rescue sync failed:", error);
      setLoading(false);
    }
  };

  const handleForceUnassign = async (orderId) => {
    const confirmRescue = window.confirm(
        "🚨 INITIATE FLEET RESCUE?\n\nThis will immediately strip the order from the current rider and broadcast it to ALL available riders in the zone. Proceed?"
    );
    if (!confirmRescue) return;

    try {
      // Optimistic UI update
      const updatedList = activeOrders.filter(o => o.id !== orderId); 
      setActiveOrders(updatedList);
      setSelectedOrder(null);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/orders/${orderId}/override`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Refresh data to show new state
        fetchReassignmentData();
      } else {
        throw new Error("Override execution failed");
      }
    } catch (error) {
      alert("Rescue broadcast failed. Please check connection.");
      fetchReassignmentData(); // Revert
    }
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-slate-400" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans pb-24">
      
      {/* 🔝 HEADER */}
      <div className="flex justify-between items-center border-b-2 border-slate-900 pb-6">
        <div>
          <h2 className="text-slate-900 font-black text-2xl uppercase tracking-tighter flex items-center gap-2">
              <ShieldAlert className="text-rose-600" /> Rescue Hub
          </h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
              Tactical Override: Strip inactive riders and re-broadcast to fleet
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        
        {/* 📦 LEFT: LIVE ASSIGNED ORDERS */}
        <div className="col-span-5 space-y-4 h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar pr-2">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Live Fleet Missions</h3>
          
          {activeOrders.map(order => {
            const minsSinceAccept = order.accepted_at ? Math.floor((Date.now() - new Date(order.accepted_at)) / 60000) : 0;
            const isSLABreached = order.status === 'ACCEPTED' && minsSinceAccept >= 10;

            return (
                <div 
                key={order.id} 
                onClick={() => setSelectedOrder(order)}
                className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedOrder?.id === order.id 
                    ? 'bg-rose-50 border-rose-600 shadow-md translate-x-1' 
                    : isSLABreached 
                        ? 'bg-white border-rose-300 hover:border-rose-400' 
                        : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
                >
                <div className="flex justify-between items-start mb-4">
                    <span className={`text-[10px] font-black px-2 py-1 rounded-sm uppercase tracking-tighter ${isSLABreached ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white'}`}>
                    #{order.ticket_number}
                    </span>
                    <div className="flex items-center gap-1 font-black">
                    <Timer size={12} className={isSLABreached ? "text-rose-600" : "text-slate-400"} />
                    <span className={`text-[10px] uppercase tracking-widest ${isSLABreached ? 'text-rose-600' : 'text-slate-500'}`}>
                        {minsSinceAccept}m elapsed
                    </span>
                    </div>
                </div>
                <h4 className="font-black text-slate-900 text-base uppercase leading-tight mb-2">
                    {order.restaurant?.restaurant_name || "Restaurant"}
                </h4>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-indigo-700 font-black">
                        <Bike size={14} />
                        <span className="text-[10px] uppercase tracking-widest truncate max-w-[120px]">
                            {order.rider?.user?.full_name || "Assigned Agent"}
                        </span>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-1 rounded">
                        {order.status.replace(/_/g, ' ')}
                    </span>
                </div>
                </div>
            )
          })}
          
          {activeOrders.length === 0 && (
            <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-xl">
              <CheckCircle className="mx-auto text-emerald-400 mb-3" size={32} />
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fleet Operations Normal</p>
            </div>
          )}
        </div>

        {/* 🏍️ RIGHT: TACTICAL OVERRIDE PANEL */}
        <div className="col-span-7 bg-slate-900 rounded-2xl p-8 border-4 border-slate-800 shadow-2xl min-h-[500px] flex flex-col relative overflow-hidden">
          
          {!selectedOrder ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
              <ArrowRightLeft className="text-slate-500" size={64} />
              <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest max-w-[250px]">
                Select a compromised mission from the queue to initiate override protocols
              </p>
            </div>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-right-4 z-10 relative">
              
              <div className="flex items-center justify-between border-b border-slate-700 pb-4">
                <h3 className="text-xs font-black text-rose-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <RadioReceiver size={16} /> Mission Override Terminal
                </h3>
                <button 
                  onClick={() => setSelectedOrder(null)} 
                  className="text-slate-400 hover:text-white uppercase text-[10px] font-black tracking-widest transition-colors"
                >
                  Abort Override
                </button>
              </div>

              {/* MISSION VITALS */}
              <div className="bg-slate-800 rounded-xl p-6 space-y-6 border border-slate-700">
                  <div className="grid grid-cols-2 gap-6">
                      <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Current Operative</p>
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center text-slate-300">
                                  <User size={20} />
                              </div>
                              <div>
                                  <p className="font-black text-white text-sm uppercase">{selectedOrder.rider?.user?.full_name || "Unknown"}</p>
                                  <p className="text-xs font-bold text-slate-400 flex items-center gap-1 mt-1">
                                      <Phone size={10}/> {selectedOrder.rider?.user?.phone || "No contact"}
                                  </p>
                              </div>
                          </div>
                      </div>
                      <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Mission Vector</p>
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center text-slate-300">
                                  <MapPin size={20} />
                              </div>
                              <div>
                                  <p className="font-black text-white text-sm uppercase">{selectedOrder.restaurant?.restaurant_name}</p>
                                  <p className="text-xs font-bold text-slate-400 mt-1 truncate max-w-[150px]">To: {selectedOrder.delivery_address}</p>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>

              {/* WARNING & KILL SWITCH */}
              <div className="pt-8">
                  <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl mb-6">
                      <p className="text-xs font-bold text-rose-400 leading-relaxed text-center">
                          Executing an override will instantly revoke the mission from the current operative and trigger a high-priority Zone Broadcast to all other available riders. Use only for SLA breaches or confirmed AWOL operatives.
                      </p>
                  </div>
                  
                  <button 
                    onClick={() => handleForceUnassign(selectedOrder.id)}
                    className="w-full bg-rose-600 hover:bg-rose-500 text-white py-6 rounded-xl font-black text-sm uppercase tracking-[0.2em] shadow-[0_0_40px_-10px_rgba(225,29,72,0.5)] hover:shadow-[0_0_60px_-10px_rgba(225,29,72,0.7)] transition-all flex justify-center items-center gap-3 group"
                  >
                    <RotateCcw size={20} className="group-hover:-rotate-180 transition-transform duration-500" />
                    Force Unassign & Re-Broadcast
                  </button>
              </div>

            </div>
          )}
          
          {/* Background decoration */}
          <div className="absolute -bottom-20 -right-20 text-slate-800 opacity-50 pointer-events-none">
              <ShieldAlert size={300} strokeWidth={1} />
          </div>
        </div>
      </div>
    </div>
  );
}