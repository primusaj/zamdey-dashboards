import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, ChevronDown, Shield, LogOut, 
  User, Store, Bike, CreditCard, X 
} from 'lucide-react';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'https://zamdey-backend.onrender.com/api:5000/api';
const BASE_URL = API_URL.replace('/api', '');

// 🎧 GLOBAL LOUD AUDIO ENGINE (No MP3 files needed!)
let globalAudioCtx = null;
let isAudioUnlocked = false;

const initGlobalAudio = () => {
  if (isAudioUnlocked) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    globalAudioCtx = new AudioContext();
    globalAudioCtx.resume();

    // Play a 0.01s silent sound to unlock the browser's audio engine
    const osc = globalAudioCtx.createOscillator();
    const gain = globalAudioCtx.createGain();
    gain.gain.value = 0;
    osc.connect(gain);
    gain.connect(globalAudioCtx.destination);
    osc.start(0);
    osc.stop(globalAudioCtx.currentTime + 0.01);

    isAudioUnlocked = true;
    console.log("🔊 Loud Audio Engine Unlocked");
    
    window.removeEventListener('click', initGlobalAudio, true);
    window.removeEventListener('keydown', initGlobalAudio, true);
  } catch (e) {
    console.error("Audio unlock failed:", e);
  }
};

export default function Header({ activeView, userRole, identity, onLogout }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // 🔔 NOTIFICATION STATES
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);

  // 🔓 ATTACH THE BROWSER AUTOPLAY UNLOCKER
  useEffect(() => {
    window.addEventListener('click', initGlobalAudio, true);
    window.addEventListener('keydown', initGlobalAudio, true);
    return () => {
      window.removeEventListener('click', initGlobalAudio, true);
      window.removeEventListener('keydown', initGlobalAudio, true);
    };
  }, []);

  // 🚨 SYNTHESIZE A LOUD DIGITAL ALARM (100% Volume)
  const playLoudAlarm = () => {
    try {
      if (!globalAudioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        globalAudioCtx = new AudioContext();
      }
      if (globalAudioCtx.state === 'suspended') globalAudioCtx.resume();

      // Oscillator 1 (Harsh Square Wave)
      const osc1 = globalAudioCtx.createOscillator();
      // Oscillator 2 (Piercing Triangle Wave)
      const osc2 = globalAudioCtx.createOscillator();
      const gainNode = globalAudioCtx.createGain();

      osc1.type = 'square';
      osc2.type = 'triangle';
      
      // High pitched digital chime frequencies
      osc1.frequency.setValueAtTime(800, globalAudioCtx.currentTime);
      osc2.frequency.setValueAtTime(1200, globalAudioCtx.currentTime);

      // Max Volume (1.0)
      gainNode.gain.setValueAtTime(1, globalAudioCtx.currentTime); 
      gainNode.gain.exponentialRampToValueAtTime(0.01, globalAudioCtx.currentTime + 0.6); 

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(globalAudioCtx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(globalAudioCtx.currentTime + 0.6);
      osc2.stop(globalAudioCtx.currentTime + 0.6);
    } catch (e) {
      console.log("Audio playback blocked:", e);
    }
  };

  // 🖱️ Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 📥 FETCH INITIAL NOTIFICATIONS HISTORY
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch(`${API_URL}/notifications`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setNotifications(data.notifications);
            setUnreadCount(data.unreadCount);
          }
        }
      } catch (error) {
        console.error("Failed to fetch initial notifications:", error);
      }
    };
    
    fetchNotifications();
  }, []);

  // 📡 REAL-TIME SOCKET LISTENER FOR NOTIFICATIONS
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('zamdey_user'));
    
    if (token && user) {
        socketRef.current = io(BASE_URL);

        // 1. Join User ID Room (For generic notifications)
        let dbRole = userRole;
        if (userRole === 'vendor') dbRole = 'restaurant';
        socketRef.current.emit('join_profile_room', { role: dbRole, profileId: user.id });

        // 🚨 2. FUNDAMENTAL FIX: Vendor MUST join their PROFILE ID Room for Kitchen Wakeup
        if (userRole === 'vendor' && user.profile_id) {
            socketRef.current.emit('join_profile_room', { role: 'restaurant', profileId: user.profile_id });
            socketRef.current.emit('join_vendor_room', user.profile_id); // Legacy fallback
        }

        // 🎧 Listen for standard notifications
        socketRef.current.on('new_notification', (newNotif) => {
            console.log("🔔 Socket: New Notification Received!");
            setNotifications(prev => [newNotif, ...prev]);
            setUnreadCount(prev => prev + 1);
            playLoudAlarm();
        });

        // 🎧 Listen for explicit Kitchen Wake Up calls (from PawaPay)
        socketRef.current.on('kitchen_wake_up', (data) => {
            console.log("🚨 Socket: KITCHEN WAKE UP!", data);
            playLoudAlarm();
            
            // Add a visual notification if the backend didn't save one automatically
            const wakeupNotif = {
                id: Math.random().toString(),
                title: "🚨 NEW PAID ORDER!",
                body: data.message || "Review and Accept immediately.",
                created_at: new Date().toISOString(),
                is_read: false
            };
            setNotifications(prev => [wakeupNotif, ...prev]);
            setUnreadCount(prev => prev + 1);
        });

        // 🎧 Listen for Zone Broadcasts (Admin/Rider overlapping)
        socketRef.current.on('order_broadcast', () => {
            playLoudAlarm();
        });
    }

    return () => {
        if (socketRef.current) socketRef.current.disconnect();
    };
  }, [userRole]);

  // ✅ MARK AS READ LOGIC
  const handleMarkAsRead = async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) { console.error("Failed to mark as read"); }
  };

  const handleMarkAllAsRead = async () => {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      try {
          const token = localStorage.getItem('token');
          await fetch(`${API_URL}/notifications/read-all`, {
              method: 'PATCH',
              headers: { 'Authorization': `Bearer ${token}` }
          });
      } catch (e) { console.error(e); }
  };

  const getRoleBadge = () => {
    if (userRole === 'admin') return { label: 'Administrator', icon: <Shield size={12} />, bg: 'bg-slate-900', text: 'text-white' };
    if (userRole === 'vendor') return { label: 'Vendor Partner', icon: <Store size={12} />, bg: 'bg-indigo-600', text: 'text-white' };
    if (userRole === 'rider') return { label: 'Logistics Partner', icon: <Bike size={12} />, bg: 'bg-emerald-600', text: 'text-white' };
    return { label: 'User', icon: <User size={12} />, bg: 'bg-slate-200', text: 'text-slate-600' };
  };

  const badge = getRoleBadge();

  return (
    <header className="flex justify-between items-center mb-8 relative z-20">
      
      {/* 📍 LEFT: BREADCRUMBS */}
      <div>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
          <span>Portal</span>
          <span className="text-slate-300">/</span>
          <span className="text-indigo-600">{userRole}</span>
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">{activeView}</h2>
      </div>

      {/* 👉 RIGHT: ACTIONS & SMART PILL */}
      <div className="flex items-center gap-4">
        
        {/* 🔔 THE NOTIFICATION ENGINE */}
        <div className="relative" ref={notifRef}>
          <button 
             onClick={() => {
                setIsNotificationsOpen(!isNotificationsOpen);
                if (isProfileOpen) setIsProfileOpen(false);
             }}
             className={`w-10 h-10 border rounded-xl flex items-center justify-center transition-all shadow-sm relative ${
                isNotificationsOpen ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-100'
             }`}
          >
            <Bell size={18} className={unreadCount > 0 ? "animate-pulse" : ""} />
            {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center border-2 border-white">
                    <span className="text-[8px] font-black text-white">{unreadCount}</span>
                </div>
            )}
          </button>

          {/* 📥 NOTIFICATIONS DROPDOWN */}
          {isNotificationsOpen && (
              <div className="absolute top-full right-0 mt-3 w-80 bg-white rounded-[24px] border border-slate-100 shadow-2xl overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <div>
                          <h3 className="text-sm font-black text-slate-900 uppercase italic">Notifications</h3>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Live Updates</p>
                      </div>
                      {unreadCount > 0 && (
                          <button onClick={handleMarkAllAsRead} className="text-[9px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded-md">
                              Mark all read
                          </button>
                      )}
                  </div>
                  
                  <div className="max-h-80 overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 ? (
                          <div className="p-8 text-center">
                              <Bell className="mx-auto text-slate-300 mb-2" size={24} />
                              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">All caught up!</p>
                          </div>
                      ) : (
                          notifications.map((notif) => (
                              <button 
                                  key={notif.id}
                                  onClick={() => handleMarkAsRead(notif.id)}
                                  className={`w-full text-left p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors flex gap-3 ${!notif.is_read ? 'bg-indigo-50/30' : ''}`}
                              >
                                  <div className="mt-1 flex-shrink-0">
                                      {!notif.is_read && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                                  </div>
                                  <div>
                                      <p className={`text-xs font-black uppercase ${!notif.is_read ? 'text-slate-900' : 'text-slate-700'}`}>{notif.title}</p>
                                      <p className="text-[11px] text-slate-500 leading-snug mt-1">{notif.body}</p>
                                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                                          {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </p>
                                  </div>
                              </button>
                          ))
                      )}
                  </div>
              </div>
          )}
        </div>

        {/* 👤 SMART IDENTITY PILL */}
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => {
                setIsProfileOpen(!isProfileOpen);
                if (isNotificationsOpen) setIsNotificationsOpen(false);
            }}
            className={`flex items-center gap-3 pl-4 pr-3 py-2 rounded-xl border transition-all duration-300 ${
              isProfileOpen 
                ? 'bg-slate-900 border-slate-900 text-white shadow-xl' 
                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
            }`}
          >
            {/* Text Only Identity */}
            <div className="text-right">
              <p className={`text-xs font-black uppercase tracking-wide leading-none ${isProfileOpen ? 'text-white' : 'text-slate-900'}`}>
                {identity}
              </p>
              <p className={`text-[9px] font-bold uppercase tracking-widest mt-1 ${isProfileOpen ? 'text-slate-400' : 'text-slate-400'}`}>
                {badge.label}
              </p>
            </div>
            
            {/* Chevron Toggles State */}
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform duration-300 ${isProfileOpen ? 'rotate-180 bg-slate-800 text-white' : 'bg-slate-100 text-slate-400'}`}>
               <ChevronDown size={14} strokeWidth={3} />
            </div>
          </button>

          {/* 🔽 EXPANDED DETAILS */}
          {isProfileOpen && (
            <div className="absolute top-full right-0 mt-3 w-72 bg-white rounded-[24px] border border-slate-100 shadow-2xl p-5 animate-in slide-in-from-top-2 fade-in duration-200 overflow-hidden">
               
               <div className={`absolute top-0 left-0 w-full h-1.5 ${badge.bg}`} />

               <div className="mb-6">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Active Session</p>
                  
                  <div className="space-y-3">
                     <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${badge.bg} ${badge.text}`}>
                           {badge.icon}
                        </div>
                        <div>
                           <p className="text-xs font-black text-slate-900">{identity}</p>
                           <p className="text-[10px] font-bold text-slate-400 uppercase">{userRole} Access</p>
                        </div>
                     </div>

                     {userRole !== 'admin' && (
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                           <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
                              <CreditCard size={12} /> Wallet
                           </span>
                           <span className="text-xs font-black text-emerald-600">Active</span>
                        </div>
                     )}
                  </div>
               </div>

               <div className="pt-4 border-t border-slate-100">
                  <button 
                    onClick={onLogout}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-50 text-rose-600 font-black text-[10px] uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all"
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
               </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}