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
  autoDismiss = 5000,
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

  if (!error && !successMessage) return null;

  return (
    <div
      className={`mb-4 transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
    >
      <div
        className={`flex items-center justify-between p-4 rounded-lg border ${
          error
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-green-50 border-green-200 text-green-800'
        }`}
      >
        <div className="flex items-center">
          {error ? (
            <AlertCircle className="w-5 h-5 mr-3 text-red-500" />
          ) : (
            <CheckCircle className="w-5 h-5 mr-3 text-green-500" />
          )}
          <span className="text-sm font-medium">{error || successMessage}</span>
        </div>
        <button
          onClick={() => {
            setVisible(false);
            setTimeout(() => onDismiss?.(), 300);
          }}
          className="p-1 hover:bg-black/5 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
