import React, { useState, useEffect } from 'react';

// --- CORE COMPONENTS ---
import Login from './views/Login'; 
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// --- VENDOR COMPONENTS ---
import VendorSidebar from './views/restaurant/VendorSidebar'; 

// --- ADMIN VIEWS ---
import Analytics from './views/Analytics';
import Operations from './views/Operations';
import Zones from './views/Zones'; 
import Finances from './views/Finances';
import Riders from './views/Riders'; 
import Restaurants from './views/Restaurants';
import Customers from './views/Customers';
import Complaints from './views/Complaints';
import Reassignment from './views/Reassignment';
import Approvals from './views/Approvals'; 
import AdminSettings from "./views/AdminSettingsScreen";
import Payroll from './views/Payroll'; 

// 🚀 NEW: CONTENT MANAGER IMPORT
import ContentManager from './views/Content';

// --- RESTAURANT (VENDOR) VIEWS ---
import RestaurantDashboard from './views/restaurant/Dashboard';
import Inventory from './views/restaurant/Inventory';
import RestaurantSettings from './views/restaurant/Settings'; 
import Sales from './views/restaurant/Sales';
import Kitchen from './views/restaurant/Kitchen'; 

// --- RIDER VIEWS ---
import RiderDashboard from './views/rider/RiderDashboard';
import RiderEarnings from './views/rider/RiderEarnings'; 

// 🔗 CONFIG
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function App() {
  
  // 🛠️ HELPER: Normalize Roles
  const normalizeUser = (userData, token) => {
    if (!userData) return null;
    let r = userData.role;
    
    // Map Backend Enums to Frontend Keys
    if (r === 'RESTAURANT') r = 'vendor';
    if (r === 'RIDER') r = 'rider';
    if (r === 'ADMIN') r = 'admin';

    return { ...userData, role: r, token: token || userData.token };
  };

  // 🔐 AUTH STATE
  const [user, setUser] = useState(() => {
      try {
        const savedUser = localStorage.getItem('zamdey_user');
        const savedToken = localStorage.getItem('token');
        
        if (savedUser && savedToken) {
            const parsed = JSON.parse(savedUser);
            return normalizeUser(parsed, savedToken);
        }
        return null;
      } catch (e) {
        return null;
      }
  });

  // 📄 VIEW STATE
  const [activeView, setActiveView] = useState(() => {
      return localStorage.getItem('zamdey_last_view') || 'Dashboard';
  });

  // 🌍 GLOBAL STATE
  const [locations, setLocations] = useState([]);
  const [restaurantsList, setRestaurantsList] = useState([]); 
  const [platformSettings, setPlatformSettings] = useState(null); // 🚨 NEW: Global Settings State
  const [loading, setLoading] = useState(false);

  // 💾 SAVE VIEW
  useEffect(() => {
      if (activeView) {
          localStorage.setItem('zamdey_last_view', activeView);
      }
  }, [activeView]);

  // 🚪 LOGOUT
  const handleLogout = () => {
      console.warn("🔒 Logging out...");
      localStorage.removeItem('zamdey_user');
      localStorage.removeItem('zamdey_last_view');
      localStorage.removeItem('token'); 
      setUser(null);
      setActiveView('Dashboard');
  };

  // 🔄 SYNC DATA
  useEffect(() => {
    if (user && user.token) {
      const fetchGlobalData = async () => {
        setLoading(true);
        try {
          // 1. Fetch Zones
          const zonesRes = await fetch(`${API_URL}/zones`);
          if (zonesRes.ok) {
             const zonesData = await zonesRes.json();
             if (Array.isArray(zonesData)) setLocations(zonesData);
          }

          // 2. Fetch Restaurants
          const restRes = await fetch(`${API_URL}/admin/restaurants`, {
             headers: { 'Authorization': `Bearer ${user.token}` } 
          }); 
          if (restRes.ok) {
            const restData = await restRes.json();
            if (Array.isArray(restData)) setRestaurantsList(restData);
          }

          // 3. 🚨 Fetch Platform Settings (To pass to Vendor/Rider Sidebars later)
          const settingsRes = await fetch(`${API_URL}/admin/settings`, {
             headers: { 'Authorization': `Bearer ${user.token}` } 
          }); 
          if (settingsRes.ok) {
            const settingsData = await settingsRes.json();
            setPlatformSettings(settingsData);
          }

        } catch (error) {
          console.error("⚠️ Sync Warning:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchGlobalData();
    }
  }, [user]);

  // 🔑 LOGIN
  const handleLogin = (loggedInUser, argToken) => {
      const token = argToken || loggedInUser.token || loggedInUser.access_token;

      if (!token) {
          alert("Login Error: Server did not send a session token.");
          return;
      }

      const finalUser = normalizeUser(loggedInUser, token);
      console.log("✅ Session Started for:", finalUser.role);

      setUser(finalUser);
      localStorage.setItem('zamdey_user', JSON.stringify(finalUser));
      localStorage.setItem('token', token); 
      setActiveView('Dashboard');
  };

  // 🛑 GUARD
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const { role, full_name, name } = user;
  const identity = full_name || name || "User"; 

  // 🔀 ROUTER SWITCHBOARD
  const renderView = () => {
    
    // 🏍️ RIDER LOGIC
    if (role === 'rider') {
      switch (activeView) {
        case 'Dashboard': return <RiderDashboard riderName={identity} user={user} platformSettings={platformSettings} />;
        case 'Earnings':  return <RiderEarnings riderName={identity} user={user} />;
        default:          return <RiderDashboard riderName={identity} user={user} />;
      }
    }

    // 🍳 VENDOR LOGIC
    if (role === 'vendor') {
      switch (activeView) {
        case 'Dashboard': return <RestaurantDashboard restaurantName={identity} user={user} />;
        case 'Inventory': return <Inventory restaurantName={identity} user={user} />;
        case 'Sales':     return <Sales restaurantName={identity} restaurants={restaurantsList} user={user} />;
        case 'Kitchen':   return <Kitchen restaurantName={identity} user={user} />;
        case 'Settings':  return <RestaurantSettings restaurantName={identity} zones={locations} user={user} />;
        default:          return <RestaurantDashboard restaurantName={identity} user={user} />;
      }
    }

    // 👑 ADMIN LOGIC
    if (role === 'admin') {
      switch (activeView) {
        case 'Dashboard':    return <Analytics restaurants={restaurantsList} locations={locations} />;
        case 'Approvals':    return <Approvals />;
        case 'Operations':   return <Operations locations={locations} />;
        case 'Zones':        return <Zones locations={locations} setLocations={setLocations} />; 
        case 'Riders':       return <Riders />; 
        case 'Restaurants':  return <Restaurants locations={locations} restaurants={restaurantsList} />;
        case 'Finances':     return <Finances restaurants={restaurantsList} />;
        case 'Payroll':      return <Payroll />; 
        case 'Customers':    return <Customers />;
        case 'Complaints':   return <Complaints />;
        case 'Reassignment': return <Reassignment />;
        case 'Settings':     return <AdminSettings />; 
        case 'Content':      return <ContentManager />; // 🚀 NEW: WIRED UP THE CONTENT MANAGER!
        default:             return <Analytics restaurants={restaurantsList} locations={locations} />;
      }
    }

    // ⛔ FALLBACK
    return (
        <div className="flex flex-col items-center justify-center h-full">
            <h2 className="text-xl font-bold text-red-600">Access Error</h2>
            <p className="text-slate-500">Unknown Role: {role}</p>
            <button onClick={handleLogout} className="mt-4 px-4 py-2 bg-slate-900 text-white rounded">Logout</button>
        </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* SIDEBARS */}
      <div className="z-50 relative">
        {role === 'admin' && <Sidebar activeView={activeView} setActiveView={setActiveView} />}
        {role === 'vendor' && <VendorSidebar activeView={activeView} setActiveView={setActiveView} platformSettings={platformSettings} />}
      </div>
      
      {/* MAIN CONTENT AREA */}
      <main className={`flex-1 p-10 relative z-0 ${role !== 'rider' ? 'ml-64' : 'ml-0'}`}>
        <Header activeView={activeView} userRole={role} identity={identity} onLogout={handleLogout} platformSettings={platformSettings} />
        
        {/* VIEW CONTAINER */}
        <div className="mt-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
               <div className="animate-spin w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full"></div>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Data...</p>
            </div>
          ) : renderView()}
        </div>
        
        {/* RIDER MOBILE BOTTOM NAV */}
        {role === 'rider' && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-slate-900 z-50 flex justify-around p-4 md:hidden">
              <button onClick={() => setActiveView('Dashboard')} className={`font-black text-[10px] uppercase ${activeView === 'Dashboard' ? 'text-emerald-600' : 'text-slate-400'}`}>Tasks</button>
              <button onClick={() => setActiveView('Earnings')} className={`font-black text-[10px] uppercase ${activeView === 'Earnings' ? 'text-emerald-600' : 'text-slate-400'}`}>Wallet</button>
          </div>
        )}
      </main>
    </div>
  );
}