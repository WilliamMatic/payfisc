// src/app/activity/(users)/speed/components/LoadingSpinner.tsx
"use client";

import { FC } from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: FC<LoadingSpinnerProps> = ({ 
  size = "md", 
  text = "Chargement...",
  fullScreen = false 
}) => {
  const sizeClasses = {
    sm: "w-8 h-8 border-2",
    md: "w-12 h-12 border-3",
    lg: "w-16 h-16 border-4"
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  };

  const containerClasses = fullScreen 
    ? "fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 z-50"
    : "flex flex-col items-center justify-center p-8";

  return (
    <div className={containerClasses}>
      <div className="relative">
        {/* Spinner principal */}
        <div 
          className={`${sizeClasses[size]} border-gray-200 border-t-blue-600 rounded-full animate-spin`}
          style={{ animation: 'spin 1s linear infinite' }}
        ></div>
        
        {/* Élément décoratif */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className={`${sizeClasses[size].split(' ')[0]} ${sizeClasses[size].split(' ')[1]} border-transparent border-t-violet-500 rounded-full`}
            style={{ 
              animation: 'spin 2s linear infinite reverse',
            }}
          ></div>
        </div>
        
        {/* Point central */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1/3 h-1/3 bg-gradient-to-r from-blue-500 to-violet-500 rounded-full"></div>
        </div>
      </div>
      
      {/* Texte avec animation */}
      {text && (
        <div className="mt-6 text-center">
          <p className={`${textSizes[size]} font-medium text-gray-700 mb-2`}>
            {text}
          </p>
          {/* Animation de points */}
          <div className="flex justify-center space-x-1">
            <div 
              className="w-2 h-2 bg-blue-500 rounded-full"
              style={{ animation: 'bounce 1s infinite 0ms' }}
            ></div>
            <div 
              className="w-2 h-2 bg-violet-500 rounded-full"
              style={{ animation: 'bounce 1s infinite 150ms' }}
            ></div>
            <div 
              className="w-2 h-2 bg-emerald-500 rounded-full"
              style={{ animation: 'bounce 1s infinite 300ms' }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoadingSpinner;