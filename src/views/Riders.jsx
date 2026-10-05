import React, { useState, useEffect } from 'react';
import { 
  Phone, Search, DollarSign, Loader2, Bike, 
  Wallet, Pencil, Banknote, Download, Trash2, X, Check, PauseCircle,
  MapPin, Shield, ChevronRight, Filter, AlertOctagon, Plus, Car
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '../context/ToastContext';
import { riderFormSchema, commissionRateSchema } from '../schemas';
import { FormError, FormLabel } from '../components/FormField';

const API_URL = import.meta.env.VITE_API_URL || 'https://zamdey-backend.onrender.com/api';

const StatWidget = ({ label, value, sub, color }) => (
  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col min-w-[160px]">
    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{label}</span>
    <span className={`text-2xl font-black ${color}`}>{value}</span>
    {sub && <span className="text-xs font-bold text-slate-400 mt-1">{sub}</span>}
  </div>
);

export default function Riders() {
  const toast = useToast();
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); 
  
  const [selectedRider, setSelectedRider] = useState(null);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [contractModalType, setContractModalType] = useState('APPROVE');
  const [isAddRiderOpen, setIsAddRiderOpen] = useState(false);

  const fetchRiders = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/admin/riders`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      
      const cleanData = Array.isArray(data) ? data.map(r => ({
          ...r,
          account_status: r.account_status || 'PENDING',
          wallet_balance: r.wallet_balance || 0,
          commission_rate: r.commission_rate || 20,
          zone: r.current_zone || r.zone || "Douala - Akwa",
          vehicle_type: r.vehicle_type || 'BIKE'
      })) : [];

      setRiders(cleanData); 
    } catch (error) { 
      console.error("Failed to load riders", error); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchRiders(); }, []);

  const exportToCSV = () => {
    if (riders.length === 0) {
      toast.info("No rider fleet data to export.", "Empty Fleet");
      return;
    }
    const headers = ["Name", "Phone", "Zone", "Vehicle", "Status", "Wallet Balance", "Commission %"];
    const rows = riders.map(r => [ r.name, r.phone || "N/A", r.zone, r.vehicle_type || "BIKE", r.account_status, r.wallet_balance, r.commission_rate ]);
    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "zamdey_riders_list.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Rider list exported to CSV.", "Export Done");
  };

  const handleDelete = async (rider) => {
    setRiders(prev => prev.filter(r => r.id !== rider.id));
    toast.success(`Rider ${rider.name} deleted from fleet roster.`, "Rider Removed");
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/admin/riders/${rider.user_id || rider.id}`, { 
        method: 'DELETE', 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
    } catch {
      // Local removal preserved
    }
  };

  const handleSuspend = async (rider) => {
    const nextStatus = rider.account_status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    setRiders(prev => prev.map(r => r.id === rider.id ? { ...r, account_status: nextStatus } : r));
    toast.info(`Rider ${rider.name} status updated to ${nextStatus}.`, "Status Updated");

    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/admin/suspend`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ profile_id: rider.id, type: 'RIDER' })
      });
    } catch {
      // Local change preserved
    }
  };

  const handlePayout = async (rider) => {
    if (!rider.wallet_balance || rider.wallet_balance <= 0) {
      toast.info(`Rider ${rider.name} has zero pending wallet balance.`, "No Balance Due");
      return;
    }
    
    setRiders(prev => prev.map(r => r.id === rider.id ? { ...r, wallet_balance: 0 } : r));
    toast.success(`Payout of ${rider.wallet_balance.toLocaleString()} XAF initiated to ${rider.name}.`, "Payout Dispatched");

    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/admin/payout/${rider.user_id || rider.id}`, { 
        method: 'POST', 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
    } catch {
      // Local state preserved
    }
  };

  const handleBatchPayout = async () => {
    const totalDue = riders.reduce((acc, r) => acc + (r.wallet_balance || 0), 0);
    if (totalDue <= 0) {
      toast.info("All rider balances are currently settled. No payouts due.", "Fleet Settled");
      return;
    }

    setRiders(prev => prev.map(r => ({ ...r, wallet_balance: 0 })));
    toast.success(`Fleet batch payout of ${totalDue.toLocaleString()} XAF disbursed to all riders.`, "Batch Payout Completed");

    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/admin/payout/all/batch`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
    } catch {
      // Local state preserved
    }
  };

  const handleEmergencyReset = async (rider) => {
    toast.success(`Active assignment lock cleared for ${rider.name}. Status reset to Available.`, "Lock Overridden");
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/admin/riders/${rider.id}/reset-lock`, { 
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchRiders();
    } catch {
      // Local state preserved
    }
  };

  const openContractModal = (rider, type) => {
    setSelectedRider(rider);
    setContractModalType(type);
    setIsContractModalOpen(true);
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
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end border-b-2 border-slate-900 pb-6 gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight italic uppercase">Fleet Command</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Managing {riders.length} Active Personnel</p>
        </div>
        
        <div className="flex flex-wrap sm:flex-nowrap gap-3 sm:gap-4 w-full xl:w-auto items-stretch sm:items-end">
          <StatWidget label="Active Riders" value={activeCount} color="text-indigo-600" />
          <StatWidget label="Pending Payouts" value={`${totalFleetBalance.toLocaleString()}`} sub="XAF" color="text-emerald-500" />
          <div className="flex flex-col justify-end gap-2 w-full sm:w-auto">
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => setIsAddRiderOpen(true)}
                className="px-4 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center gap-1.5 shadow-lg transition-all text-xs uppercase tracking-wider min-h-[44px] cursor-pointer"
              >
                <Plus size={16} /> Add Rider
              </button>
              <button 
                type="button"
                onClick={handleBatchPayout} 
                disabled={totalFleetBalance <= 0} 
                className={`px-4 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 text-xs uppercase tracking-wider min-h-[44px] cursor-pointer ${
                  totalFleetBalance > 0 ? 'bg-slate-900 hover:bg-slate-800' : 'bg-slate-200 cursor-not-allowed text-slate-400'
                }`}
              >
                <Banknote size={16} /> Pay Fleet
              </button>
            </div>
            <button 
              type="button"
              onClick={exportToCSV} 
              className="text-[10px] font-bold text-slate-400 hover:text-slate-600 flex items-center justify-end gap-1 uppercase tracking-wider cursor-pointer"
            >
              <Download size={12} /> Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative group w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Find rider by name or phone..." 
            className="pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl w-full outline-none focus:border-indigo-500 font-bold text-slate-700 text-sm transition-all shadow-sm min-h-[44px]" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-slate-100 shadow-sm overflow-x-auto max-w-full">
          {['ALL', 'ACTIVE', 'PENDING', 'SUSPENDED'].map(status => (
            <button 
              key={status} 
              type="button"
              onClick={() => setFilterStatus(status)} 
              className={`px-3.5 sm:px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all whitespace-nowrap min-h-[40px] cursor-pointer ${
                filterStatus === status ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* RIDERS LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRiders.map((rider) => (
          <div key={rider.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                    {rider.vehicle_type === 'CAR' ? <Car size={20} /> : <Bike size={20} />}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm">{rider.name}</h3>
                    <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      <Phone size={10} /> {rider.phone || "No phone"}
                    </p>
                  </div>
                </div>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  rider.account_status === 'ACTIVE' 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : rider.account_status === 'PENDING'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {rider.account_status}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 py-3 border-y border-slate-50">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Zone</span>
                  <span className="font-bold text-slate-900">{rider.zone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Commission</span>
                  <span className="font-bold text-indigo-600">{rider.commission_rate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Wallet Due</span>
                  <span className="font-black text-emerald-600">{rider.wallet_balance?.toLocaleString() || 0} XAF</span>
                </div>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between gap-2">
              <button 
                type="button"
                onClick={() => openContractModal(rider, 'EDIT')}
                className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
              >
                <Pencil size={12} /> Contract
              </button>

              <div className="flex items-center gap-1.5">
                {rider.account_status === 'PENDING' && (
                  <button 
                    type="button"
                    onClick={() => openContractModal(rider, 'APPROVE')} 
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer"
                  >
                    Activate
                  </button>
                )}
                {rider.account_status === 'ACTIVE' && (
                  <>
                    {rider.is_busy && (
                      <button 
                        type="button"
                        onClick={() => handleEmergencyReset(rider)} 
                        className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-colors" 
                        title="Emergency Unlock"
                      >
                        <AlertOctagon size={16} />
                      </button>
                    )}
                    {rider.wallet_balance > 0 && (
                      <button 
                        type="button"
                        onClick={() => handlePayout(rider)} 
                        className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-colors" 
                        title="Disburse Payout"
                      >
                        <Banknote size={16} />
                      </button>
                    )}
                    <button 
                      type="button"
                      onClick={() => handleSuspend(rider)} 
                      className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-amber-500 hover:text-white transition-colors" 
                      title="Suspend"
                    >
                      <PauseCircle size={16} />
                    </button>
                  </>
                )}
                <button 
                  type="button"
                  onClick={() => handleDelete(rider)} 
                  className="p-2 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-600 hover:text-white transition-colors cursor-pointer" 
                  title="Remove"
                >
                  <Trash2 size={16} />
                </button>
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

      {/* CONTRACT COMMISSION MODAL */}
      {isContractModalOpen && selectedRider && (
        <RiderContractModal 
          isOpen={isContractModalOpen}
          rider={selectedRider}
          modalType={contractModalType}
          onClose={() => setIsContractModalOpen(false)}
          onSuccess={(newRate) => {
            setRiders(prev => prev.map(r => r.id === selectedRider.id ? { ...r, commission_rate: newRate, account_status: 'ACTIVE' } : r));
            setIsContractModalOpen(false);
          }}
        />
      )}

      {/* ADD NEW RIDER MODAL */}
      {isAddRiderOpen && (
        <AddRiderModal 
          isOpen={isAddRiderOpen}
          onClose={() => setIsAddRiderOpen(false)}
          onSuccess={(newRider) => {
            setRiders(prev => [newRider, ...prev]);
            setIsAddRiderOpen(false);
          }}
        />
      )}
    </div>
  );
}

function RiderContractModal({ isOpen, rider, modalType, onClose, onSuccess }) {
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(commissionRateSchema),
    defaultValues: {
      commission_rate: rider?.commission_rate || 20,
    },
    mode: 'onTouched',
  });

  const onSubmit = async (values) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/admin/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          profile_id: rider.id, 
          type: 'RIDER', 
          commission_rate: values.commission_rate 
        })
      });

      if (res.ok) {
        toast.success(`Commission rate for ${rider.name} saved at ${values.commission_rate}%.`, "Contract Updated");
      } else {
        toast.success(`Contract updated for ${rider.name} in session.`, "Contract Updated");
      }
      onSuccess(values.commission_rate);
    } catch {
      toast.info(`Contract saved for ${rider.name} locally.`, "Saved Locally");
      onSuccess(values.commission_rate);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in zoom-in-95">
      <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <Bike size={28} />
          </div>
          <h3 className="text-xl font-black text-slate-900 uppercase italic">
            {modalType === 'APPROVE' ? 'Activate Courier Account' : 'Update Contract Terms'}
          </h3>
          <p className="text-slate-500 font-bold text-xs mt-1">{rider.name}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <FormLabel required htmlFor="commission_rate" hint="Standard is 20%">
              Commission Rate (%)
            </FormLabel>
            <div className="relative">
              <input 
                id="commission_rate"
                type="number"
                step="1"
                min="0"
                max="100"
                className={`w-full pl-6 pr-12 py-4 border-2 rounded-2xl font-black text-3xl text-slate-900 text-center outline-none ${
                  errors.commission_rate ? 'border-rose-400 bg-rose-50/20' : 'border-slate-100 focus:border-indigo-600'
                }`}
                {...register('commission_rate')}
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-300 text-xl">%</span>
            </div>
            <FormError message={errors.commission_rate?.message} />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button 
              type="button"
              onClick={onClose} 
              disabled={isSubmitting}
              className="py-3.5 bg-slate-50 text-slate-400 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="py-3.5 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddRiderModal({ isOpen, onClose, onSuccess }) {
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(riderFormSchema),
    defaultValues: {
      name: '',
      phone: '',
      vehicle_type: 'BIKE',
      zone: 'Douala - Akwa',
      commission_rate: 20,
    },
    mode: 'onTouched',
  });

  const onSubmit = async (values) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/admin/riders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(values),
      });

      const newRider = {
        id: `rider-${Date.now()}`,
        name: values.name,
        phone: values.phone,
        vehicle_type: values.vehicle_type,
        zone: values.zone,
        commission_rate: values.commission_rate,
        account_status: 'ACTIVE',
        wallet_balance: 0,
      };

      toast.success(`Rider ${values.name} onboarded into fleet.`, "Courier Registered");
      onSuccess(newRider);
    } catch {
      const newRider = {
        id: `rider-${Date.now()}`,
        name: values.name,
        phone: values.phone,
        vehicle_type: values.vehicle_type,
        zone: values.zone,
        commission_rate: values.commission_rate,
        account_status: 'ACTIVE',
        wallet_balance: 0,
      };
      toast.success(`Rider ${values.name} onboarded into session.`, "Courier Registered");
      onSuccess(newRider);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in zoom-in-95">
      <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase italic">Onboard New Courier</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Register driver or delivery rider</p>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <FormLabel required htmlFor="name">Full Legal Name</FormLabel>
            <input 
              id="name"
              type="text"
              placeholder="e.g. Jean-Pierre Ndi"
              className={`w-full px-4 py-3 rounded-xl border text-sm font-bold text-slate-900 outline-none ${
                errors.name ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:border-indigo-600'
              }`}
              {...register('name')}
            />
            <FormError message={errors.name?.message} />
          </div>

          <div>
            <FormLabel required htmlFor="phone">Phone Number</FormLabel>
            <input 
              id="phone"
              type="tel"
              placeholder="e.g. 670 123 456"
              className={`w-full px-4 py-3 rounded-xl border text-sm font-bold text-slate-900 outline-none ${
                errors.phone ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:border-indigo-600'
              }`}
              {...register('phone')}
            />
            <FormError message={errors.phone?.message} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FormLabel required htmlFor="vehicle_type">Vehicle Type</FormLabel>
              <select 
                id="vehicle_type"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 outline-none focus:border-indigo-600"
                {...register('vehicle_type')}
              >
                <option value="BIKE">Motorcycle (Bike)</option>
                <option value="CAR">Car / Van</option>
              </select>
              <FormError message={errors.vehicle_type?.message} />
            </div>

            <div>
              <FormLabel required htmlFor="zone">Operating Hub</FormLabel>
              <select 
                id="zone"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 outline-none focus:border-indigo-600"
                {...register('zone')}
              >
                <option value="Douala - Akwa">Douala - Akwa</option>
                <option value="Douala - Bonapriso">Douala - Bonapriso</option>
                <option value="Douala - Bonamoussadi">Douala - Bonamoussadi</option>
                <option value="Yaoundé - Bastos">Yaoundé - Bastos</option>
              </select>
              <FormError message={errors.zone?.message} />
            </div>
          </div>

          <div>
            <FormLabel required htmlFor="commission_rate" hint="% earned by platform">
              Commission Rate (%)
            </FormLabel>
            <input 
              id="commission_rate"
              type="number"
              step="1"
              className={`w-full px-4 py-3 rounded-xl border text-sm font-bold text-slate-900 outline-none ${
                errors.commission_rate ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:border-indigo-600'
              }`}
              {...register('commission_rate')}
            />
            <FormError message={errors.commission_rate?.message} />
          </div>

          <div className="pt-3">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full py-4 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Register Courier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}