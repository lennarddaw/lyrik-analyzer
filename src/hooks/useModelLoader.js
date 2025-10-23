import { useState, useEffect, useCallback } from 'react';
import modelLoader from '../services/modelLoader';
import { MODELS } from '../utils/constants';

/**
 * Custom Hook zum Laden von ML-Modellen
 * @param {Array} modelKeys - Array von Model-Keys die geladen werden sollen
 * @returns {Object} Model-Status und Funktionen
 */
export const useModelLoader = (modelKeys = []) => {
  const [loadingState, setLoadingState] = useState({
    isLoading: false,
    progress: 0,
    currentModel: null,
    error: null,
    loadedModels: [],
    modelDetails: {}
  });

  /**
   * Lädt alle angegebenen Modelle
   */
  const loadModels = useCallback(async () => {
    if (modelKeys.length === 0) return;

    setLoadingState(prev => ({
      ...prev,
      isLoading: true,
      progress: 0,
      error: null
    }));

    try {
      const loadedModels = await modelLoader.loadMultipleModels(
        modelKeys,
        (progress) => {
          setLoadingState(prev => ({
            ...prev,
            progress: Math.round(progress.overallProgress),
            currentModel: progress.currentModel,
            modelDetails: {
              ...prev.modelDetails,
              [progress.currentModel]: {
                progress: Math.round(progress.modelProgress),
                status: progress.modelProgress === 100 ? 'loaded' : 'loading'
              }
            }
          }));
        }
      );

      setLoadingState(prev => ({
        ...prev,
        isLoading: false,
        progress: 100,
        loadedModels: Object.keys(loadedModels),
        error: null
      }));

      return loadedModels;
    } catch (error) {
      setLoadingState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message
      }));
      throw error;
    }
  }, [modelKeys]);

  /**
   * Lädt ein einzelnes Model
   */
  const loadSingleModel = useCallback(async (modelKey) => {
    setLoadingState(prev => ({
      ...prev,
      isLoading: true,
      currentModel: modelKey,
      error: null
    }));

    try {
      await modelLoader.loadModel(modelKey, (progress) => {
        setLoadingState(prev => ({
          ...prev,
          progress: Math.round(progress.progress || 0),
          modelDetails: {
            ...prev.modelDetails,
            [modelKey]: {
              progress: Math.round(progress.progress || 0),
              status: progress.status || 'loading',
              file: progress.file || ''
            }
          }
        }));
      });

      setLoadingState(prev => ({
        ...prev,
        isLoading: false,
        progress: 100,
        loadedModels: [...new Set([...prev.loadedModels, modelKey])],
        error: null
      }));
    } catch (error) {
      setLoadingState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message
      }));
      throw error;
    }
  }, []);

  /**
   * Entlädt ein Model
   */
  const unloadModel = useCallback((modelKey) => {
    modelLoader.unloadModel(modelKey);
    setLoadingState(prev => ({
      ...prev,
      loadedModels: prev.loadedModels.filter(key => key !== modelKey),
      modelDetails: Object.fromEntries(
        Object.entries(prev.modelDetails).filter(([key]) => key !== modelKey)
      )
    }));
  }, []);

  /**
   * Entlädt alle Models
   */
  const unloadAllModels = useCallback(() => {
    modelLoader.unloadAllModels();
    setLoadingState(prev => ({
      ...prev,
      loadedModels: [],
      modelDetails: {}
    }));
  }, []);

  /**
   * Prüft ob ein Model geladen ist
   */
  const isModelLoaded = useCallback((modelKey) => {
    return loadingState.loadedModels.includes(modelKey);
  }, [loadingState.loadedModels]);

  /**
   * Gibt Model-Informationen zurück
   */
  const getModelInfo = useCallback((modelKey) => {
    return MODELS[modelKey] || null;
  }, []);

  /**
   * Automatisches Laden beim Mount (optional)
   */
  useEffect(() => {
    if (modelKeys.length > 0) {
      const alreadyLoaded = modelKeys.every(key => 
        modelLoader.isModelLoaded(key)
      );

      if (!alreadyLoaded) {
        loadModels();
      } else {
        setLoadingState(prev => ({
          ...prev,
          loadedModels: modelKeys,
          progress: 100
        }));
      }
    }
  }, []); // Nur beim Mount

  return {
    // State
    isLoading: loadingState.isLoading,
    progress: loadingState.progress,
    currentModel: loadingState.currentModel,
    error: loadingState.error,
    loadedModels: loadingState.loadedModels,
    modelDetails: loadingState.modelDetails,
    
    // Funktionen
    loadModels,
    loadSingleModel,
    unloadModel,
    unloadAllModels,
    isModelLoaded,
    getModelInfo,
    
    // Status Checks
    allModelsLoaded: modelKeys.length > 0 && 
      modelKeys.every(key => loadingState.loadedModels.includes(key)),
    anyModelLoaded: loadingState.loadedModels.length > 0
  };
};

export default useModelLoader;