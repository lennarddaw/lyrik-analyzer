import React from 'react';

/**
 * Loading Spinner Component mit Fortschrittsanzeige
 */
const LoadingSpinner = ({ 
  progress = 0, 
  message = 'Lädt...', 
  size = 'md',
  showProgress = true 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-8">
      {/* Spinner */}
      <div className="relative">
        <div className={`${sizeClasses[size]} animate-spin`}>
          <div className="h-full w-full rounded-full border-4 border-gray-200 border-t-blue-600"></div>
        </div>
        
        {/* Fortschritt im Zentrum */}
        {showProgress && progress > 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-semibold text-blue-600">
              {Math.round(progress)}%
            </span>
          </div>
        )}
      </div>

      {/* Nachricht */}
      {message && (
        <div className="text-center">
          <p className="text-sm text-gray-600">{message}</p>
        </div>
      )}

      {/* Fortschrittsbalken */}
      {showProgress && progress > 0 && (
        <div className="w-64 bg-gray-200 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-blue-600 h-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}
    </div>
  );
};

export default LoadingSpinner;