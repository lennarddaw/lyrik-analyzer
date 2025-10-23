import { useState, useCallback, useRef, useEffect } from 'react';
import textAnalyzer from '../services/textAnalyzer';

/**
 * Custom Hook für Text-Analyse
 * @param {Object} options - Analyse-Optionen
 * @returns {Object} Analyse-Status und Funktionen
 */
export const useTextAnalysis = (options = {}) => {
  const [analysisState, setAnalysisState] = useState({
    isAnalyzing: false,
    progress: 0,
    message: '',
    result: null,
    error: null,
    history: []
  });

  const abortControllerRef = useRef(null);
  const analysisTimeoutRef = useRef(null);

  /**
   * Führt Text-Analyse durch
   */
  const analyze = useCallback(async (text, customOptions = {}) => {
    // Clear previous timeout
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }

    // Reset state
    setAnalysisState(prev => ({
      ...prev,
      isAnalyzing: true,
      progress: 0,
      message: 'Starte Analyse...',
      error: null
    }));

    try {
      const analysisOptions = { ...options, ...customOptions };
      
      const result = await textAnalyzer.analyze(
        text,
        analysisOptions,
        (progress) => {
          setAnalysisState(prev => ({
            ...prev,
            progress: progress.progress,
            message: progress.message
          }));
        }
      );

      setAnalysisState(prev => ({
        ...prev,
        isAnalyzing: false,
        progress: 100,
        message: 'Analyse abgeschlossen!',
        result,
        history: [
          ...prev.history.slice(-9), // Behalte nur die letzten 10
          {
            timestamp: new Date().toISOString(),
            textPreview: text.slice(0, 50) + '...',
            wordCount: result.tokens.words.length,
            sentiment: result.sentiment?.overall.label || 'N/A'
          }
        ]
      }));

      return result;
    } catch (error) {
      setAnalysisState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: error.message
      }));
      throw error;
    }
  }, [options]);

  /**
   * Führt partielle Analyse durch
   */
  const analyzePartial = useCallback(async (text, aspects) => {
    setAnalysisState(prev => ({
      ...prev,
      isAnalyzing: true,
      message: 'Führe partielle Analyse durch...'
    }));

    try {
      const result = await textAnalyzer.analyzePartial(text, aspects);
      
      setAnalysisState(prev => ({
        ...prev,
        isAnalyzing: false,
        result,
        error: null
      }));

      return result;
    } catch (error) {
      setAnalysisState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: error.message
      }));
      throw error;
    }
  }, []);

  /**
   * Analysiert einzelnes Wort
   */
  const analyzeWord = useCallback(async (word, context) => {
    try {
      return await textAnalyzer.analyzeWord(word, context);
    } catch (error) {
      console.error('Wort-Analyse Fehler:', error);
      throw error;
    }
  }, []);

  /**
   * Vergleicht zwei Texte
   */
  const compareTexts = useCallback(async (text1, text2) => {
    setAnalysisState(prev => ({
      ...prev,
      isAnalyzing: true,
      message: 'Vergleiche Texte...'
    }));

    try {
      const result = await textAnalyzer.compareTexts(text1, text2);
      
      setAnalysisState(prev => ({
        ...prev,
        isAnalyzing: false,
        result,
        error: null
      }));

      return result;
    } catch (error) {
      setAnalysisState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: error.message
      }));
      throw error;
    }
  }, []);

  /**
   * Debounced Analyse (z.B. für Live-Typing)
   */
  const analyzeDebouncedRef = useRef(null);
  const analyzeDebounced = useCallback((text, delay = 1000) => {
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }

    analysisTimeoutRef.current = setTimeout(() => {
      analyze(text);
    }, delay);
  }, [analyze]);

  /**
   * Löscht Analyse-Ergebnis
   */
  const clearResult = useCallback(() => {
    setAnalysisState(prev => ({
      ...prev,
      result: null,
      error: null,
      progress: 0,
      message: ''
    }));
    textAnalyzer.clearAnalysis();
  }, []);

  /**
   * Löscht Fehler
   */
  const clearError = useCallback(() => {
    setAnalysisState(prev => ({
      ...prev,
      error: null
    }));
  }, []);

  /**
   * Löscht Historie
   */
  const clearHistory = useCallback(() => {
    setAnalysisState(prev => ({
      ...prev,
      history: []
    }));
  }, []);

  /**
   * Bricht laufende Analyse ab
   */
  const cancelAnalysis = useCallback(() => {
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
      analysisTimeoutRef.current = null;
    }

    setAnalysisState(prev => ({
      ...prev,
      isAnalyzing: false,
      message: 'Analyse abgebrochen',
      error: null
    }));
  }, []);

  /**
   * Exportiert Ergebnis als JSON
   */
  const exportResultAsJSON = useCallback(() => {
    if (!analysisState.result) return null;

    const exportData = {
      exportedAt: new Date().toISOString(),
      analysis: analysisState.result
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `lyrik-analyse-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }, [analysisState.result]);

  /**
   * Cleanup bei Unmount
   */
  useEffect(() => {
    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Hilfsfunktionen für spezifische Daten
   */
  const getSentimentData = useCallback(() => {
    if (!analysisState.result?.sentiment) return null;
    
    return {
      overall: analysisState.result.sentiment.overall,
      statistics: analysisState.result.sentiment.statistics,
      distribution: analysisState.result.sentiment.statistics?.distribution
    };
  }, [analysisState.result]);

  const getWordData = useCallback((position) => {
    if (!analysisState.result?.tokens) return null;
    
    return analysisState.result.tokens.all.find(t => t.position === position);
  }, [analysisState.result]);

  const getSyntaxData = useCallback(() => {
    if (!analysisState.result?.syntax) return null;
    
    return analysisState.result.syntax;
  }, [analysisState.result]);

  const getSemanticData = useCallback(() => {
    if (!analysisState.result?.semantics) return null;
    
    return analysisState.result.semantics;
  }, [analysisState.result]);

  return {
    // State
    isAnalyzing: analysisState.isAnalyzing,
    progress: analysisState.progress,
    message: analysisState.message,
    result: analysisState.result,
    error: analysisState.error,
    history: analysisState.history,
    
    // Hauptfunktionen
    analyze,
    analyzePartial,
    analyzeWord,
    compareTexts,
    analyzeDebounced,
    
    // Utility Funktionen
    clearResult,
    clearError,
    clearHistory,
    cancelAnalysis,
    exportResultAsJSON,
    
    // Data Getter
    getSentimentData,
    getWordData,
    getSyntaxData,
    getSemanticData,
    
    // Status Checks
    hasResult: analysisState.result !== null,
    hasError: analysisState.error !== null,
    hasHistory: analysisState.history.length > 0
  };
};

export default useTextAnalysis;