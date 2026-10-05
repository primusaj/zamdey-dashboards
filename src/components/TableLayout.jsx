import React from 'react';

export default function TableLayout({ headers, children }) {
  return (
    <div className="overflow-x-auto w-full -mx-4 px-4 sm:mx-0 sm:px-0">
      <table className="w-full text-left font-['Poppins'] min-w-[600px]">
        <thead className="bg-slate-50 text-[10px] font-bold text-slate-600 uppercase tracking-widest border-b border-slate-200">
          <tr>
            {headers.map((h) => <th key={h} className="px-4 sm:px-8 py-3.5 sm:py-4 whitespace-nowrap">{h}</th>)}
          </tr>
        </thead>
        <tbody className="text-sm divide-y divide-slate-100 font-normal">
          {children}
        </tbody>
      </table>
    </div>
  );
}
