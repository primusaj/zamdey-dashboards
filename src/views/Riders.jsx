import React, { useState, useEffect } from 'react';
import { 
  Phone, Search, DollarSign, Loader2, Bike, 
  Wallet, Pencil, Banknote, Download, Trash2, X, Check, PauseCircle,
  MapPin, Shield, ChevronRight, Filter, AlertOctagon
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const StatWidget = ({ label, value, sub, color }) => (
  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col min-w-[160px]">
    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{label}</span>
    <span className={`text-2xl font-black ${color}`}>{value}</span>
    {sub && <span className="text-xs font-bold text-slate-400 mt-1">{sub}</span>}
  </div>
);

export default function Riders() {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); 
  
  const [selectedRider, setSelectedRider] = useState(null);
  const [commissionRate, setCommissionRate] = useState(20); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('APPROVE'); 

  const fetchRiders = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/admin/riders`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      
      const cleanData = Array.isArray(data) ? data.map(r => ({
          ...r,
          account_status: r.account_status || 'PENDING',
          wallet_balance: r.wallet_balance || 0,
          commission_rate: r.commission_rate || 0,
          zone: r.current_zone || r.zone || "Unassigned"
      })) : [];

      setRiders(cleanData); 
    } catch (error) { console.error("Failed to load riders", error); } finally { setLoading(false); }
  };

  useEffect(() => { fetchRiders(); }, []);

  const exportToCSV = () => {
    if (riders.length === 0) return alert("No data to export");
    const headers = ["Name", "Phone", "Zone", "Status", "Wallet Balance", "Commission %"];
    const rows = riders.map(r => [ r.name, r.phone || "N/A", r.zone, r.account_status, r.wallet_balance, r.commission_rate ]);
    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "zamdey_riders_list.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveContract = async () => {
    if (!selectedRider) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/admin/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ profile_id: selectedRider.id, type: 'RIDER', commission_rate: commissionRate })
      });
      if (res.ok) { setIsModalOpen(false); fetchRiders(); } else { alert("Action failed"); }
    } catch (error) { alert("Error processing request"); }
  };

  const handleDelete = async (rider) => {
    if(!window.confirm(`⚠️ PERMANENTLY DELETE ${rider.name}?`)) return;
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/admin/riders/${rider.user_id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) { fetchRiders(); } 
    } catch (error) { alert("Network error"); }
  };

  const handleSuspend = async (rider) => {
    if(!window.confirm(`⚠️ Suspend ${rider.name}?`)) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/admin/suspend`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ profile_id: rider.id, type: 'RIDER' })
      });
      fetchRiders();
    } catch (error) { alert("Suspend failed"); }
  };

  const handlePayout = async (rider) => {
    if (rider.wallet_balance <= 0) return alert("Wallet is empty.");
    if(!window.confirm(`Confirm Payout: ${rider.wallet_balance.toLocaleString()} XAF?`)) return;
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/admin/payout/${rider.user_id}`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
        if(res.ok) { fetchRiders(); } 
    } catch (error) { alert("Network error"); }
  };

  const handleBatchPayout = async () => {
    const totalDue = riders.reduce((acc, r) => acc + (r.wallet_balance || 0), 0);
    if (totalDue <= 0) return alert("No earnings to pay out.");
    if(!window.confirm(`⚠️ PAY ALL RIDERS?\nTotal: ${totalDue.toLocaleString()} XAF`)) return;

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/admin/payout/all/batch`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
        if(res.ok) { fetchRiders(); }
    } catch (error) { alert("Batch payout failed"); }
  };

  // 🚨 8. THE EMERGENCY OVERRIDE
  const handleEmergencyReset = async (rider) => {
      if(!window.confirm(`⚠️ DANGER: Force clear ${rider.name}'s active deliveries and reset them to AVAILABLE? Only do this if they are stuck or abandoned their orders.`)) return;
      
      try {
          const token = localStorage.getItem('token');
          const res = await fetch(`${API_URL}/admin/riders/${rider.id}/reset-lock`, { 
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if(res.ok) { 
              alert(`${rider.name} has been reset.`);
              fetchRiders(); 
          } else {
              alert("Failed to reset rider.");
          }
      } catch (error) { alert("Network error during reset."); }
  };

  const openModal = (rider, type) => {
    setSelectedRider(rider); setModalType(type); setCommissionRate(rider.commission_rate || 20); setIsModalOpen(true);
  };

  const filteredRiders = riders.filter(r => {
    const matchesSearch = r.name?.toLowerCase().includes(searchTerm.toLowerCase()) || r.phone?.includes(searchTerm);
    const matchesStatus = filterStatus === 'ALL' ? true : r.account_status === filterStatus;
    return matchesSearch && matchesStatus;
  });
  
  const totalFleetBalance = riders.reduce((acc, r) => acc + (r.wallet_balance || 0), 0);
  const activeCount = riders.filter(r => r.account_status === 'ACTIVE').length;

  if (loading) return (
    <div className="h-96 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-slate-300" size={40} />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Locating Fleet...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto pb-20 font-sans space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col xl:flex-row justify-between items-end border-b-2 border-slate-900 pb-6 gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">Fleet Command</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Managing {riders.length} Personnel</p>
        </div>
        
        <div className="flex gap-4">
            <StatWidget label="Active Riders" value={activeCount} color="text-indigo-600" />
            <StatWidget label="Pending Payouts" value={`${totalFleetBalance.toLocaleString()}`} sub="XAF" color="text-emerald-500" />
            <div className="flex flex-col justify-end gap-2">
                <button onClick={handleBatchPayout} disabled={totalFleetBalance <= 0} className={`px-5 py-3 rounded-xl font-bold text-white flex items-center gap-2 shadow-lg transition-all active:scale-95 text-xs uppercase tracking-wider ${totalFleetBalance > 0 ? 'bg-slate-900 hover:bg-indigo-600' : 'bg-slate-200 cursor-not-allowed text-slate-400'}`}>
                   <Banknote size={16} /> Pay Fleet
                </button>
                <button onClick={exportToCSV} className="text-[10px] font-bold text-slate-400 hover:text-slate-600 flex items-center justify-end gap-1 uppercase tracking-wider">
                    <Download size={12} /> Export CSV
                </button>
            </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between">
         <div className="relative group w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={18} />
            <input type="text" placeholder="Find rider..." className="pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl w-full outline-none focus:border-indigo-500 font-bold text-slate-700 text-sm transition-all shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
         </div>
         <div className="flex bg-white p-1 rounded-xl border border-slate-100 shadow-sm">
            {['ALL', 'ACTIVE', 'PENDING', 'SUSPENDED'].map(status => (
                <button key={status} onClick={() => setFilterStatus(status)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${filterStatus === status ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>
                   {status}
                </button>
            ))}
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRiders.map((rider) => (
          <div key={rider.id} className="bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
             
             <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner ${rider.account_status === 'ACTIVE' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                      {rider.name.charAt(0)}
                   </div>
                   <div>
                      <h3 className="font-black text-lg text-slate-900 leading-tight flex items-center gap-2">
                          {rider.name} 
                          {rider.is_busy && <span className="flex h-3 w-3"><span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-rose-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span></span>}
                      </h3>
                      <p className="text-xs text-slate-400 font-bold flex items-center gap-1 mt-0.5"><MapPin size={10} /> {rider.zone}</p>
                   </div>
                </div>
                <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${rider.account_status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : rider.account_status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                    {rider.account_status}
                </div>
             </div>

             <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                   <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Wallet</p>
                   <p className={`text-lg font-black ${rider.wallet_balance > 0 ? 'text-emerald-500' : 'text-slate-400'}`}>{rider.wallet_balance?.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 relative group/edit">
                   <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Commission</p>
                   <p className="text-lg font-black text-slate-700">{rider.commission_rate}%</p>
                   <button onClick={() => openModal(rider, 'EDIT')} className="absolute top-2 right-2 p-1.5 bg-white rounded-lg text-slate-300 hover:text-indigo-600 hover:shadow-sm opacity-0 group-hover/edit:opacity-100 transition-all"><Pencil size={12} /></button>
                </div>
             </div>

             <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400"><Phone size={12} /> {rider.phone}</div>
                
                <div className="flex items-center gap-2">
                   {rider.account_status === 'PENDING' && (
                      <>
                        <button onClick={() => handleDelete(rider)} className="p-2 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-colors"><X size={16} /></button>
                        <button onClick={() => openModal(rider, 'APPROVE')} className="px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-emerald-600 transition-colors shadow-lg shadow-slate-200">Approve</button>
                      </>
                   )}

                   {rider.account_status === 'ACTIVE' && (
                      <>
                         {rider.is_busy && (
                             <button onClick={() => handleEmergencyReset(rider)} className="p-2 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-colors flex items-center justify-center animate-pulse" title="Emergency Reset (Stuck Rider)">
                                 <AlertOctagon size={16} />
                             </button>
                         )}
                         {rider.wallet_balance > 0 && (
                            <button onClick={() => handlePayout(rider)} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-500 hover:text-white transition-colors" title="Payout"><Banknote size={16} /></button>
                         )}
                         <button onClick={() => handleSuspend(rider)} className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-amber-500 hover:text-white transition-colors" title="Suspend"><PauseCircle size={16} /></button>
                      </>
                   )}

                   {(rider.account_status === 'SUSPENDED' || rider.account_status === 'REJECTED') && (
                      <button onClick={() => handleDelete(rider)} className="px-3 py-2 bg-rose-50 text-rose-500 text-[10px] font-black uppercase rounded-lg hover:bg-rose-600 hover:text-white transition-colors">Delete</button>
                   )}
                </div>
             </div>

          </div>
        ))}
      </div>

      {filteredRiders.length === 0 && (
         <div className="text-center py-20 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
            <Shield size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No active personnel found</p>
         </div>
      )}

      {isModalOpen && selectedRider && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in zoom-in-95 duration-200">
          <div className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl relative overflow-hidden">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4"><Bike size={32} /></div>
                <h3 className="text-2xl font-black text-slate-900 uppercase italic">{modalType === 'APPROVE' ? `Activate Rider` : `Update Contract`}</h3>
                <p className="text-slate-500 font-bold text-xs mt-1">{selectedRider.name}</p>
            </div>
            
            <div className="mb-8">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Commission Rate (%)</label>
              <div className="relative">
                  <input type="number" value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} className="w-full pl-6 pr-12 py-4 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none font-black text-3xl text-slate-900 text-center" />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-300 text-xl">%</span>
              </div>
              <p className="text-[10px] text-center text-slate-400 font-bold mt-3">Standard rate is 20%. This affects all future earnings.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setIsModalOpen(false)} className="py-4 bg-slate-50 text-slate-400 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-colors">Cancel</button>
              <button onClick={handleSaveContract} className="py-4 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02]">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}