import React, { useState, useEffect, useRef } from 'react';
import { 
  Wallet, MessageSquare, MapPin, ShieldCheck, Power, Bell, Phone, Clock, 
  Loader2, LogOut, Lock, MessageCircle, Navigation, Box, Layers, Key, Radar
} from 'lucide-react';

import { io } from 'socket.io-client';

const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://zamdey-backend.onrender.com';
const API_URL = import.meta.env.VITE_API_URL || `${BASE_URL}/api`;

const socket = io(BASE_URL, {
  autoConnect: false 
});

export default function RiderDashboard() {
  const [riderProfile, setRiderProfile] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [isToggling, setIsToggling] = useState(false); 
  
  // 🚀 OPERATION FLEETPULSE STATES
  const [broadcastMissions, setBroadcastMissions] = useState([]);
  const [activeMissions, setActiveMissions] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // 🚨 AUDIO STATE
  const audioRef = useRef(null);

  // 🔒 ESCROW OTP STATE
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [currentDeliveryId, setCurrentDeliveryId] = useState(null);
  const [otpValue, setOtpValue] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // 🛠️ SETUP AUDIO
  useEffect(() => {
      audioRef.current = new Audio('/ringtone.mp3');
      audioRef.current.loop = true; 
  }, []);

  const playAlarm = () => {
      audioRef.current?.play().catch(e => console.log("Audio autoplay blocked"));
  };

  const stopAlarm = () => {
      audioRef.current?.pause();
      if(audioRef.current) audioRef.current.currentTime = 0;
  };

  // 🛠️ HELPER: WhatsApp Link
  const getWhatsAppLink = (phone) => {
    if (!phone || phone.includes("Locked")) return "#";
    let clean = phone.replace(/\D/g, ''); 
    if (!clean.startsWith('237')) clean = '237' + clean; 
    return `https://wa.me/${clean}`;
  };

  const formatOrder = (current) => {
    // Lock client details until the restaurant hands over the food (PICKED_UP) or rider is ON_THE_WAY
    const isLocked = current.status === 'ACCEPTED'; 
    return {
        id: current.id,
        ticket: current.ticket || current.ticket_number,
        restaurant: current.restaurant_name || current.restaurant?.restaurant_name,
        location: current.delivery_address,
        clientPhone: current.customer_phone || current.guest_phone || current.customer?.user?.phone,
        clientName: current.customer_name || current.guest_name || current.customer?.user?.full_name,
        instructions: current.delivery_instructions, 
        isLocked: isLocked,
        status: current.status,
        payout: current.delivery_fee || current.rider_profit
    };
  };

  // 🔄 THE MASTER SYNC & SOCKET SETUP
  const fetchDashboardState = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      const headers = { 'Authorization': `Bearer ${token}` };

      // 1. Fetch Profile Data
      const profileRes = await fetch(`${API_URL}/rider/profile`, { headers });
      let profileData = null;
      if (profileRes.ok) {
          profileData = await profileRes.json();
          setRiderProfile(profileData);
          setIsOnline(profileData.is_online); 
      }

      // 2. Fetch Active Queue Data
      const ordersRes = await fetch(`${API_URL}/rider/orders`, { headers });
      if (ordersRes.ok) {
        const orders = await ordersRes.json();
        
        const ongoing = orders.filter(o => ['ACCEPTED', 'PICKED_UP', 'ON_THE_WAY'].includes(o.status)).map(formatOrder);
        const broadcasts = orders.filter(o => o.status === 'READY_FOR_PICKUP').map(formatOrder);
        
        setActiveMissions(ongoing);
        setBroadcastMissions(broadcasts); 
      } 
      
      return profileData;

    } catch (error) {
      console.error("Sync Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // 📡 SOCKET INFRASTRUCTURE
  useEffect(() => {
    let mounted = true;

    const initializeSockets = async () => {
        const profile = await fetchDashboardState();

        if (profile && profile.current_zone && mounted) {
            socket.connect();
            
            // 1. Join Geographic Broadcast Zone
            socket.emit('join_zone_room', profile.current_zone);
            
            // 2. Join Private Command Channel
            socket.emit('join_profile_room', { role: 'RIDER', profileId: profile.id });

            // 🚨 INBOUND BROADCAST LISTENER
            socket.on('order_broadcast', (orderData) => {
                if (!profile.is_busy) {
                    setBroadcastMissions(prev => [...prev, formatOrder(orderData)]);
                    playAlarm();
                }
            });

            // 🚫 BROADCAST REVOKED LISTENER
            socket.on('broadcast_removed', ({ orderId }) => {
                setBroadcastMissions(prev => {
                    const filtered = prev.filter(o => o.id !== orderId);
                    if (filtered.length === 0) stopAlarm();
                    return filtered;
                });
            });

            // 🪖 MISSION ASSIGNED & HANDSHAKE SYNC
            socket.on('claim_success', () => fetchDashboardState());
            socket.on('handshake_complete', () => fetchDashboardState());
            socket.on('order_revoked', () => fetchDashboardState()); 
        }
    };

    initializeSockets();

    // Fallback Polling (Every 15s to keep UI fresh)
    const interval = setInterval(fetchDashboardState, 15000); 

    return () => {
        mounted = false;
        clearInterval(interval);
        socket.off('order_broadcast');
        socket.off('broadcast_removed');
        socket.off('claim_success');
        socket.off('handshake_complete');
        socket.off('order_revoked');
        socket.disconnect();
    };
  }, []);

  // 🟢 TOGGLE STATUS
  const toggleStatus = async () => {
    if (isToggling) return;
    setIsToggling(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/rider/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();
      if (res.ok) {
          setIsOnline(data.is_online); 
          setRiderProfile(prev => ({ ...prev, is_online: data.is_online }));
          
          if (!data.is_online) {
              setBroadcastMissions([]); 
              stopAlarm();
          } else {
              fetchDashboardState(); 
          }
      }
    } catch (error) { 
        console.error("Toggle failed", error);
    } finally {
        setIsToggling(false);
    }
  };

  // 🚀 OPERATION FLEETPULSE: ATOMIC CLAIM
  const handleAcceptMission = async (orderId) => {
      stopAlarm(); 

      try {
          const token = localStorage.getItem('token');
          const res = await fetch(`${API_URL}/orders/${orderId}/accept`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });

          const data = await res.json();

          if (res.ok) {
              setBroadcastMissions([]); 
              await fetchDashboardState(); 
          } else {
              alert(data.message || "Failed to claim mission.");
              setBroadcastMissions(prev => prev.filter(o => o.id !== orderId));
          }
      } catch (error) {
          console.error(error);
          alert("Network error.");
      }
  };

  // 🤝 OPERATION FLEETPULSE: THE HANDSHAKE
  const handleHandover = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/orders/${orderId}/handshake`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Failed to register handover");
      await fetchDashboardState();
    } catch (error) {
      alert("Sync failed. Check connection.");
    }
  };

  // 🔐 VERIFY DELIVERY (Escrow Release)
  const handleVerifyDelivery = async () => {
      if (otpValue.length !== 4) return alert("OTP must be exactly 4 digits");
      setIsVerifying(true);

      try {
          const token = localStorage.getItem('token');
          const res = await fetch(`${API_URL}/orders/${currentDeliveryId}/verify-delivery`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ otp: otpValue })
          });

          const data = await res.json();

          if (res.ok) {
              setOtpModalOpen(false);
              setOtpValue("");
              setCurrentDeliveryId(null);
              await fetchDashboardState();
          } else {
              alert(data.error || "Invalid OTP. Delivery not verified.");
          }
      } catch (error) {
          console.error(error);
          alert("Network error during verification.");
      } finally {
          setIsVerifying(false);
      }
  };

  const confirmLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('zamdey_user');
    window.location.reload(); 
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-slate-900" /></div>;

  return (
    <div className="max-w-[480px] mx-auto space-y-5 sm:space-y-6 pb-24 px-1 sm:px-4 font-sans">
      
      {/* HEADER */}
      <div className="flex items-center justify-between px-2">
        <div>
           <h1 className="text-xl sm:text-2xl font-black text-slate-900 italic tracking-tighter uppercase">Rider Portal</h1>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{riderProfile?.user?.full_name || "Active Partner"}</p>
        </div>
        <button onClick={() => setIsLogoutModalOpen(true)} className="w-10 h-10 bg-white text-rose-500 rounded-xl flex items-center justify-center shadow-sm border border-slate-100 min-h-[40px] min-w-[40px]"><LogOut size={18} /></button>
      </div>

      {/* STATUS & WALLET ROW */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className={`p-3.5 sm:p-4 rounded-2xl sm:rounded-[24px] border-2 flex flex-col justify-between h-32 transition-colors duration-300 ${isOnline ? 'bg-emerald-500 border-emerald-600 text-white' : 'bg-white border-slate-200 text-slate-400'}`}>
            <div className="flex justify-between items-start">
                 <Power size={20} className={isOnline ? "text-emerald-200" : "text-slate-300"} />
                 <button 
                   onClick={toggleStatus} 
                   disabled={isToggling}
                   className={`text-[10px] font-black uppercase border px-2 py-1 rounded-lg transition-all ${
                       isOnline 
                       ? 'border-white/30 hover:bg-white/20' 
                       : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                   }`}
                 >
                     {isToggling ? <Loader2 className="animate-spin" size={12}/> : (isOnline ? 'Go Offline' : 'Go Online')}
                 </button>
            </div>
            <div>
                 <h3 className="text-base sm:text-lg font-black italic uppercase">{isOnline ? 'Online' : 'Offline'}</h3>
                 <p className="text-[9px] opacity-80">{isOnline ? "Listening to Zone Broadcasts" : "Status Hidden"}</p>
            </div>
          </div>

          <div className="bg-slate-900 p-3.5 sm:p-4 rounded-2xl sm:rounded-[24px] text-white shadow-xl h-32 flex flex-col justify-between relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10"><Wallet size={64} /></div>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Balance</p>
             <h3 className="text-xl sm:text-2xl font-black italic tracking-tighter truncate">
                {riderProfile?.wallet_balance?.toLocaleString() || 0} <span className="text-xs sm:text-sm font-normal text-slate-500">FRS</span>
             </h3>
          </div>
      </div>

      {/* 🚀 THE RADAR (Broadcast Missions) */}
      {isOnline && broadcastMissions.length > 0 && activeMissions.length === 0 && (
          <div className="animate-in slide-in-from-top-4">
              <div className="flex items-center gap-2 mb-2 px-2">
                  <Radar size={16} className="text-rose-500 animate-pulse" />
                  <span className="text-xs font-black text-rose-500 uppercase tracking-widest">Active Broadcasts ({broadcastMissions.length})</span>
              </div>
              
              <div className="space-y-4">
                  {broadcastMissions.map((mission) => (
                      <div key={mission.id} className="bg-white border-2 border-rose-200 rounded-[32px] p-6 shadow-xl shadow-rose-100">
                           <div className="flex justify-between items-start mb-4">
                               <span className="px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-black rounded-full uppercase tracking-wide">
                                   NEW MISSION
                               </span>
                               <span className="text-[10px] font-bold text-slate-400">#{mission.ticket}</span>
                           </div>
                           
                           <div className="space-y-3 mb-6">
                               <div>
                                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Pickup Location</p>
                                   <p className="text-sm font-black text-slate-800 leading-tight uppercase">{mission.restaurant}</p>
                                   <p className="text-xs font-bold text-slate-500 leading-tight">{mission.location}</p>
                               </div>
                               <div>
                                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Delivery Vector</p>
                                   <p className="text-sm font-black text-slate-800 leading-tight">{mission.location}</p>
                               </div>
                           </div>

                           <button 
                             onClick={() => handleAcceptMission(mission.id)}
                             className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg hover:bg-black transition-all"
                           >
                               <Layers size={18} /> Accept Mission
                           </button>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* ACTIVE MISSIONS */}
      {activeMissions.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 px-2 mt-8">
              <Navigation size={14} className="text-indigo-500" /> Active Mission Lock
            </h4>
            
            {activeMissions.map((order) => (
                <div key={order.id} className="bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm">
                   <div className="flex justify-between items-start mb-4 border-b border-slate-50 pb-4">
                      <div>
                          <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-full uppercase tracking-wide mb-1 inline-block">
                              {order.status.replace(/_/g, ' ')}
                          </span>
                          <h5 className="text-xl font-black text-slate-900 italic uppercase tracking-tight mt-1">{order.restaurant}</h5>
                      </div>
                      <div className="text-right">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase">Ticket</span>
                          <span className="block text-sm font-mono font-black text-slate-700">#{order.ticket}</span>
                      </div>
                   </div>

                   <div className="space-y-4 mb-6">
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                                <MapPin size={16} className="text-slate-400"/>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Destination</p>
                                <p className="text-sm font-bold text-slate-800 leading-tight">{order.location}</p>
                            </div>
                        </div>

                        {/* 🔒 Show Client Info only if it's unlocked */}
                        {!order.isLocked && (
                            <div className="flex gap-3 animate-in fade-in">
                                 <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                                    <MessageSquare size={16} className="text-slate-400"/>
                                </div>
                                <div className="w-full">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Client Details</p>
                                    <div className="flex justify-between items-center mt-1">
                                        <p className="text-sm font-bold text-slate-800">{order.clientName}</p>
                                        <div className="flex gap-2">
                                            <a href={`tel:${order.clientPhone}`} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200"><Phone size={14}/></a>
                                            <a href={getWhatsAppLink(order.clientPhone)} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 hover:bg-emerald-200"><MessageCircle size={14}/></a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                   </div>

                   {/* 🚨 THE FIX: Enforcing the strict Vendor-first Handshake Flow 🚨 */}
                   
                   {/* ⏱️ STEP 1: RIDER WAITING FOR VENDOR (Status: ACCEPTED) */}
                   {order.status === 'ACCEPTED' && (
                        <div className="w-full bg-amber-50 text-amber-600 py-4 rounded-2xl border border-amber-200 font-black uppercase flex items-center justify-center gap-3 px-4 shadow-sm">
                            <Loader2 size={16} className="animate-spin shrink-0" /> 
                            <span className="text-[10px] tracking-widest text-left">Head to kitchen. Waiting for vendor handover</span>
                        </div>
                   )}

                   {/* 🤝 STEP 2: VENDOR HANDED OVER, RIDER CONFIRMS (Status: PICKED_UP) */}
                   {order.status === 'PICKED_UP' && (
                        <div className="space-y-3 animate-in zoom-in-95 duration-300">
                            <p className="text-[10px] font-bold text-slate-500 text-center uppercase">Vendor has handed over the food.</p>
                            <button onClick={() => handleHandover(order.id)} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase flex items-center justify-center gap-3 shadow-lg shadow-indigo-100 text-xs hover:scale-[1.02] transition-transform">
                                <Box size={18} /> Confirm: I Have The Food
                            </button>
                        </div>
                   )}

                   {/* 🚚 STEP 3: TRANSIT & VERIFY (Status: ON_THE_WAY) */}
                   {order.status === 'ON_THE_WAY' && (
                        <button 
                            onClick={() => {
                                setCurrentDeliveryId(order.id);
                                setOtpModalOpen(true);
                            }} 
                            className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-black uppercase flex items-center justify-center gap-3 shadow-lg shadow-emerald-100 text-xs hover:scale-[1.02] transition-transform animate-in fade-in"
                        >
                            <ShieldCheck size={18} /> Verify Delivery PIN
                        </button>
                   )}
                </div>
            ))}
          </div>
      )}

      {/* EMPTY STATE */}
      {isOnline && broadcastMissions.length === 0 && activeMissions.length === 0 && (
          <div className="p-12 text-center bg-white rounded-[40px] border-2 border-dashed border-slate-200 opacity-60 mt-10">
            <Radar className="mx-auto text-indigo-400 mb-4 animate-pulse" size={48} />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scanning Zone Channels...</p>
          </div>
      )}

      {/* 🔐 OTP ESCROW MODAL */}
      {otpModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => !isVerifying && setOtpModalOpen(false)} />
          <div className="bg-white rounded-[32px] p-8 w-full max-w-sm relative z-10 shadow-2xl border-2 border-emerald-100 animate-in zoom-in-95">
              <div className="text-center">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Key size={24} className="text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 uppercase italic">Delivery PIN</h3>
                  <p className="text-xs text-slate-500 mt-2 mb-6">Ask the customer for their 4-digit PIN to release your payment.</p>
                  
                  <input 
                      type="text" 
                      maxLength={4}
                      value={otpValue}
                      onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-center text-4xl font-black tracking-[0.5em] text-slate-900 bg-slate-50 border-2 border-slate-200 rounded-2xl py-4 focus:border-emerald-500 focus:outline-none transition-colors"
                      placeholder="••••"
                  />

                  <div className="grid grid-cols-2 gap-3 w-full pt-6">
                      <button 
                        onClick={() => {
                            setOtpModalOpen(false);
                            setOtpValue("");
                        }} 
                        disabled={isVerifying}
                        className="py-4 rounded-xl font-black text-xs uppercase bg-slate-100 text-slate-500"
                      >
                          Cancel
                      </button>
                      <button 
                        onClick={handleVerifyDelivery} 
                        disabled={isVerifying || otpValue.length !== 4}
                        className="py-4 rounded-xl font-black text-xs uppercase bg-emerald-500 text-white disabled:opacity-50 flex justify-center items-center gap-2"
                      >
                          {isVerifying ? <Loader2 className="animate-spin" size={16}/> : 'Verify & Cash Out'}
                      </button>
                  </div>
              </div>
          </div>
        </div>
      )}

      {/* LOGOUT MODAL */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsLogoutModalOpen(false)} />
          <div className="bg-white rounded-[32px] p-8 w-full max-w-sm relative z-10 shadow-2xl border-2 border-slate-100">
              <div className="text-center">
                  <h3 className="text-xl font-black text-slate-900 uppercase italic">Sign Out?</h3>
                  <div className="grid grid-cols-2 gap-3 w-full pt-6">
                      <button onClick={() => setIsLogoutModalOpen(false)} className="py-3 rounded-xl font-bold text-xs uppercase bg-slate-100 text-slate-500">Cancel</button>
                      <button onClick={confirmLogout} className="py-3 rounded-xl font-bold text-xs uppercase bg-rose-500 text-white">Confirm</button>
                  </div>
              </div>
          </div>
        </div>
      )}
    </div>
  );
}