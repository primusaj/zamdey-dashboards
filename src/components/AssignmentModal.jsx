import React from 'react';

export default function AssignmentModal({ isOpen, onClose, orderId, riders, onSelectRider }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm font-sans">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Assign Rider</h3>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Order: {orderId}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl font-bold">&times;</button>
        </div>

        <div className="p-4 max-h-[400px] overflow-y-auto">
          {riders.map((rider) => (
            <div key={rider.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 mb-2">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  {rider.name.charAt(0)}
                </div>
                <p className="font-extrabold text-slate-900">{rider.name}</p>
              </div>
              <button 
                onClick={() => onSelectRider(rider.name)}
                className="bg-indigo-700 text-white px-4 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-widest"
              >
                Select
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}