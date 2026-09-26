import React from 'react';

export default function StatCard({ label, value, color }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm transition-all hover:border-slate-300">
      <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">{label}</p>
      <h4 className="text-2xl font-extrabold text-slate-950">{value}</h4>
      <div className={`mt-4 h-1 w-12 rounded-full bg-${color}-500`} />
    </div>
  );
}