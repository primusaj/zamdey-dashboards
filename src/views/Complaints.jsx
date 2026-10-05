import React, { useState, useEffect } from 'react';
import { Search, Filter, MessageSquare, AlertCircle, CheckCircle2, MoreHorizontal, Loader2 } from 'lucide-react';

// 🔗 CONFIG: Point this to your backend
const API_URL = import.meta.env.VITE_API_URL || 'https://zamdey-backend.onrender.com/api';

export default function Complaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  // 🔄 SYNC: Fetch Support Tickets
  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      // Assuming endpoint GET /support exists
      const res = await fetch(`${API_URL}/support`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setComplaints(data);
      } else {
        // Fallback for demo if endpoint not built yet
        console.warn("Support endpoint not ready, showing empty state");
      }
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch complaints");
      setLoading(false);
    }
  };

  const handleResolve = async (id) => {
    // Optimistic Update
    setComplaints(complaints.map(c => 
      c.id === id ? { ...c, status: "Resolved" } : c
    ));

    try {
      await fetch(`${API_URL}/support/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Resolved' })
      });
    } catch (error) { console.error("Update failed"); }
  };

  const filteredList = complaints.filter(c => filter === 'All' ? true : c.status === filter);

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-slate-400" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans pb-24">
      
      {/* 🔝 HEADER */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end border-b-2 border-slate-900 pb-6 gap-4">
        <div>
          <h2 className="text-slate-900 font-black text-xl sm:text-2xl uppercase tracking-tighter">Support Desk</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Dispute resolution & inquiry management</p>
        </div>
        
        <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-100 p-1 sm:p-1.5 rounded-xl overflow-x-auto w-full sm:w-auto">
          {['All', 'Pending', 'Resolved'].map(status => (
            <button 
              key={status}
              onClick={() => setFilter(status)}
              className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 sm:py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all min-h-[40px] whitespace-nowrap flex items-center justify-center ${
                filter === status ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* 📨 COMPLAINTS FEED */}
      <div className="space-y-4">
        {filteredList.length > 0 ? (
          filteredList.map(ticket => (
            <div key={ticket.id} className="bg-white border border-slate-200 p-4 sm:p-6 rounded-xl shadow-sm hover:border-slate-300 transition-all group">
              <div className="flex justify-between items-start mb-4 gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${ticket.status === 'Pending' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                    <AlertCircle size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-slate-900 text-sm uppercase truncate">{ticket.subject || "Issue Report"}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                       {ticket.user_name || "User"} • {ticket.id}
                    </p>
                  </div>
                </div>
                <span className={`text-[9px] font-black uppercase px-2 py-1 rounded border shrink-0 ${
                   ticket.status === 'Pending' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                }`}>
                  {ticket.status}
                </span>
              </div>
              
              <p className="text-slate-600 text-xs font-medium leading-relaxed mb-4 sm:mb-6 bg-slate-50 p-3 sm:p-4 rounded-lg break-words">
                {ticket.message || "No description provided."}
              </p>

              <div className="flex flex-wrap justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-slate-100">
                <button className="px-4 py-2.5 text-[10px] font-black uppercase text-slate-400 hover:text-indigo-600 flex items-center gap-2 min-h-[40px]">
                  <MessageSquare size={14} /> Reply
                </button>
                {ticket.status === 'Pending' && (
                  <button 
                    onClick={() => handleResolve(ticket.id)}
                    className="px-4 sm:px-5 py-2.5 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors flex items-center gap-2 min-h-[40px]"
                  >
                    <CheckCircle2 size={14} /> Mark Resolved
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-24 bg-white border border-dashed border-slate-200 rounded-xl">
             <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-500">
                <CheckCircle2 size={32} />
             </div>
             <h3 className="text-lg font-black text-slate-900 uppercase italic">Inbox Zero</h3>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">No pending issues found in the system</p>
          </div>
        )}
      </div>
    </div>
  );
}