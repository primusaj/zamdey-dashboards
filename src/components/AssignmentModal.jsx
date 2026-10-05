import React from 'react';

export default function AssignmentModal({ isOpen, onClose, orderId, riders, onSelectRider }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-sm font-sans">
      <div className="bg-white w-full max-w-lg rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">Assign Rider</h3>
            <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">Order: {orderId}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl font-bold p-2 min-h-[44px] min-w-[44px] flex items-center justify-center">&times;</button>
        </div>

        <div className="p-3 sm:p-4 max-h-[400px] overflow-y-auto flex-1">
          {riders.map((rider) => (
            <div key={rider.id} className="flex items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 mb-2 gap-2">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shrink-0">
                  {rider.name.charAt(0)}
                </div>
                <p className="font-extrabold text-sm sm:text-base text-slate-900 truncate">{rider.name}</p>
              </div>
              <button 
                onClick={() => onSelectRider(rider.name)}
                className="bg-indigo-700 text-white px-4 py-2 sm:py-2.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest shrink-0 min-h-[36px]"
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