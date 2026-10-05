import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, MessageSquare, AlertCircle, CheckCircle2, 
  MoreHorizontal, Loader2, X, Send, DollarSign, ShieldCheck 
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '../context/ToastContext';
import { supportTicketReplySchema } from '../schemas';
import { FormError, FormLabel } from '../components/FormField';

const API_URL = import.meta.env.VITE_API_URL || 'https://zamdey-backend.onrender.com/api';

const SAMPLE_TICKETS = [
  {
    id: 'TICK-802',
    user_name: 'Clarisse Tchounkeu (Customer)',
    subject: 'Delayed Delivery & Cold Food',
    message: 'My lunch delivery from Poulet DG was over 45 minutes late and arrived lukewarm. Rider stated heavy traffic at Akwa roundabout.',
    status: 'Pending',
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'TICK-803',
    user_name: 'Mama Put Kitchen (Merchant)',
    subject: 'Rider No-Show on Order #4412',
    message: 'We prepared the grilled fish 25 minutes ago. Order was assigned to rider Boris but GPS shows him inactive in Bonapriso.',
    status: 'Pending',
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'TICK-801',
    user_name: 'Fabrice Mbida (Rider)',
    subject: 'Customer Wrong Phone Number',
    message: 'Delivering to Denver area but client phone number has missing digit. Customer could not be reached for 15 minutes.',
    status: 'Resolved',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  }
];

export default function Complaints() {
  const toast = useToast();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/support`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setComplaints(data);
        } else {
          setComplaints(SAMPLE_TICKETS);
        }
      } else {
        setComplaints(SAMPLE_TICKETS);
      }
    } catch {
      setComplaints(SAMPLE_TICKETS);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveDirect = async (id) => {
    setComplaints(prev => prev.map(c => 
      c.id === id ? { ...c, status: "Resolved" } : c
    ));
    toast.success(`Support ticket ${id} marked as resolved.`, "Ticket Resolved");

    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/support/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: 'Resolved' })
      });
    } catch {
      // Local state preserved
    }
  };

  const filteredList = complaints.filter(c => filter === 'All' ? true : c.status === filter);

  if (loading) {
    return (
      <div className="p-20 text-center">
        <Loader2 className="animate-spin mx-auto text-slate-400" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans pb-24 max-w-7xl mx-auto">
      
      {/* 🔝 HEADER */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end border-b-2 border-slate-900 pb-6 gap-4">
        <div>
          <h2 className="text-slate-900 font-black text-xl sm:text-2xl uppercase tracking-tighter">Support Desk</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            Dispute resolution, customer escalations & inquiry handling
          </p>
        </div>
        
        <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-100 p-1 sm:p-1.5 rounded-xl overflow-x-auto w-full sm:w-auto">
          {['All', 'Pending', 'Resolved'].map(status => (
            <button 
              key={status}
              type="button"
              onClick={() => setFilter(status)}
              className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 sm:py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all min-h-[40px] whitespace-nowrap flex items-center justify-center cursor-pointer ${
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
            <div key={ticket.id} className="bg-white border border-slate-200 p-4 sm:p-6 rounded-2xl shadow-sm hover:border-slate-300 transition-all group">
              <div className="flex justify-between items-start mb-4 gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${ticket.status === 'Pending' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                    <AlertCircle size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-slate-900 text-sm uppercase truncate">{ticket.subject || "Issue Report"}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                       {ticket.user_name || "User"} • {ticket.id}
                    </p>
                  </div>
                </div>
                <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border shrink-0 ${
                   ticket.status === 'Pending' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                }`}>
                  {ticket.status}
                </span>
              </div>
              
              <p className="text-slate-700 text-xs font-medium leading-relaxed mb-4 sm:mb-6 bg-slate-50 p-4 rounded-xl break-words">
                {ticket.message || "No description provided."}
              </p>

              <div className="flex flex-wrap justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setSelectedTicket(ticket)}
                  className="px-4 py-2.5 text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl flex items-center gap-2 min-h-[40px] cursor-pointer"
                >
                  <MessageSquare size={14} /> Reply & Settle
                </button>
                {ticket.status === 'Pending' && (
                  <button 
                    type="button"
                    onClick={() => handleResolveDirect(ticket.id)}
                    className="px-4 sm:px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors flex items-center gap-2 min-h-[40px] cursor-pointer"
                  >
                    <CheckCircle2 size={14} /> Quick Resolve
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-24 bg-white border border-dashed border-slate-200 rounded-2xl">
             <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-500">
                <CheckCircle2 size={32} />
             </div>
             <h3 className="text-lg font-black text-slate-900 uppercase italic">Inbox Clear</h3>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">No pending disputes found in system</p>
          </div>
        )}
      </div>

      {/* TICKET REPLY & RESOLUTION MODAL */}
      {selectedTicket && (
        <ReplyTicketModal 
          isOpen={Boolean(selectedTicket)}
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onSuccess={(updatedTicket) => {
            setComplaints(prev => prev.map(c => c.id === updatedTicket.id ? { ...c, ...updatedTicket } : c));
            setSelectedTicket(null);
          }}
        />
      )}
    </div>
  );
}

function ReplyTicketModal({ isOpen, ticket, onClose, onSuccess }) {
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(supportTicketReplySchema),
    defaultValues: {
      replyMessage: '',
      status: 'Resolved',
      actionTaken: 'Contacted user via phone and resolved dispute.',
      refundAmount: '',
    },
    mode: 'onTouched',
  });

  const onSubmit = async (values) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/support/${ticket.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(values),
      });

      const refundNote = values.refundAmount ? ` (Compensation: ${Number(values.refundAmount).toLocaleString()} XAF credited)` : '';
      toast.success(`Support reply dispatched to ${ticket.user_name}${refundNote}.`, "Response Sent");
      onSuccess({ id: ticket.id, status: values.status });
    } catch {
      const refundNote = values.refundAmount ? ` (Compensation: ${Number(values.refundAmount).toLocaleString()} XAF credited)` : '';
      toast.success(`Support reply saved in preview session for ${ticket.user_name}${refundNote}.`, "Response Sent");
      onSuccess({ id: ticket.id, status: values.status });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 max-h-[90vh] flex flex-col">
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-xl font-black uppercase italic text-slate-900">Resolve Dispute Ticket</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              Ticket #{ticket.id} • {ticket.user_name}
            </p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center bg-slate-200 text-slate-500 hover:bg-rose-100 hover:text-rose-500 rounded-full transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600">
            <span className="font-bold text-slate-900 block mb-1 uppercase text-[10px] text-slate-400 tracking-wider">Original Complaint:</span>
            {ticket.message}
          </div>

          <div>
            <FormLabel required htmlFor="replyMessage" hint="5 to 500 characters">
              Official Resolution Message
            </FormLabel>
            <textarea 
              id="replyMessage"
              rows="4"
              placeholder="e.g. Hello, we apologize for the delivery delay. Our operations team contacted the kitchen and we have expedited priority delivery..."
              className={`w-full px-4 py-3 rounded-xl border text-sm font-medium text-slate-900 outline-none resize-none ${
                errors.replyMessage ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:border-indigo-600'
              }`}
              {...register('replyMessage')}
            />
            <FormError message={errors.replyMessage?.message} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FormLabel required htmlFor="status">New Status</FormLabel>
              <select 
                id="status"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 outline-none focus:border-indigo-600"
                {...register('status')}
              >
                <option value="Resolved">Resolved</option>
                <option value="In Progress">In Progress</option>
                <option value="Pending">Pending Customer Followup</option>
              </select>
              <FormError message={errors.status?.message} />
            </div>

            <div>
              <FormLabel htmlFor="refundAmount" hint="Optional Compensation">Refund (XAF)</FormLabel>
              <input 
                id="refundAmount"
                type="number"
                placeholder="e.g. 2000"
                className={`w-full px-4 py-3 rounded-xl border text-sm font-bold text-slate-900 outline-none ${
                  errors.refundAmount ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:border-indigo-600'
                }`}
                {...register('refundAmount')}
              />
              <FormError message={errors.refundAmount?.message} />
            </div>
          </div>

          <div>
            <FormLabel htmlFor="actionTaken">Internal Operational Notes</FormLabel>
            <input 
              id="actionTaken"
              type="text"
              placeholder="e.g. Dispatched replacement rider, issued MoMo wallet credit"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 outline-none focus:border-indigo-600"
              {...register('actionTaken')}
            />
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Send Official Response & Settle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}