import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, X, AlertTriangle } from 'lucide-react';

export type ToastType = 'error' | 'success' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const toastIcons = {
  error: AlertCircle,
  success: CheckCircle,
  info: Info,
  warning: AlertTriangle,
};

const toastStyles = {
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'text-red-600',
    title: 'text-red-800',
    message: 'text-red-700',
    closeButton: 'text-red-500 hover:bg-red-100',
    progressBar: 'bg-red-500',
  },
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: 'text-green-600',
    title: 'text-green-800',
    message: 'text-green-700',
    closeButton: 'text-green-500 hover:bg-green-100',
    progressBar: 'bg-green-500',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'text-blue-600',
    title: 'text-blue-800',
    message: 'text-blue-700',
    closeButton: 'text-blue-500 hover:bg-blue-100',
    progressBar: 'bg-blue-500',
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    icon: 'text-yellow-600',
    title: 'text-yellow-800',
    message: 'text-yellow-700',
    closeButton: 'text-yellow-500 hover:bg-yellow-100',
    progressBar: 'bg-yellow-500',
  },
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [progress, setProgress] = useState(100);
  const duration = toast.duration || 5000;
  const Icon = toastIcons[toast.type];
  const styles = toastStyles[toast.type];

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      
      if (remaining === 0) {
        clearInterval(interval);
        onRemove(toast.id);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [toast.id, duration, onRemove]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={`${styles.bg} ${styles.border} border rounded-xl shadow-lg overflow-hidden`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-1.5 rounded-lg ${styles.bg}`}>
            <Icon className={`w-5 h-5 ${styles.icon}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${styles.title}`}>{toast.title}</p>
            <p className={`text-sm ${styles.message} mt-1`}>{toast.message}</p>
          </div>
          <button
            onClick={() => onRemove(toast.id)}
            className={`p-1 rounded-lg transition-colors ${styles.closeButton}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="h-1 bg-gray-200/50">
        <motion.div
          className={`h-full ${styles.progressBar}`}
          initial={{ width: '100%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.05, ease: 'linear' }}
        />
      </div>
    </motion.div>
  );
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 max-w-md">
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Hook for managing toasts
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const error = (title: string, message: string, duration?: number) => {
    addToast({ type: 'error', title, message, duration });
  };

  const success = (title: string, message: string, duration?: number) => {
    addToast({ type: 'success', title, message, duration });
  };

  const info = (title: string, message: string, duration?: number) => {
    addToast({ type: 'info', title, message, duration });
  };

  const warning = (title: string, message: string, duration?: number) => {
    addToast({ type: 'warning', title, message, duration });
  };

  return { toasts, addToast, removeToast, error, success, info, warning };
}
