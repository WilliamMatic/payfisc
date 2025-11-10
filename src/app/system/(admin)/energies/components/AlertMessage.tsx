// app/components/AlertMessage.tsx (version étendue)
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertMessageProps {
  type?: AlertType;
  message: string | null;
  title?: string;
  onDismiss?: () => void;
  autoDismiss?: number;
  dismissible?: boolean;
}

const alertConfig = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-800',
    iconColor: 'text-green-500'
  },
  error: {
    icon: AlertCircle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-800',
    iconColor: 'text-red-500'
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-800',
    iconColor: 'text-yellow-500'
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-800',
    iconColor: 'text-blue-500'
  }
};

export default function AlertMessage({ 
  type = 'info',
  message,
  title,
  onDismiss,
  autoDismiss = 5000,
  dismissible = true
}: AlertMessageProps) {
  const [visible, setVisible] = useState(false);
  const config = alertConfig[type];
  const Icon = config.icon;

  useEffect(() => {
    if (message) {
      setVisible(true);
      
      if (autoDismiss > 0) {
        const timer = setTimeout(() => {
          setVisible(false);
          setTimeout(() => onDismiss?.(), 300);
        }, autoDismiss);

        return () => clearTimeout(timer);
      }
    } else {
      setVisible(false);
    }
  }, [message, autoDismiss, onDismiss]);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => onDismiss?.(), 300);
  };

  if (!message) return null;

  return (
    <div className={`transition-all duration-300 ease-in-out ${
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
    }`}>
      <div className={`flex items-start p-4 ${config.bgColor} border ${config.borderColor} rounded-lg shadow-sm`}>
        <Icon className={`w-5 h-5 ${config.iconColor} mt-0.5 mr-3 flex-shrink-0`} />
        <div className="flex-1">
          {title && <p className={`font-medium text-sm ${config.textColor}`}>{title}</p>}
          <p className={`text-sm mt-1 ${config.textColor}`}>{message}</p>
        </div>
        {dismissible && (
          <button
            onClick={handleDismiss}
            className={`ml-4 p-1 ${config.iconColor} hover:opacity-70 rounded transition-colors`}
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// Composant spécialisé pour les énergies
export function EnergieAlertMessage({ 
  error, 
  successMessage,
  ...props 
}: { 
  error: string | null; 
  successMessage: string | null;
} & Omit<AlertMessageProps, 'type' | 'message'>) {
  if (error) {
    return <AlertMessage type="error" message={error} {...props} />;
  }
  
  if (successMessage) {
    return <AlertMessage type="success" message={successMessage} {...props} />;
  }
  
  return null;
}