import React, { useEffect, useState, useCallback } from 'react';
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';

export default function Toast({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  const maxToasts = 3;
  return (
    <div className="toast-container">
      {toasts.map((toast, index) => {
        const shouldExitEarly = index < toasts.length - maxToasts;
        return (
          <ToastItem 
            key={toast.id} 
            toast={toast} 
            onDismiss={onDismiss} 
            shouldExitEarly={shouldExitEarly}
          />
        );
      })}
    </div>
  );
}

function ToastItem({ toast, onDismiss, shouldExitEarly }) {
  const [isExiting, setIsExiting] = useState(false);

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(toast.id);
    }, 280);
  }, [toast.id, onDismiss]);

  // Handle early exit if queue exceeds max count
  useEffect(() => {
    if (shouldExitEarly) {
      handleDismiss();
    }
  }, [shouldExitEarly, handleDismiss]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleDismiss();
    }, toast.duration || 4000);

    return () => clearTimeout(timer);
  }, [toast.duration, handleDismiss]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle size={18} className="toast-icon-success" />;
      case 'error':
        return <AlertTriangle size={18} className="toast-icon-error" />;
      default:
        return <Info size={18} className="toast-icon-info" />;
    }
  };

  return (
    <div className={`toast-item glass-card ${isExiting ? 'slide-out' : 'slide-in-right'} ${toast.type}`}>
      <div className="toast-content">
        {getIcon()}
        <span className="toast-message">{toast.message}</span>
      </div>
      <button 
        onClick={handleDismiss} 
        className="btn-toast-dismiss"
        title="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}
