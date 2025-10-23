import { pipeline, env } from '@xenova/transformers';
import { MODELS } from '../utils/constants';

// Konfiguriere transformers.js für lokale Nutzung
env.allowLocalModels = false;
env.useBrowserCache = true;

class ModelLoader {
  constructor() {
    this.models = new Map();
    this.loadingPromises = new Map();
    this.loadingCallbacks = new Map();
  }

  /**
   * Lädt ein ML-Model
   * @param {string} modelKey - Key aus MODELS Konstante
   * @param {function} progressCallback - Callback für Lade-Fortschritt
   * @returns {Promise} Model Pipeline
   */
  async loadModel(modelKey, progressCallback = null) {
    // Wenn Model bereits geladen ist
    if (this.models.has(modelKey)) {
      return this.models.get(modelKey);
    }

    // Wenn Model gerade geladen wird
    if (this.loadingPromises.has(modelKey)) {
      return this.loadingPromises.get(modelKey);
    }

    const modelConfig = MODELS[modelKey];
    if (!modelConfig) {
      throw new Error(`Unbekanntes Model: ${modelKey}`);
    }

    // Speichere Callback
    if (progressCallback) {
      this.loadingCallbacks.set(modelKey, progressCallback);
    }

    // Erstelle Loading Promise
    const loadingPromise = this._loadModelPipeline(modelConfig, modelKey);
    this.loadingPromises.set(modelKey, loadingPromise);

    try {
      const model = await loadingPromise;
      this.models.set(modelKey, model);
      this.loadingPromises.delete(modelKey);
      this.loadingCallbacks.delete(modelKey);
      return model;
    } catch (error) {
      this.loadingPromises.delete(modelKey);
      this.loadingCallbacks.delete(modelKey);
      throw error;
    }
  }

  /**
   * Interne Methode zum Laden der Pipeline
   * @private
   */
  async _loadModelPipeline(modelConfig, modelKey) {
    try {
      const callback = this.loadingCallbacks.get(modelKey);
      
      const model = await pipeline(
        modelConfig.task,
        modelConfig.name,
        {
          progress_callback: callback ? (progress) => {
            callback({
              status: progress.status,
              progress: progress.progress || 0,
              file: progress.file || '',
              loaded: progress.loaded || 0,
              total: progress.total || 0
            });
          } : undefined
        }
      );

      console.log(`✅ Model geladen: ${modelConfig.label}`);
      return model;
    } catch (error) {
      console.error(`❌ Fehler beim Laden von ${modelConfig.label}:`, error);
      throw new Error(`Model konnte nicht geladen werden: ${error.message}`);
    }
  }

  /**
   * Lädt mehrere Models parallel
   * @param {Array} modelKeys - Array von Model-Keys
   * @param {function} progressCallback - Callback für Gesamt-Fortschritt
   * @returns {Promise<Object>} Object mit geladenen Models
   */
  async loadMultipleModels(modelKeys, progressCallback = null) {
    const loadedModels = {};
    const totalModels = modelKeys.length;
    let completedModels = 0;

    const modelPromises = modelKeys.map(async (key) => {
      try {
        const model = await this.loadModel(key, (progress) => {
          if (progressCallback) {
            const overallProgress = {
              currentModel: key,
              modelProgress: progress.progress,
              overallProgress: ((completedModels + (progress.progress / 100)) / totalModels) * 100,
              completedModels,
              totalModels
            };
            progressCallback(overallProgress);
          }
        });
        
        loadedModels[key] = model;
        completedModels++;
        
        if (progressCallback) {
          progressCallback({
            currentModel: key,
            modelProgress: 100,
            overallProgress: (completedModels / totalModels) * 100,
            completedModels,
            totalModels
          });
        }
        
        return { key, model };
      } catch (error) {
        console.error(`Fehler beim Laden von ${key}:`, error);
        return { key, error };
      }
    });

    await Promise.all(modelPromises);
    return loadedModels;
  }

  /**
   * Gibt ein geladenes Model zurück
   * @param {string} modelKey - Model Key
   * @returns {Object|null} Model oder null
   */
  getModel(modelKey) {
    return this.models.get(modelKey) || null;
  }

  /**
   * Prüft ob ein Model geladen ist
   * @param {string} modelKey - Model Key
   * @returns {boolean}
   */
  isModelLoaded(modelKey) {
    return this.models.has(modelKey);
  }

  /**
   * Prüft ob ein Model gerade geladen wird
   * @param {string} modelKey - Model Key
   * @returns {boolean}
   */
  isModelLoading(modelKey) {
    return this.loadingPromises.has(modelKey);
  }

  /**
   * Gibt alle geladenen Models zurück
   * @returns {Array} Array von Model-Keys
   */
  getLoadedModels() {
    return Array.from(this.models.keys());
  }

  /**
   * Entlädt ein Model aus dem Speicher
   * @param {string} modelKey - Model Key
   */
  unloadModel(modelKey) {
    if (this.models.has(modelKey)) {
      this.models.delete(modelKey);
      console.log(`Model entladen: ${modelKey}`);
    }
  }

  /**
   * Entlädt alle Models
   */
  unloadAllModels() {
    this.models.clear();
    this.loadingPromises.clear();
    this.loadingCallbacks.clear();
    console.log('Alle Models entladen');
  }

  /**
   * Gibt Speicher-Informationen zurück
   * @returns {Object} Speicher-Info
   */
  getMemoryInfo() {
    return {
      loadedModels: this.models.size,
      loadingModels: this.loadingPromises.size,
      models: Array.from(this.models.keys())
    };
  }
}

// Singleton Instance
const modelLoader = new ModelLoader();

export default modelLoader;

// Utility Funktionen für direkten Zugriff
export const loadModel = (modelKey, progressCallback) => 
  modelLoader.loadModel(modelKey, progressCallback);

export const loadMultipleModels = (modelKeys, progressCallback) => 
  modelLoader.loadMultipleModels(modelKeys, progressCallback);

export const getModel = (modelKey) => 
  modelLoader.getModel(modelKey);

export const isModelLoaded = (modelKey) => 
  modelLoader.isModelLoaded(modelKey);

export const unloadModel = (modelKey) => 
  modelLoader.unloadModel(modelKey);