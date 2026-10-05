import React, { useState } from 'react';
import { LogOut, AlertCircle, X } from 'lucide-react'; 

const NavItem = ({ icon, label, active, onClick }) => (
  <div 
    onClick={onClick} 
    className={`flex items-center gap-4 px-6 py-3 cursor-pointer rounded-xl transition-all leading-none min-h-[44px] ${
      active 
      ? 'bg-indigo-700 text-white shadow-lg font-bold' 
      : 'text-slate-600 hover:bg-slate-100 font-medium'
    }`}
  >
    <span className="text-lg leading-none shrink-0">{icon}</span>
    <span className="text-sm tracking-tight truncate">{label}</span>
  </div>
);

const SectionLabel = ({ label }) => (
  <p className="px-6 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-5 mb-1">
    {label}
  </p>
);

export default function Sidebar({ activeView, setActiveView, mobileOpen, onClose }) {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const confirmLogout = () => {
    localStorage.removeItem('zamdey_user');
    localStorage.removeItem('zamdey_last_view');
    localStorage.removeItem('token');
    window.location.reload();
  };

  const handleNavClick = (view) => {
    setActiveView(view);
    if (onClose) onClose();
  };

  return (
    <>
      {/* MOBILE BACKDROP OVERLAY */}
      {mobileOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      {/* SIDEBAR ASIDE */}
      <aside 
        className={`w-64 bg-white border-r border-slate-300 flex flex-col fixed inset-y-0 left-0 z-50 overflow-hidden font-sans transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-6 pb-4 flex items-center justify-between">
          <h1 className="text-2xl font-extrabold tracking-tighter text-slate-900 uppercase">
            zamdey
          </h1>
          {/* Mobile Close Button */}
          <button 
            onClick={onClose}
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto pb-4 custom-scrollbar">
          <SectionLabel label="Global Overview" />
          <NavItem label="Analytics" icon="📈" active={activeView === 'Dashboard'} onClick={() => handleNavClick('Dashboard')} />
          <NavItem label="Approvals" icon="🛡️" active={activeView === 'Approvals'} onClick={() => handleNavClick('Approvals')} />
          
          <SectionLabel label="Operations" />
          <NavItem label="Rider Broadcast" icon="🛰️" active={activeView === 'Operations'} onClick={() => handleNavClick('Operations')} />
          <NavItem label="Re-Assignment" icon="🔄" active={activeView === 'Reassignment'} onClick={() => handleNavClick('Reassignment')} />
          <NavItem label="Expansion Zones" icon="🌍" active={activeView === 'Zones'} onClick={() => handleNavClick('Zones')} />
          
          <SectionLabel label="Financial Engine" />
          <NavItem label="Pay Vendors" icon="💰" active={activeView === 'Finances'} onClick={() => handleNavClick('Finances')} />
          <NavItem label="Pay Riders" icon="💸" active={activeView === 'Payroll'} onClick={() => handleNavClick('Payroll')} />
          
          <SectionLabel label="Marketplace" />
          <NavItem label="Restaurants" icon="🏪" active={activeView === 'Restaurants'} onClick={() => handleNavClick('Restaurants')} />
          <NavItem label="Riders" icon="🏍️" active={activeView === 'Riders'} onClick={() => handleNavClick('Riders')} />
          <NavItem label="Customers" icon="👥" active={activeView === 'Customers'} onClick={() => handleNavClick('Customers')} />

          <SectionLabel label="Marketing & App" />
          <NavItem label="Promotions & CMS" icon="🖼️" active={activeView === 'Content'} onClick={() => handleNavClick('Content')} />

          <SectionLabel label="Intel & Support" />
          <NavItem label="Complaints" icon="⚖️" active={activeView === 'Complaints'} onClick={() => handleNavClick('Complaints')} />
          
          <SectionLabel label="System Configuration" />
          <NavItem label="Platform Settings" icon="⚙️" active={activeView === 'Settings'} onClick={() => handleNavClick('Settings')} />
        </nav>

        <div className="p-4 border-t border-slate-200 bg-slate-50">
            <button
              onClick={() => setIsLogoutModalOpen(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-500 hover:bg-rose-100 transition-all duration-300 group min-h-[44px]"
            >
              <LogOut size={18} className="group-hover:scale-110 transition-transform"/>
              <span className="text-xs font-black uppercase tracking-widest">Sign Out</span>
            </button>
        </div>
      </aside>

      {/* LOGOUT MODAL */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsLogoutModalOpen(false)} />
          <div className="bg-white rounded-[32px] p-6 sm:p-8 w-full max-w-sm relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 border-2 border-slate-100">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-2">
                <AlertCircle className="text-rose-500" size={32} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase italic">Signing Out?</h3>
                <p className="text-xs font-bold text-slate-400 mt-2 px-2 sm:px-4">
                  You are about to end your session. Any unsaved changes might be lost.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full pt-4">
                <button onClick={() => setIsLogoutModalOpen(false)} className="w-full py-3.5 sm:py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-slate-50 text-slate-400 hover:bg-slate-100 transition-colors min-h-[44px]">Cancel</button>
                <button onClick={confirmLogout} className="w-full py-3.5 sm:py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-rose-500 text-white shadow-lg shadow-rose-200 hover:bg-rose-600 transition-all hover:scale-[1.02] min-h-[44px]">Confirm</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
