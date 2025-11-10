// app/type-engins/components/AlertMessage.tsx
'use client';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface AlertMessageProps {
  error: string | null;
  successMessage: string | null;
  onDismiss?: () => void;
  autoDismiss?: number;
}

export default function AlertMessage({ 
  error, 
  successMessage, 
  onDismiss,
  autoDismiss = 5000 
}: AlertMessageProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (error || successMessage) {
      setVisible(true);
      
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => onDismiss?.(), 300);
      }, autoDismiss);

      return () => clearTimeout(timer);
    }
  }, [error, successMessage, autoDismiss, onDismiss]);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => onDismiss?.(), 300);
  };

  if (!error && !successMessage) return null;

  return (
    <div className={`mb-4 transition-all duration-300 ease-in-out ${
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
    }`}>
      {error && (
        <div className="flex items-start p-4 bg-red-50 border border-red-200 rounded-lg shadow-sm">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-800 font-medium text-sm">Erreur</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
          <button
            onClick={handleDismiss}
            className="ml-4 p-1 text-red-400 hover:text-red-600 hover:bg-red-100 rounded transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {successMessage && (
        <div className="flex items-start p-4 bg-green-50 border border-green-200 rounded-lg shadow-sm">
          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-green-800 font-medium text-sm">Succès</p>
            <p className="text-green-700 text-sm mt-1">{successMessage}</p>
          </div>
          <button
            onClick={handleDismiss}
            className="ml-4 p-1 text-green-400 hover:text-green-600 hover:bg-green-100 rounded transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}