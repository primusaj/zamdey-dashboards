import React, { useState, useEffect } from 'react';
import { 
  Shield, CheckCircle, FileText, User, 
  MapPin, Phone, Loader2, ChefHat, Bike, Wallet, Maximize2, X, FileCheck
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// 🔗 HELPER: Convert relative backend paths to full URLs for viewing
const getFileUrl = (path) => {
  if (!path) return null;
  // If it's already a full web link (Unsplash, AWS, etc)
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  
  // 🚨 THE FIX: Clean up backslashes (Windows) and ensure single leading slash
  const cleanPath = path.replace(/\\/g, '/').replace(/^\/+/, '');
  
  // Point to the base server URL (removing /api)
  return `${API_URL.replace('/api', '')}/${cleanPath}`;
};

// 🔍 FULL-SCREEN IMAGE LIGHTBOX
const ImageLightbox = ({ url, onClose }) => {
  if (!url) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
      <button onClick={onClose} className="absolute top-6 right-6 text-white hover:text-slate-300 transition-colors p-2 bg-slate-800 rounded-full">
        <X size={24} />
      </button>
      {url.toLowerCase().endsWith('.pdf') ? (
        <div className="bg-white p-8 rounded-2xl flex flex-col items-center max-w-sm text-center">
            <FileText size={64} className="text-rose-500 mb-4" />
            <h3 className="text-lg font-black text-slate-900">PDF Document</h3>
            <p className="text-sm text-slate-500 mb-6">This document is a PDF. Please download or open it in a new tab to view.</p>
            <a href={url} target="_blank" rel="noreferrer" className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl w-full">Open PDF</a>
        </div>
      ) : (
        <img src={url} alt="Document Verification" className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl border-4 border-white/10" onClick={e => e.stopPropagation()} />
      )}
    </div>
  );
};

// 🃏 THE INDIVIDUAL APPLICANT CARD (Handles its own local state for UX)
const ApplicantCard = ({ app, type, zones, onApprove, onReject, processingId, openLightbox }) => {
  // Local state for the inline controls
  const [rate, setRate] = useState(type === 'RIDER' ? 20 : 15);
  const [selectedZone, setSelectedZone] = useState("");
  const isProcessing = processingId === app.id;

  const isPdf = (url) => url && url.toLowerCase().endsWith('.pdf');

  // Helper to render thumbnails
  const DocumentThumbnail = ({ label, url }) => {
    if (!url) return (
      <div className="flex-1 bg-slate-50 border border-slate-100 rounded-xl flex flex-col items-center justify-center p-4 opacity-50">
        <X className="text-slate-300 mb-1" size={20} />
        <span className="text-[8px] font-black uppercase text-slate-400 text-center leading-tight">Missing<br/>{label}</span>
      </div>
    );

    return (
      <div 
        onClick={() => openLightbox(getFileUrl(url))}
        className="flex-1 h-24 bg-slate-100 rounded-xl relative overflow-hidden group cursor-pointer border-2 border-transparent hover:border-indigo-400 transition-all"
      >
        {isPdf(url) ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-rose-50 text-rose-500">
             <FileText size={24} className="mb-1" />
             <span className="text-[9px] font-black uppercase">PDF</span>
          </div>
        ) : (
          <img src={getFileUrl(url)} alt={label} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
           <Maximize2 className="text-white" size={20} />
        </div>
        <div className="absolute bottom-0 inset-x-0 bg-slate-900/80 backdrop-blur-sm p-1.5 text-center">
           <span className="text-[8px] font-black uppercase text-white">{label}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm hover:shadow-xl transition-shadow flex flex-col overflow-hidden">
      
      {/* 1. HEADER INFO */}
      <div className="p-6 border-b border-slate-100 flex gap-4 items-start bg-slate-50/50">
        <div className={`w-16 h-16 rounded-[20px] flex items-center justify-center text-2xl font-black shadow-sm ${
            type === 'RESTAURANT' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
        }`}>
            {app.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-lg text-slate-900 truncate">{app.name}</h3>
          <div className="flex flex-col mt-1 gap-1.5">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 truncate">
                <User size={12} className="shrink-0 text-slate-400" /> {app.owner || app.name}
              </span>
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                <Phone size={12} className="shrink-0 text-slate-400" /> {app.phone}
              </span>
              {type === 'RESTAURANT' && (
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 truncate">
                    <MapPin size={12} className="shrink-0 text-slate-400" /> {app.address || "No Address"}
                </span>
              )}
          </div>
        </div>
      </div>

      {/* 2. MOMO DETAILS (Highly Visible) */}
      <div className="px-6 py-4 bg-emerald-50/50 border-b border-emerald-100/50">
        <div className="flex items-center justify-between mb-2">
           <p className="text-[9px] font-black uppercase text-emerald-600 tracking-widest flex items-center gap-1.5">
              <Wallet size={12} /> Payout MoMo
           </p>
           <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase px-2 py-0.5 rounded-md">
             {app.momo_provider || "Unknown"}
           </span>
        </div>
        <p className="text-sm font-black text-slate-900 tracking-wider">
           {app.momo_number || "No Number Provided"}
        </p>
        <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5 truncate">
           Reg. Name: <span className="text-slate-800">{app.momo_account_name || "N/A"}</span>
        </p>
      </div>

      {/* 3. DOCUMENT GALLERY */}
      <div className="p-6 border-b border-slate-100">
        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-3 flex items-center gap-1.5">
          <FileCheck size={12} /> Verification Docs
        </p>
        <div className="flex gap-3">
          <DocumentThumbnail label="ID Front" url={app.id_card_front_url} />
          <DocumentThumbnail label="ID Back" url={app.id_card_back_url} />
          {type === 'RIDER' && <DocumentThumbnail label="License" url={app.license_url} />}
        </div>
      </div>

      {/* 4. INLINE APPROVAL CONTROLS */}
      <div className="p-6 bg-slate-50 mt-auto">
        <div className="flex gap-3 mb-4">
           {/* Commission Input */}
           <div className="w-1/3">
             <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1.5">Split (%)</label>
             <input 
               type="number" 
               value={rate} 
               onChange={(e) => setRate(e.target.value)} 
               className="w-full bg-white border-2 border-slate-200 rounded-xl py-2 px-3 font-black text-sm text-indigo-600 outline-none focus:border-indigo-500 text-center"
             />
           </div>
           
           {/* Zone Selection (Restaurants Only) */}
           {type === 'RESTAURANT' && (
             <div className="flex-1">
               <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1.5">Assign Zone</label>
               <select 
                 value={selectedZone} 
                 onChange={(e) => setSelectedZone(e.target.value)}
                 className="w-full bg-white border-2 border-slate-200 rounded-xl py-2 px-3 font-bold text-xs text-slate-700 outline-none focus:border-indigo-500"
               >
                 <option value="" disabled>Select Zone</option>
                 {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
               </select>
             </div>
           )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button 
            onClick={() => onReject(app.id, type)}
            disabled={isProcessing}
            className="w-1/3 py-3 rounded-xl bg-white border-2 border-rose-100 text-rose-500 hover:bg-rose-50 hover:border-rose-200 font-black text-[10px] uppercase tracking-widest transition-all"
          >
            Reject
          </button>
          <button 
            onClick={() => onApprove(app.id, type, rate, selectedZone)}
            disabled={isProcessing || (type === 'RESTAURANT' && !selectedZone)}
            className="flex-1 py-3 rounded-xl bg-slate-900 text-white hover:bg-indigo-600 font-black text-[10px] uppercase tracking-widest shadow-lg hover:shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
            Approve Partner
          </button>
        </div>
      </div>

    </div>
  );
};

// --- MAIN PAGE ---
export default function Approvals() {
  const [data, setData] = useState({ restaurants: [], riders: [] });
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('RESTAURANTS'); 
  const [processingId, setProcessingId] = useState(null);
  const [lightboxUrl, setLightboxUrl] = useState(null); // Lightbox State

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [resApps, resZones] = await Promise.all([
        fetch(`${API_URL}/admin/approvals/pending`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/zones`)
      ]);

      if (resApps.ok) setData(await resApps.json());
      if (resZones.ok) setZones(await resZones.json());
    } catch (error) {
      console.error("Sync Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleReject = async (id, type) => {
    if (!window.confirm("Reject this application permanently?")) return;
    performAction(id, type, 'REJECT');
  };

  const handleApprove = (id, type, rate, zoneId) => {
    performAction(id, type, 'APPROVE', rate, zoneId);
  };

  const performAction = async (id, type, decision, rate = 0, zoneId = null) => {
    setProcessingId(id);
    const endpoint = decision === 'APPROVE' ? '/admin/approvals/approve' : '/admin/approvals/suspend';
    const body = { profile_id: id, type, commission_rate: rate, zone_id: zoneId };

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        if (type === 'RESTAURANT') {
            setData(prev => ({ ...prev, restaurants: prev.restaurants.filter(r => r.id !== id) }));
        } else {
            setData(prev => ({ ...prev, riders: prev.riders.filter(r => r.id !== id) }));
        }
      } else {
        alert("Action failed. Check network.");
      }
    } catch (error) {
      console.error("Action Error:", error);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return (
    <div className="flex h-96 items-center justify-center flex-col">
       <Loader2 className="animate-spin text-slate-300 mb-4" size={40} />
       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Scanning Applications...</p>
    </div>
  );

  const activeList = activeTab === 'RESTAURANTS' ? data.restaurants : data.riders;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20 font-sans">
      
      {/* 🛡️ HEADER */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end border-b-2 border-slate-900 pb-6 gap-4">
        <div>
           <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">
              Gatekeeper
           </h1>
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">
              Review & Onboard New Partners
           </p>
        </div>
        <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl w-max">
           <button 
             onClick={() => setActiveTab('RESTAURANTS')}
             className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
               activeTab === 'RESTAURANTS' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'
             }`}
           >
             <ChefHat size={14} /> Vendors ({data.restaurants?.length || 0})
           </button>
           <button 
             onClick={() => setActiveTab('RIDERS')}
             className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
               activeTab === 'RIDERS' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'
             }`}
           >
             <Bike size={14} /> Riders ({data.riders?.length || 0})
           </button>
        </div>
      </div>

      {/* 🃏 CARD GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {activeList.map((app) => (
           <ApplicantCard 
             key={app.id}
             app={app}
             type={activeTab === 'RESTAURANTS' ? 'RESTAURANT' : 'RIDER'}
             zones={zones}
             processingId={processingId}
             onApprove={handleApprove}
             onReject={handleReject}
             openLightbox={setLightboxUrl}
           />
        ))}
      </div>

      {/* EMPTY STATE */}
      {activeList.length === 0 && (
        <div className="text-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
           <Shield size={64} className="mx-auto text-slate-300 mb-6" />
           <p className="text-slate-500 font-black uppercase tracking-widest text-sm">All Caught Up!</p>
           <p className="text-slate-400 text-xs font-bold mt-2">No pending applications at the moment.</p>
        </div>
      )}

      {/* 🔍 LIGHTBOX MODAL */}
      {lightboxUrl && (
        <ImageLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
      )}

    </div>
  );
}