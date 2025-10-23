import React, { useState, useEffect } from 'react';
import { BookOpen, AlertCircle } from 'lucide-react';
import TextInput from './components/TextInput';
import AnalysisDisplay from './components/AnalysisDisplay';
import MetricsPanel from './components/MetricsPanel';
import ModelSelector from './components/ModelSelector';
import LoadingSpinner from './components/LoadingSpinner';
import { useModelLoader } from './hooks/useModelLoader';
import { useTextAnalysis } from './hooks/useTextAnalysis';

function App() {
  const [activeTab, setActiveTab] = useState('input'); // 'input', 'analysis', 'metrics', 'models'

  // Model Loading
  const {
    isLoading: modelsLoading,
    progress: modelProgress,
    currentModel,
    loadedModels,
    modelDetails,
    error: modelError,
    loadSingleModel,
    unloadModel,
    allModelsLoaded
  } = useModelLoader(['SENTIMENT', 'EMBEDDINGS']); // Auto-load wichtige Models

  // Text Analysis
  const {
    isAnalyzing,
    progress: analysisProgress,
    message: analysisMessage,
    result: analysisResult,
    error: analysisError,
    analyze,
    clearResult,
    clearError
  } = useTextAnalysis();

  // Automatisch zu Analysis wechseln wenn Analyse fertig
  useEffect(() => {
    if (analysisResult && !isAnalyzing) {
      setActiveTab('analysis');
    }
  }, [analysisResult, isAnalyzing]);

  const handleAnalyze = async (text) => {
    try {
      clearError();
      await analyze(text);
    } catch (error) {
      console.error('Analyse Fehler:', error);
    }
  };

  const handleNewAnalysis = () => {
    clearResult();
    setActiveTab('input');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BookOpen className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Deutscher Lyrik Analyzer
                </h1>
                <p className="text-sm text-gray-600">
                  KI-gestützte Analyse deutscher Texte und Gedichte
                </p>
              </div>
            </div>

            {/* Model Status */}
            <div className="flex items-center space-x-4">
              {modelsLoading ? (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Models laden...</span>
                </div>
              ) : allModelsLoaded ? (
                <div className="flex items-center space-x-2 text-sm text-green-600">
                  <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                  <span>{loadedModels.length} Models geladen</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-sm text-yellow-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>Einige Models fehlen</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('input')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'input'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Text-Eingabe
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              disabled={!analysisResult}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'analysis'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Analyse-Ansicht
            </button>
            <button
              onClick={() => setActiveTab('metrics')}
              disabled={!analysisResult}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'metrics'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Metriken
            </button>
            <button
              onClick={() => setActiveTab('models')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'models'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ML Models
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Messages */}
        {(modelError || analysisError) && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-red-900">Fehler</h4>
              <p className="text-sm text-red-700 mt-1">
                {modelError || analysisError}
              </p>
            </div>
            <button
              onClick={clearError}
              className="text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        )}

        {/* Loading State */}
        {(modelsLoading || isAnalyzing) && (
          <div className="mb-6">
            <LoadingSpinner
              progress={modelsLoading ? modelProgress : analysisProgress}
              message={modelsLoading ? `Lade ${currentModel}...` : analysisMessage}
              showProgress={true}
            />
          </div>
        )}

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'input' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <TextInput
                  onAnalyze={handleAnalyze}
                  isAnalyzing={isAnalyzing}
                />
                
                {analysisResult && (
                  <div className="mt-6">
                    <button
                      onClick={handleNewAnalysis}
                      className="w-full py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                    >
                      Neue Analyse starten
                    </button>
                  </div>
                )}
              </div>

              <div>
                <ModelSelector
                  loadedModels={loadedModels}
                  modelDetails={modelDetails}
                  isLoading={modelsLoading}
                  onLoadModel={loadSingleModel}
                  onUnloadModel={unloadModel}
                />

                {/* Quick Info */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">💡 Tipp</h4>
                  <p className="text-sm text-blue-700">
                    Laden Sie mindestens das <strong>Sentiment Model</strong> für eine
                    vollständige Analyse. Die Models werden beim ersten Laden gecacht.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analysis' && analysisResult && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <AnalysisDisplay
                  analysisResult={analysisResult}
                  onWordClick={(token) => console.log('Word clicked:', token)}
                />
              </div>

              <div>
                <div className="sticky top-6">
                  <button
                    onClick={handleNewAnalysis}
                    className="w-full mb-4 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Neue Analyse
                  </button>

                  {/* Quick Stats Sidebar */}
                  <div className="analysis-card">
                    <h4 className="font-semibold mb-3">Schnellübersicht</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Verarbeitet:</span>
                        <span className="font-medium">
                          {new Date(analysisResult.metadata.analyzedAt).toLocaleString('de-DE')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Dauer:</span>
                        <span className="font-medium">
                          {(analysisResult.metadata.processingTime / 1000).toFixed(2)}s
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Zeichen:</span>
                        <span className="font-medium">
                          {analysisResult.metadata.textLength}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'metrics' && analysisResult && (
            <div className="max-w-4xl mx-auto">
              <div className="mb-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold">Analyse-Metriken</h2>
                <button
                  onClick={handleNewAnalysis}
                  className="py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Neue Analyse
                </button>
              </div>

              <MetricsPanel analysisResult={analysisResult} />
            </div>
          )}

          {activeTab === 'models' && (
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">ML Model-Verwaltung</h2>
                <p className="text-gray-600">
                  Verwalten Sie die Machine Learning Modelle für die Text-Analyse.
                  Modelle werden lokal im Browser gecacht.
                </p>
              </div>

              <ModelSelector
                loadedModels={loadedModels}
                modelDetails={modelDetails}
                isLoading={modelsLoading}
                onLoadModel={loadSingleModel}
                onUnloadModel={unloadModel}
              />

              {/* Model Info */}
              <div className="mt-6 analysis-card">
                <h3 className="font-semibold mb-3">Model-Informationen</h3>
                <div className="space-y-3 text-sm">
                  <p className="text-gray-600">
                    Die Modelle basieren auf Hugging Face Transformers und werden über
                    transformers.js im Browser ausgeführt. Alle Modelle werden lokal
                    gespeichert und es werden keine Daten an externe Server gesendet.
                  </p>
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-yellow-800">
                      <strong>Hinweis:</strong> Das erste Laden eines Modells kann einige
                      Minuten dauern. Die Modelle werden dann im Browser-Cache gespeichert.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            Deutscher Lyrik Analyzer • KI-gestützte Text-Analyse • 
            Alle Analysen werden lokal im Browser durchgeführt
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;