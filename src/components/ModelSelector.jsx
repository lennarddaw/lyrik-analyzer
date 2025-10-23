import React from 'react';
import { Database, CheckCircle, XCircle, Loader } from 'lucide-react';
import { MODELS } from '../utils/constants';

/**
 * Model Selector Component
 */
const ModelSelector = ({ 
  loadedModels = [], 
  modelDetails = {},
  isLoading = false,
  onLoadModel,
  onUnloadModel 
}) => {
  const modelEntries = Object.entries(MODELS);

  return (
    <div className="analysis-card">
      <div className="flex items-center space-x-2 mb-4">
        <Database className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold">ML Modelle</h3>
      </div>

      <div className="space-y-3">
        {modelEntries.map(([key, config]) => {
          const isLoaded = loadedModels.includes(key);
          const details = modelDetails[key];
          const isLoadingModel = details?.status === 'loading';

          return (
            <div 
              key={key}
              className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {isLoaded ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : isLoadingModel ? (
                    <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                  <span className="font-medium">{config.label}</span>
                </div>

                <button
                  onClick={() => isLoaded ? onUnloadModel(key) : onLoadModel(key)}
                  disabled={isLoading && !isLoaded}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    isLoaded
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isLoaded ? 'Löschen' : 'Laden'}
                </button>
              </div>

              {/* Model Details */}
              <div className="text-xs text-gray-500 space-y-1">
                <div>Task: {config.task}</div>
                <div className="truncate">Model: {config.name}</div>
              </div>

              {/* Progress Bar */}
              {isLoadingModel && details && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>{details.file || 'Lädt...'}</span>
                    <span>{details.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${details.progress || 0}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Geladene Modelle:</span>
          <span className="font-semibold">{loadedModels.length} / {modelEntries.length}</span>
        </div>
      </div>
    </div>
  );
};

export default ModelSelector;