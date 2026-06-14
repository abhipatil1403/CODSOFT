import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

const Toast = () => {
  const { toast } = useApp();

  if (!toast) return null;

  const { message, type } = toast;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={18} />;
      case 'error':
        return <AlertCircle size={18} />;
      case 'info':
      default:
        return <Info size={18} />;
    }
  };

  return (
    <div className="toast-container">
      <div className={`toast ${type}`}>
        {getIcon()}
        <span>{message}</span>
      </div>
    </div>
  );
};

export default Toast;
