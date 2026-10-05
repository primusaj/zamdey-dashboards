import React from 'react';
import { AlertCircle } from 'lucide-react';

export const FormError = ({ message }) => {
  if (!message) return null;
  return (
    <p 
      role="alert" 
      className="text-[11px] font-semibold text-rose-500 mt-1.5 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1"
    >
      <AlertCircle size={13} className="shrink-0 text-rose-500" />
      <span>{message}</span>
    </p>
  );
};

export const FormLabel = ({ children, required, htmlFor, hint }) => (
  <div className="flex items-center justify-between mb-1.5">
    <label htmlFor={htmlFor} className="text-xs font-bold uppercase tracking-wider text-slate-700">
      {children}
      {required && <span className="text-rose-500 ml-1" aria-hidden="true">*</span>}
    </label>
    {hint && <span className="text-[10px] text-slate-400 font-medium">{hint}</span>}
  </div>
);
