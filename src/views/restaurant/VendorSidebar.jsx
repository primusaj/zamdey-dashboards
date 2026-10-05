import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, ShoppingBag, Settings, 
  ChefHat, UtensilsCrossed, LogOut, AlertCircle 
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://zamdey-backend.onrender.com/api:5000/api';

export default function VendorSidebar({ activeView, setActiveView }) {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  
  // 🚨 NEW: State to hold the dynamic support number, with a fallback default
  const [supportNumber, setSupportNumber] = useState('670 00 00 00');

  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Inventory', icon: <ChefHat size={20} /> },
    { name: 'Sales', icon: <ShoppingBag size={20} /> },
    { name: 'Kitchen', icon: <UtensilsCrossed size={20} /> },
    { name: 'Settings', icon: <Settings size={20} /> },
  ];

  // 🔄 FETCH PLATFORM SETTINGS
  useEffect(() => {
    const fetchSupportSettings = async () => {
      try {
        // We will build this public/global endpoint when we tackle the Admin panel
        const res = await fetch(`${API_URL}/platform/settings`);
        if (res.ok) {
          const data = await res.json();
          if (data.support_phone) {
            setSupportNumber(data.support_phone);
          }
        }
      } catch (error) {
        // Silently fail and use the default state if the backend route isn't built yet
        console.log("Support number sync pending Admin module completion.");
      }
    };

    fetchSupportSettings();
  }, []);

  // 🚪 EXECUTE LOGOUT (After confirmation)
  const confirmLogout = () => {
    // 1. Clear Session
    localStorage.removeItem('zamdey_user');
    localStorage.removeItem('zamdey_last_view');
    localStorage.removeItem('token');
    
    // 2. Force Reload (Redirects to Login)
    window.location.reload();
  };

  return (
    <>
      <aside className="w-64 bg-white border-r border-slate-200 h-screen fixed left-0 top-0 p-6 flex flex-col z-50">
        
        {/* HEADER */}
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <ChefHat className="text-white" size={18} />
          </div>
          <span className="font-black text-lg text-slate-900 tracking-tight italic">ZAMDEY VENDOR</span>
        </div>

        {/* NAV LINKS */}
        <nav className="space-y-2 flex-1">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveView(item.name)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group ${
                activeView === item.name 
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' 
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {item.icon}
              <span className="text-xs font-black uppercase tracking-widest">{item.name}</span>
            </button>
          ))}
        </nav>
        
        {/* 🔴 LOGOUT BUTTON (Triggers Modal) */}
        <div className="mb-6 border-t border-slate-100 pt-6">
          <button
              onClick={() => setIsLogoutModalOpen(true)}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-rose-500 hover:bg-rose-50 transition-all duration-300"
          >
              <LogOut size={20} />
              <span className="text-xs font-black uppercase tracking-widest">Sign Out</span>
          </button>
        </div>

        {/* SUPPORT BOX */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Support Line</p>
          {/* 🚨 DYNAMIC NUMBER DISPLAY */}
          <p className="text-xs font-bold text-slate-900 mt-1">{supportNumber}</p>
        </div>
      </aside>

      {/* 🛑 CUSTOM LOGOUT MODAL */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsLogoutModalOpen(false)}
          />
          
          {/* Modal Content */}
          <div className="bg-white rounded-[32px] p-8 w-full max-w-sm relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 border-2 border-slate-100">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-2">
                <AlertCircle className="text-rose-500" size={32} strokeWidth={2.5} />
              </div>
              
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase italic">Signing Out?</h3>
                <p className="text-xs font-bold text-slate-400 mt-2 px-4">
                  You are about to end your session. Any unsaved changes might be lost.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full pt-4">
                <button 
                  onClick={() => setIsLogoutModalOpen(false)}
                  className="w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-slate-50 text-slate-400 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmLogout}
                  className="w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-rose-500 text-white shadow-lg shadow-rose-200 hover:bg-rose-600 transition-all hover:scale-[1.02]"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}