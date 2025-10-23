import { getModel } from './modelLoader';
import { ANALYSIS_CONFIG, SENTIMENT_LABELS } from '../utils/constants';

/**
 * Analysiert Sentiment für gesamten Text
 * Verwendet deutsches BERT-Modell für präzise Sentiment-Analyse
 * 
 * @param {string} text - Input Text
 * @returns {Promise<Object>} Sentiment-Analyse Ergebnis
 */
export const analyzeSentiment = async (text) => {
  try {
    const model = getModel('SENTIMENT');
    if (!model) {
      throw new Error('Sentiment Model nicht geladen');
    }

    // Verwende das Modell für den gesamten Text
    const results = await model(text);
    
    // BERT-Modelle geben Arrays zurück
    const result = Array.isArray(results) ? results[0] : results;
    
    // Normalisiere Labels auf deutsch
    const normalizedLabel = normalizeSentimentLabel(result.label);
    
    return {
      label: normalizedLabel,
      score: result.score,
      confidence: result.score,
      rawLabel: result.label,
      rawScore: result.score
    };
  } catch (error) {
    console.error('Sentiment-Analyse Fehler:', error);
    throw error;
  }
};

/**
 * Analysiert Sentiment für jeden Satz
 * Nutzt Modell-basierte Analyse ohne Heuristiken
 * 
 * @param {Array} sentences - Array von Sätzen
 * @returns {Promise<Array>} Array von Sentiment-Analysen
 */
export const analyzeSentenceSentiment = async (sentences) => {
  try {
    const model = getModel('SENTIMENT');
    if (!model) {
      throw new Error('Sentiment Model nicht geladen');
    }

    // Batch-Verarbeitung für Effizienz
    const batchSize = ANALYSIS_CONFIG.PROCESSING.BATCH_SIZE;
    const results = [];
    
    for (let i = 0; i < sentences.length; i += batchSize) {
      const batch = sentences.slice(i, i + batchSize);
      const texts = batch.map(s => s.text);
      
      // Verarbeite Batch
      const batchResults = await model(texts);
      
      // Kombiniere mit Satz-Daten
      for (let j = 0; j < batch.length; j++) {
        const modelResult = Array.isArray(batchResults[j]) ? batchResults[j][0] : batchResults[j];
        
        results.push({
          ...batch[j],
          sentiment: {
            label: normalizeSentimentLabel(modelResult.label),
            score: modelResult.score,
            confidence: modelResult.score,
            rawLabel: modelResult.label
          }
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Satz-Sentiment-Analyse Fehler:', error);
    throw error;
  }
};

/**
 * Analysiert Sentiment für jedes Wort mit Kontext
 * Verwendet Sliding-Window-Ansatz für kontextuelle Analyse
 * 
 * @param {string} text - Vollständiger Text
 * @param {Array} tokens - Token-Array (aus Preprocessing)
 * @returns {Promise<Array>} Array von Word-Sentiments
 */
export const analyzeWordSentiment = async (text, tokens) => {
  try {
    const model = getModel('SENTIMENT');
    if (!model) {
      console.warn('Sentiment Model nicht geladen, überspringe Wort-Level-Analyse');
      return tokens.map(token => ({ ...token, sentiment: null }));
    }

    const contextWindow = ANALYSIS_CONFIG.PROCESSING.CONTEXT_WINDOW;
    const wordSentiments = [];
    
    // Verarbeite nur Wörter (keine Interpunktion)
    const wordTokens = tokens.filter(t => !t.isPunctuation);
    const batchSize = ANALYSIS_CONFIG.PROCESSING.BATCH_SIZE;
    
    for (let i = 0; i < wordTokens.length; i += batchSize) {
      const batch = wordTokens.slice(i, i + batchSize);
      const contextTexts = [];
      
      // Erstelle Kontexte für jedes Wort im Batch
      for (const token of batch) {
        const tokenIndex = tokens.findIndex(t => t.position === token.position);
        
        // Extrahiere Kontext-Fenster
        const contextStart = Math.max(0, tokenIndex - contextWindow);
        const contextEnd = Math.min(tokens.length, tokenIndex + contextWindow + 1);
        const contextTokens = tokens.slice(contextStart, contextEnd);
        const contextText = contextTokens.map(t => t.text).join(' ');
        
        contextTexts.push(contextText);
      }
      
      // Analysiere Batch
      const batchResults = await model(contextTexts);
      
      // Kombiniere Ergebnisse
      for (let j = 0; j < batch.length; j++) {
        const modelResult = Array.isArray(batchResults[j]) ? batchResults[j][0] : batchResults[j];
        
        wordSentiments.push({
          ...batch[j],
          sentiment: {
            label: normalizeSentimentLabel(modelResult.label),
            score: modelResult.score,
            confidence: modelResult.score,
            contextual: true,
            rawLabel: modelResult.label
          }
        });
      }
    }
    
    // Füge Interpunktion ohne Sentiment hinzu
    const allTokens = tokens.map(token => {
      if (token.isPunctuation) {
        return { ...token, sentiment: null };
      }
      const wordSentiment = wordSentiments.find(ws => ws.position === token.position);
      return wordSentiment || { ...token, sentiment: null };
    });
    
    return allTokens;
  } catch (error) {
    console.error('Wort-Sentiment-Analyse Fehler:', error);
    throw error;
  }
};

/**
 * Berechnet aggregierte Sentiment-Statistiken
 * Rein datengetrieben, keine Heuristiken
 * 
 * @param {Array} sentiments - Array von Sentiment-Objekten
 * @returns {Object} Aggregierte Statistiken
 */
export const calculateSentimentStatistics = (sentiments) => {
  const validSentiments = sentiments.filter(s => s.sentiment && s.sentiment.label);
  
  if (validSentiments.length === 0) {
    return {
      overall: SENTIMENT_LABELS.NEUTRAL,
      positiveCount: 0,
      negativeCount: 0,
      neutralCount: 0,
      averageScore: 0,
      averageConfidence: 0,
      dominant: SENTIMENT_LABELS.NEUTRAL,
      distribution: { 
        positive: 0, 
        negative: 0, 
        neutral: 0 
      },
      confidence: 0
    };
  }

  // Zähle nach Labels
  const counts = validSentiments.reduce((acc, item) => {
    const label = item.sentiment.label.toLowerCase();
    if (label.includes('positiv')) acc.positive++;
    else if (label.includes('negativ')) acc.negative++;
    else acc.neutral++;
    return acc;
  }, { positive: 0, negative: 0, neutral: 0 });

  // Berechne gewichtete Scores
  const weightedScore = validSentiments.reduce((sum, item) => {
    const label = item.sentiment.label.toLowerCase();
    const score = item.sentiment.score;
    
    if (label.includes('positiv')) return sum + score;
    if (label.includes('negativ')) return sum - score;
    return sum;
  }, 0);

  const total = validSentiments.length;
  const averageScore = weightedScore / total;
  const averageConfidence = validSentiments.reduce((sum, item) => 
    sum + (item.sentiment.confidence || item.sentiment.score), 0) / total;

  // Bestimme dominantes Sentiment (nach Anzahl)
  let dominant = SENTIMENT_LABELS.NEUTRAL;
  const maxCount = Math.max(counts.positive, counts.negative, counts.neutral);
  if (maxCount === counts.positive) dominant = SENTIMENT_LABELS.POSITIVE;
  else if (maxCount === counts.negative) dominant = SENTIMENT_LABELS.NEGATIVE;

  // Bestimme Overall basierend auf gewichtetem Score
  let overall = SENTIMENT_LABELS.NEUTRAL;
  const threshold = ANALYSIS_CONFIG.THRESHOLDS.SENTIMENT_CONFIDENCE;
  
  if (Math.abs(averageScore) < 0.1 || averageConfidence < threshold) {
    overall = SENTIMENT_LABELS.NEUTRAL;
  } else if (averageScore > 0) {
    overall = SENTIMENT_LABELS.POSITIVE;
  } else {
    overall = SENTIMENT_LABELS.NEGATIVE;
  }

  return {
    overall,
    positiveCount: counts.positive,
    negativeCount: counts.negative,
    neutralCount: counts.neutral,
    averageScore: averageScore.toFixed(3),
    averageConfidence: averageConfidence.toFixed(3),
    dominant,
    distribution: {
      positive: ((counts.positive / total) * 100).toFixed(1),
      negative: ((counts.negative / total) * 100).toFixed(1),
      neutral: ((counts.neutral / total) * 100).toFixed(1)
    },
    confidence: averageConfidence
  };
};

/**
 * Findet emotionale Höhepunkte im Text
 * Verwendet Sliding-Window für Intensitäts-Peaks
 * 
 * @param {Array} sentiments - Array von Sentiment-Objekten mit Positionen
 * @returns {Array} Array von Höhepunkten
 */
export const findEmotionalPeaks = (sentiments) => {
  const peaks = [];
  const windowSize = ANALYSIS_CONFIG.PROCESSING.CONTEXT_WINDOW;
  const validSentiments = sentiments.filter(s => s.sentiment && !s.isPunctuation);
  
  if (validSentiments.length < windowSize * 2) {
    return peaks; // Zu wenig Daten
  }

  for (let i = windowSize; i < validSentiments.length - windowSize; i++) {
    const current = validSentiments[i];
    if (!current.sentiment) continue;

    // Berechne lokales Fenster
    const windowStart = Math.max(0, i - windowSize);
    const windowEnd = Math.min(validSentiments.length, i + windowSize + 1);
    const window = validSentiments.slice(windowStart, windowEnd);
    
    // Berechne Intensität (absolute Abweichung von neutral)
    const currentIntensity = Math.abs(getSentimentScore(current.sentiment));
    const avgIntensity = window.reduce((sum, item) => 
      sum + Math.abs(getSentimentScore(item.sentiment)), 0) / window.length;

    // Peak wenn aktuelle Intensität signifikant höher als Durchschnitt
    if (currentIntensity > avgIntensity * 1.5 && currentIntensity > 0.6) {
      peaks.push({
        position: i,
        tokenPosition: current.position,
        word: current.text,
        sentiment: current.sentiment,
        intensity: currentIntensity.toFixed(3),
        localAverage: avgIntensity.toFixed(3),
        type: current.sentiment.label
      });
    }
  }

  return peaks;
};

/**
 * Analysiert Sentiment-Verlauf über Zeit
 * Verwendet Moving Average für Glättung
 * 
 * @param {Array} sentiments - Chronologisch sortierte Sentiments
 * @returns {Array} Verlaufs-Daten für Visualisierung
 */
export const analyzeSentimentTrend = (sentiments) => {
  const validSentiments = sentiments.filter(s => s.sentiment && !s.isPunctuation);
  if (validSentiments.length === 0) return [];
  
  const windowSize = Math.min(5, Math.floor(validSentiments.length / 10));
  const trendData = [];

  for (let i = 0; i < validSentiments.length; i++) {
    const windowStart = Math.max(0, i - windowSize + 1);
    const window = validSentiments.slice(windowStart, i + 1);
    
    // Berechne Moving Average
    const avgScore = window.reduce((sum, item) => 
      sum + getSentimentScore(item.sentiment), 0) / window.length;
    
    const avgConfidence = window.reduce((sum, item) => 
      sum + (item.sentiment.confidence || item.sentiment.score), 0) / window.length;

    trendData.push({
      position: i,
      tokenPosition: validSentiments[i].position,
      word: validSentiments[i].text,
      score: avgScore.toFixed(3),
      confidence: avgConfidence.toFixed(3),
      rawScore: getSentimentScore(validSentiments[i].sentiment).toFixed(3),
      label: validSentiments[i].sentiment.label
    });
  }

  return trendData;
};

/**
 * Analysiert Sentiment-Shifts (plötzliche Änderungen)
 * 
 * @param {Array} sentiments - Array von Sentiments
 * @returns {Array} Array von Sentiment-Shifts
 */
export const analyzeSentimentShifts = (sentiments) => {
  const validSentiments = sentiments.filter(s => s.sentiment && !s.isPunctuation);
  const shifts = [];
  
  if (validSentiments.length < 2) return shifts;

  for (let i = 1; i < validSentiments.length; i++) {
    const prev = validSentiments[i - 1];
    const curr = validSentiments[i];
    
    const prevScore = getSentimentScore(prev.sentiment);
    const currScore = getSentimentScore(curr.sentiment);
    const difference = Math.abs(currScore - prevScore);
    
    // Shift wenn Differenz > Schwellenwert
    if (difference > 0.5) {
      shifts.push({
        position: i,
        fromWord: prev.text,
        toWord: curr.text,
        fromSentiment: prev.sentiment.label,
        toSentiment: curr.sentiment.label,
        fromScore: prevScore.toFixed(3),
        toScore: currScore.toFixed(3),
        difference: difference.toFixed(3)
      });
    }
  }

  return shifts;
};

/**
 * Konvertiert Sentiment zu numerischem Score
 * Rein modellbasiert, keine Heuristiken
 * 
 * @param {Object} sentiment - Sentiment Objekt
 * @returns {number} Score zwischen -1 und 1
 */
const getSentimentScore = (sentiment) => {
  if (!sentiment || !sentiment.label) return 0;
  
  const label = sentiment.label.toLowerCase();
  const score = sentiment.score || 0.5;
  
  if (label.includes('positiv') || label === 'pos') return score;
  if (label.includes('negativ') || label === 'neg') return -score;
  return 0; // neutral
};

/**
 * Normalisiert Sentiment-Labels auf deutsche Begriffe
 * 
 * @param {string} label - Original Label vom Modell
 * @returns {string} Normalisiertes deutsches Label
 */
const normalizeSentimentLabel = (label) => {
  if (!label) return SENTIMENT_LABELS.NEUTRAL;
  
  const labelLower = label.toLowerCase();
  
  // Mapping verschiedener Label-Formate
  const positiveLabels = ['positive', 'positiv', 'pos', '5 stars', '4 stars', 'good', 'great'];
  const negativeLabels = ['negative', 'negativ', 'neg', '1 star', '2 stars', 'bad', 'poor'];
  const neutralLabels = ['neutral', '3 stars', 'mixed'];
  
  if (positiveLabels.some(l => labelLower.includes(l))) {
    return SENTIMENT_LABELS.POSITIVE;
  }
  if (negativeLabels.some(l => labelLower.includes(l))) {
    return SENTIMENT_LABELS.NEGATIVE;
  }
  if (neutralLabels.some(l => labelLower.includes(l))) {
    return SENTIMENT_LABELS.NEUTRAL;
  }
  
  // Fallback: Verwende Score wenn verfügbar
  return SENTIMENT_LABELS.NEUTRAL;
};

/**
 * Analysiert Sentiment-Konsistenz im Text
 * 
 * @param {Array} sentiments - Array von Sentiments
 * @returns {Object} Konsistenz-Metriken
 */
export const analyzeSentimentConsistency = (sentiments) => {
  const validSentiments = sentiments.filter(s => s.sentiment && !s.isPunctuation);
  
  if (validSentiments.length < 2) {
    return {
      consistency: 0,
      variance: 0,
      isConsistent: false
    };
  }
  
  // Berechne Varianz der Scores
  const scores = validSentiments.map(s => getSentimentScore(s.sentiment));
  const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  
  // Konsistenz: niedrige Varianz = hohe Konsistenz
  const consistency = Math.max(0, 1 - stdDev);
  
  return {
    consistency: consistency.toFixed(3),
    variance: variance.toFixed(3),
    standardDeviation: stdDev.toFixed(3),
    isConsistent: consistency > 0.7,
    interpretation: consistency > 0.8 ? 'Sehr konsistent' :
                    consistency > 0.6 ? 'Konsistent' :
                    consistency > 0.4 ? 'Moderat variabel' : 'Stark variabel'
  };
};

export default {
  analyzeSentiment,
  analyzeSentenceSentiment,
  analyzeWordSentiment,
  calculateSentimentStatistics,
  findEmotionalPeaks,
  analyzeSentimentTrend,
  analyzeSentimentShifts,
  analyzeSentimentConsistency
};