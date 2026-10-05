import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(({ type = 'info', title, message, duration = 4500 }) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev.slice(-4), { id, type, title, message, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, [removeToast]);

  const toast = {
    success: (message, title = 'Success') => addToast({ type: 'success', title, message }),
    error: (message, title = 'Attention Required') => addToast({ type: 'error', title, message }),
    warning: (message, title = 'Warning') => addToast({ type: 'warning', title, message }),
    info: (message, title = 'Notice') => addToast({ type: 'info', title, message }),
    dismiss: removeToast,
  };

  const getToastStyles = (type) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-white',
          border: 'border-emerald-200',
          accent: 'bg-emerald-500',
          iconBg: 'bg-emerald-50 text-emerald-600',
          titleColor: 'text-slate-900',
          icon: <CheckCircle2 size={20} strokeWidth={2.5} className="text-emerald-600" />,
        };
      case 'error':
        return {
          bg: 'bg-white',
          border: 'border-rose-200',
          accent: 'bg-rose-500',
          iconBg: 'bg-rose-50 text-rose-600',
          titleColor: 'text-slate-900',
          icon: <AlertCircle size={20} strokeWidth={2.5} className="text-rose-600" />,
        };
      case 'warning':
        return {
          bg: 'bg-white',
          border: 'border-amber-200',
          accent: 'bg-amber-500',
          iconBg: 'bg-amber-50 text-amber-600',
          titleColor: 'text-slate-900',
          icon: <AlertTriangle size={20} strokeWidth={2.5} className="text-amber-600" />,
        };
      default:
        return {
          bg: 'bg-white',
          border: 'border-indigo-200',
          accent: 'bg-indigo-500',
          iconBg: 'bg-indigo-50 text-indigo-600',
          titleColor: 'text-slate-900',
          icon: <Info size={20} strokeWidth={2.5} className="text-indigo-600" />,
        };
    }
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div 
        aria-live="polite" 
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-md w-[calc(100vw-2rem)] pointer-events-none"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => {
            const styles = getToastStyles(t.type);
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.9, transition: { duration: 0.2 } }}
                className={`pointer-events-auto relative overflow-hidden rounded-2xl border shadow-xl ${styles.bg} ${styles.border} p-4 transition-all`}
                role="status"
              >
                {/* Colored Top Accent Bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${styles.accent}`} />
                <div className="flex items-start gap-3 pt-1">
                  <div className={`p-2 rounded-xl shrink-0 ${styles.iconBg}`}>
                    {styles.icon}
                  </div>
                  <div className="flex-1 pr-6 min-w-0">
                    {t.title && (
                      <h4 className={`text-xs font-black uppercase tracking-wider ${styles.titleColor}`}>
                        {t.title}
                      </h4>
                    )}
                    <p className="text-xs font-medium text-slate-600 mt-0.5 leading-relaxed break-words">
                      {t.message}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeToast(t.id)}
                    className="absolute top-3.5 right-3 text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors"
                    aria-label="Dismiss notification"
                  >
                    <X size={15} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Graceful fallback if invoked outside provider
    return {
      success: (msg) => console.log('Toast success:', msg),
      error: (msg) => console.error('Toast error:', msg),
      warning: (msg) => console.warn('Toast warning:', msg),
      info: (msg) => console.info('Toast info:', msg),
      dismiss: () => {},
    };
  }
  return context;
};
