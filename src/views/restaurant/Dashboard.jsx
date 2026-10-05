import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle, 
  DollarSign, 
  RefreshCw,
  Loader2,
  XCircle,
  PowerOff,
  Radar,
  Package
} from 'lucide-react';
import { io } from 'socket.io-client';

const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://zamdey-backend.onrender.com';
const API_URL = import.meta.env.VITE_API_URL || `${BASE_URL}/api`;

const socket = io(BASE_URL, {
  autoConnect: false 
});

// --- COMPONENTS ---
const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
  <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-slate-500 text-xs sm:text-sm font-medium mb-1">{title}</p>
        <h3 className="text-xl sm:text-2xl font-black text-slate-800">{value}</h3>
        {subtext && <p className="text-[11px] text-slate-400 mt-1 sm:mt-2">{subtext}</p>}
      </div>
      <div className={`p-2.5 sm:p-3 rounded-xl ${color} shrink-0`}>
        <Icon size={20} className="text-white sm:w-6 sm:h-6" />
      </div>
    </div>
  </div>
);

const OrderCard = ({ order, onUpdateStatus, onHandover }) => {
  const isPending = order.status === 'PENDING' || order.status === 'CONFIRMED';
  const isPreparing = order.status === 'PREPARING';
  const isBroadcasting = order.status === 'READY_FOR_PICKUP';
  const isAccepted = order.status === 'ACCEPTED'; // 🚀 Rider claimed it!

  const handleReject = () => {
      const confirmReject = window.confirm(`Are you sure you want to REJECT Order #${order.ticket_number}?\n\nThe order will be cancelled and the customer will be instantly refunded.`);
      if (confirmReject) {
          onUpdateStatus(order.id, 'CANCELLED');
      }
  };

  return (
    <div className={`bg-white p-3.5 sm:p-4 rounded-xl shadow-sm border mb-4 animate-in fade-in slide-in-from-bottom-2 ${isAccepted ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200'}`}>
      <div className="flex justify-between items-start mb-3 gap-2">
        <div>
          <span className="font-bold text-base sm:text-lg text-slate-800">#{order.ticket_number}</span>
          <p className="text-xs text-slate-500">{new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase shrink-0 
          ${isPending ? 'bg-orange-100 text-orange-700' : 
            isPreparing ? 'bg-blue-100 text-blue-700' : 
            isBroadcasting ? 'bg-indigo-100 text-indigo-700' :
            'bg-emerald-100 text-emerald-700'}`}>
          {isBroadcasting ? 'BROADCASTING' : order.status.replace(/_/g, ' ')}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        {order.items?.map((item, index) => (
          <div key={index} className="flex justify-between text-xs sm:text-sm">
            <span className="text-slate-700">
              <span className="font-bold text-slate-900">{item.quantity}x</span> {item.menu_item?.name || "Unknown Item"}
            </span>
            <span className="text-slate-500 whitespace-nowrap ml-2">
                {Number(item.menu_item?.price || item.price_at_time || 0).toLocaleString()} XAF
            </span>
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-slate-100 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <p className="font-bold text-xs sm:text-sm text-slate-800">
              Total: {Number(order.total_amount || 0).toLocaleString()} XAF
          </p>
        </div>
        
        {/* ACTION BUTTONS */}
        {isPending && (
          <div className="flex items-center gap-2">
            <button 
              onClick={handleReject}
              className="bg-red-50 text-red-600 px-3 py-2.5 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-1 border border-red-200 flex-1 min-h-[44px]"
              title="Reject and Refund"
            >
              <XCircle size={16} /> Reject
            </button>
            <button 
              onClick={() => onUpdateStatus(order.id, 'PREPARING')}
              className="bg-slate-900 text-white px-4 py-2.5 rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 flex-1 min-h-[44px]"
            >
              Cook <Clock size={16} />
            </button>
          </div>
        )}

        {isPreparing && (
          <button 
            onClick={() => onUpdateStatus(order.id, 'READY_FOR_PICKUP')}
            className="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg text-xs sm:text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 min-h-[44px]"
          >
            Ready (Broadcast) <Radar size={16} className="animate-pulse" />
          </button>
        )}

        {/* 🚀 OPERATION FLEETPULSE OUTBOUND STATES */}
        {isBroadcasting && (
          <div className="flex items-center justify-center gap-2 text-indigo-600 text-xs font-bold bg-indigo-50 border border-indigo-100 px-3 py-3 rounded-lg w-full min-h-[44px]">
             <RefreshCw size={14} className="animate-spin" /> Pinging Zone Riders...
          </div>
        )}

        {isAccepted && (
          <div className="space-y-2 w-full">
            <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-white p-2 rounded border border-emerald-100">
               <Package size={14} /> Rider: {order.rider?.user?.full_name || 'Assigned'}
            </div>
            <button 
              onClick={() => onHandover(order.id)}
              className="w-full bg-emerald-600 text-white px-4 py-3 rounded-lg text-xs sm:text-sm font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-sm min-h-[44px]"
            >
              Handed to Rider <CheckCircle size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default function RestaurantDashboard({ restaurantName }) {
  const [stats, setStats] = useState({ net_earnings: 0, active_count: 0 });
  const [profile, setProfile] = useState(null); 
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const [dashboardRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/restaurant/dashboard`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/restaurant/stats`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      if (dashboardRes.ok && statsRes.ok) {
        const dashData = await dashboardRes.json();
        const statsData = await statsRes.json();

        // 🛡️ Ensure we grab ACCEPTED orders too!
        const activeOrders = (Array.isArray(dashData.orders) ? dashData.orders : []).filter(o => 
          ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'ACCEPTED'].includes(o.status)
        );

        setOrders(activeOrders);
        setProfile(dashData.profile); 
        setStats(statsData); 
        
        return dashData.profile; 
      }
    } catch (error) {
      console.error("Dashboard Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const setupSocket = async () => {
      const fetchedProfile = await fetchDashboard();
      
      if (fetchedProfile && mounted) {
          socket.connect();
          
          // Private Profile Room
          socket.emit('join_profile_room', { role: 'RESTAURANT', profileId: fetchedProfile.id });
          socket.emit('join_vendor_room', fetchedProfile.id); // Legacy fallback

          socket.on('kitchen_wake_up', () => {
              const audio = new Audio('/notification.mp3');
              audio.play().catch(e => console.warn("Audio blocked by browser policy:", e)); 
              fetchDashboard(); 
          });

          // 🚀 Triggered when Rider hits "I have the food"
          socket.on('handshake_complete', () => {
              fetchDashboard();
          });
      }
    };

    setupSocket();
    const interval = setInterval(fetchDashboard, 10000); 

    return () => {
        mounted = false;
        clearInterval(interval);
        socket.off('kitchen_wake_up');
        socket.off('handshake_complete');
        socket.disconnect();
    };
  }, []);

  const updateStatus = async (orderId, newStatus) => {
    const previousOrders = [...orders]; 

    try {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

      const token = localStorage.getItem('token');
      
      const res = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || errorData.message || "Server rejected update");
      }
      
      setTimeout(fetchDashboard, 500); 

    } catch (error) {
      alert(`Failed to update status: ${error.message}`);
      setOrders(previousOrders); 
    }
  };

  // 🤝 OPERATION FLEETPULSE: The Vendor Handshake
  const handleHandover = async (orderId) => {
    const previousOrders = [...orders];
    // Optimistically remove it from screen
    setOrders(prev => prev.filter(o => o.id !== orderId));

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/orders/${orderId}/handshake`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Handshake failed to verify");
      setTimeout(fetchDashboard, 500);
    } catch (error) {
      alert(`Handover sync failed: ${error.message}. Please check connection.`);
      setOrders(previousOrders);
    }
  };

  const pendingOrders = orders.filter(o => o.status === 'PENDING' || o.status === 'CONFIRMED');
  const preparingOrders = orders.filter(o => o.status === 'PREPARING');
  // 🚀 Combine Broadcasting and Accepted for the 3rd Column
  const outboundOrders = orders.filter(o => o.status === 'READY_FOR_PICKUP' || o.status === 'ACCEPTED');

  if (loading) return (
    <div className="flex h-96 items-center justify-center flex-col">
       <Loader2 className="animate-spin text-slate-300 mb-4" size={40} />
       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Opening Kitchen...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto pb-20">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800">Kitchen Dashboard 👨‍🍳</h1>
            <p className="text-xs sm:text-sm text-slate-500">Managing: <span className="font-bold">{restaurantName || profile?.restaurant_name}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10">
        <StatCard 
            title="Net Earnings" 
            value={`${Number(stats?.net_earnings || 0).toLocaleString()} XAF`}
            icon={DollarSign} 
            color="bg-emerald-500" 
            subtext="After platform fees"
        />
        <StatCard 
            title="Active Orders" 
            value={pendingOrders.length + preparingOrders.length}
            icon={ShoppingBag} 
            color="bg-blue-500" 
            subtext="In progress"
        />
        <StatCard 
            title="Kitchen Status" 
            value={profile?.is_open ? "Open" : "Closed"} 
            icon={profile?.is_open ? CheckCircle : PowerOff} 
            color={profile?.is_open ? "bg-slate-900" : "bg-red-500"} 
            subtext={profile?.is_open ? "Receiving orders" : "Store offline"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        
        {/* COL 1: NEW */}
        <div className="bg-slate-50 p-4 rounded-2xl min-h-[220px] lg:min-h-[500px] border border-slate-200 relative overflow-hidden">
          {pendingOrders.length > 0 && <div className="absolute inset-0 bg-orange-500/5 animate-pulse rounded-2xl pointer-events-none"></div>}
          
          <div className="flex items-center gap-2 mb-4 px-2 relative z-10">
            <div className={`w-3 h-3 rounded-full ${pendingOrders.length > 0 ? 'bg-orange-500 animate-bounce' : 'bg-slate-300'}`}></div>
            <h2 className="font-bold text-slate-700 uppercase tracking-wide text-sm sm:text-base">New Orders ({pendingOrders.length})</h2>
          </div>
          <div className="relative z-10">
              {pendingOrders.map(order => <OrderCard key={order.id} order={order} onUpdateStatus={updateStatus} onHandover={handleHandover} />)}
          </div>
          {pendingOrders.length === 0 && (
            <div className="h-36 sm:h-64 flex flex-col items-center justify-center text-slate-400 relative z-10">
                <ShoppingBag size={32} className="mb-2 opacity-20" />
                <p className="text-xs font-bold uppercase">No new orders</p>
            </div>
          )}
        </div>

        {/* COL 2: COOKING */}
        <div className="bg-slate-50 p-4 rounded-2xl min-h-[220px] lg:min-h-[500px] border border-slate-200">
          <div className="flex items-center gap-2 mb-4 px-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <h2 className="font-bold text-slate-700 uppercase tracking-wide text-sm sm:text-base">Cooking ({preparingOrders.length})</h2>
          </div>
          {preparingOrders.map(order => <OrderCard key={order.id} order={order} onUpdateStatus={updateStatus} onHandover={handleHandover} />)}
          {preparingOrders.length === 0 && (
             <div className="h-36 sm:h-64 flex flex-col items-center justify-center text-slate-400">
                <Clock size={32} className="mb-2 opacity-20" />
                <p className="text-xs font-bold uppercase">Stove is idle</p>
            </div>
          )}
        </div>

        {/* COL 3: OUTBOUND LOGISTICS */}
        <div className="bg-slate-50 p-4 rounded-2xl min-h-[220px] lg:min-h-[500px] border border-slate-200">
          <div className="flex items-center gap-2 mb-4 px-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <h2 className="font-bold text-slate-700 uppercase tracking-wide text-sm sm:text-base">Outbound ({outboundOrders.length})</h2>
          </div>
          {outboundOrders.map(order => <OrderCard key={order.id} order={order} onUpdateStatus={updateStatus} onHandover={handleHandover} />)}
          {outboundOrders.length === 0 && (
             <div className="h-36 sm:h-64 flex flex-col items-center justify-center text-slate-400">
                <CheckCircle size={32} className="mb-2 opacity-20" />
                <p className="text-xs font-bold uppercase">Queue Clear</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}