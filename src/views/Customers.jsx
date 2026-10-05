import React, { useState, useEffect } from 'react';
import { Search, History, ShieldCheck, X, ShoppingBag, User, Loader2, Phone } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://zamdey-backend.onrender.com/api';

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔄 FETCH: Pull true Customer data from the new endpoint
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/admin/customers`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (Array.isArray(data)) setCustomers(data);
      } catch (error) {
        console.warn("Customer fetch warning:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  // 🔍 FILTERING
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-slate-400" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans pb-24">
      
      {/* 🔝 HEADER & SEARCH */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end border-b-2 border-slate-900 pb-6 gap-4">
        <div>
          <h2 className="text-slate-900 font-black text-xl sm:text-2xl uppercase tracking-tighter">Customer Intelligence</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Managing {customers.length} Registered Users</p>
        </div>
        
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input 
            type="text" 
            placeholder="Search by name or phone..."
            className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-[11px] font-bold outline-none focus:border-slate-900 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* 📋 CUSTOMER LEDGER */}
      <div className="bg-white border border-slate-200 shadow-sm overflow-x-auto rounded-xl w-full">
        <table className="w-full text-left min-w-[600px]">
          <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
            <tr>
              <th className="px-4 sm:px-6 py-4 whitespace-nowrap">Customer Profile</th>
              <th className="px-4 sm:px-6 py-4 whitespace-nowrap">LTV (Total Spent)</th>
              <th className="px-4 sm:px-6 py-4 whitespace-nowrap">Account Status</th>
              <th className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">Verification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredCustomers.map(customer => (
              <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 sm:px-6 py-4 sm:py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-slate-100 rounded flex items-center justify-center text-slate-500 shrink-0">
                      <User size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-slate-900 uppercase text-sm truncate">{customer.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 font-mono tracking-tighter flex items-center gap-1 mt-0.5 truncate">
                        <Phone size={10} className="shrink-0"/> {customer.phone}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-4 sm:py-5 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900">{customer.ltv.toLocaleString()} XAF</span>
                    <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-1.5 rounded uppercase">
                       {customer.orders} Orders
                    </span>
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-4 sm:py-5 whitespace-nowrap">
                  <span className={`px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest border ${
                    customer.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                  }`}>
                    {customer.status}
                  </span>
                </td>
                <td className="px-4 sm:px-6 py-4 sm:py-5 text-right space-x-1 whitespace-nowrap">
                  <button 
                    onClick={() => setSelectedCustomer(customer)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-md transition-all border border-transparent hover:border-slate-200"
                    title="View Order History"
                  >
                    <History size={16} />
                  </button>
                  <button 
                    className={`p-2 rounded-md transition-all border border-transparent ${
                      customer.status === 'Active' ? 'text-slate-400 hover:text-rose-600 hover:border-rose-100' : 'text-emerald-600 border-emerald-100'
                    }`}
                    title="Suspend/Verify Account"
                  >
                    <ShieldCheck size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredCustomers.length === 0 && (
           <div className="p-10 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
              No customer data found
           </div>
        )}
      </div>

      {/* 📜 ORDER HISTORY MODAL */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4">
          <div className="bg-white w-full max-w-md border border-slate-200 shadow-2xl p-8 animate-in zoom-in-95 relative rounded-2xl">
            <button onClick={() => setSelectedCustomer(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 transition-colors">
              <X size={20} />
            </button>
            
            <div className="mb-8">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{selectedCustomer.name}</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Transaction Audit</p>
            </div>
            
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {selectedCustomer.history.length === 0 ? (
                <p className="text-xs font-bold text-slate-400 text-center py-4 uppercase">No previous orders</p>
              ) : (
                selectedCustomer.history.map((order, idx) => (
                  <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 border border-slate-100 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white text-indigo-600 rounded shadow-sm">
                        <ShoppingBag size={16} />
                      </div>
                      <div>
                        <p className="font-black text-slate-900 text-xs">#{order.id.slice(-6)}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">{order.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-slate-900 text-xs">{order.total}</p>
                      <p className={`text-[8px] font-black uppercase ${order.status === 'DELIVERED' || order.status === 'PAID' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {order.status}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}