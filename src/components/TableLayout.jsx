import React from 'react';

export default function TableLayout({ headers, children }) {
  return (
    <table className="w-full text-left font-['Poppins']">
      <thead className="bg-slate-50 text-[10px] font-bold text-slate-600 uppercase tracking-widest border-b border-slate-200">
        <tr>
          {headers.map((h) => <th key={h} className="px-8 py-4">{h}</th>)}
        </tr>
      </thead>
      <tbody className="text-sm divide-y divide-slate-100 font-normal">
        {children}
      </tbody>
    </table>
  );
}