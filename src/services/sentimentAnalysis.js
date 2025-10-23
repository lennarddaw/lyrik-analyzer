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

    const results = await model(text);
    const result = Array.isArray(results) ? results[0] : results;
    
    // Normalisiere Labels und Scores
    const { label, score } = normalizeSentiment(result);
    
    return {
      label,
      score,
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

    const batchSize = ANALYSIS_CONFIG.PROCESSING.BATCH_SIZE;
    const results = [];
    
    for (let i = 0; i < sentences.length; i += batchSize) {
      const batch = sentences.slice(i, i + batchSize);
      const texts = batch.map(s => s.text);
      
      const batchResults = await model(texts);
      
      for (let j = 0; j < batch.length; j++) {
        const modelResult = Array.isArray(batchResults[j]) ? batchResults[j][0] : batchResults[j];
        const { label, score } = normalizeSentiment(modelResult);
        
        results.push({
          ...batch[j],
          sentiment: {
            label,
            score,
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
    
    const wordTokens = tokens.filter(t => !t.isPunctuation);
    const batchSize = ANALYSIS_CONFIG.PROCESSING.BATCH_SIZE;
    
    for (let i = 0; i < wordTokens.length; i += batchSize) {
      const batch = wordTokens.slice(i, i + batchSize);
      const contextTexts = [];
      
      for (const token of batch) {
        const tokenIndex = tokens.findIndex(t => t.position === token.position);
        
        const contextStart = Math.max(0, tokenIndex - contextWindow);
        const contextEnd = Math.min(tokens.length, tokenIndex + contextWindow + 1);
        const contextTokens = tokens.slice(contextStart, contextEnd);
        const contextText = contextTokens.map(t => t.text).join(' ');
        
        contextTexts.push(contextText);
      }
      
      const batchResults = await model(contextTexts);
      
      for (let j = 0; j < batch.length; j++) {
        const modelResult = Array.isArray(batchResults[j]) ? batchResults[j][0] : batchResults[j];
        const { label, score } = normalizeSentiment(modelResult);
        
        wordSentiments.push({
          ...batch[j],
          sentiment: {
            label,
            score,
            confidence: modelResult.score,
            contextual: true,
            rawLabel: modelResult.label
          }
        });
      }
    }
    
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
      overall: SENTIMENT_LABELS.NEUTRAL.label,
      positiveCount: 0,
      negativeCount: 0,
      neutralCount: 0,
      averageScore: 0,
      averageConfidence: 0,
      dominant: SENTIMENT_LABELS.NEUTRAL.label,
      distribution: { 
        positive: '0.0', 
        negative: '0.0', 
        neutral: '0.0' 
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

  // Berechne gewichtete Scores (verwende normalisierte Scores)
  const weightedScore = validSentiments.reduce((sum, item) => {
    return sum + (item.sentiment.score || 0);
  }, 0);

  const total = validSentiments.length;
  const averageScore = weightedScore / total;
  const averageConfidence = validSentiments.reduce((sum, item) => 
    sum + (item.sentiment.confidence || 0), 0) / total;

  // Bestimme dominantes Sentiment (nach Anzahl)
  let dominant = SENTIMENT_LABELS.NEUTRAL.label;
  const maxCount = Math.max(counts.positive, counts.negative, counts.neutral);
  if (maxCount === counts.positive && counts.positive > 0) dominant = SENTIMENT_LABELS.POSITIVE.label;
  else if (maxCount === counts.negative && counts.negative > 0) dominant = SENTIMENT_LABELS.NEGATIVE.label;

  // Bestimme Overall basierend auf gewichtetem Score
  let overall = SENTIMENT_LABELS.NEUTRAL.label;
  
  if (Math.abs(averageScore) < 0.2) {
    overall = SENTIMENT_LABELS.NEUTRAL.label;
  } else if (averageScore > 0) {
    overall = SENTIMENT_LABELS.POSITIVE.label;
  } else {
    overall = SENTIMENT_LABELS.NEGATIVE.label;
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
    confidence: averageConfidence,
    emotionalRange: calculateEmotionalRange(validSentiments).toFixed(3)
  };
};

/**
 * Findet emotionale Höhepunkte im Text
 * 
 * @param {Array} sentiments - Array von Sentiment-Objekten
 * @returns {Array} Emotionale Peaks
 */
export const findEmotionalPeaks = (sentiments) => {
  const validSentiments = sentiments.filter(s => s.sentiment);
  if (validSentiments.length === 0) return [];

  const peaks = [];
  const threshold = 0.75; // Starkes Sentiment

  for (let i = 0; i < validSentiments.length; i++) {
    const current = validSentiments[i];
    const score = Math.abs(current.sentiment.score || 0);
    const confidence = current.sentiment.confidence || 0;

    // Peak wenn hoher Score und hohe Confidence
    if (score > threshold && confidence > 0.7) {
      peaks.push({
        position: current.position,
        word: current.text,
        sentiment: current.sentiment.label,
        score: current.sentiment.score,
        confidence: current.sentiment.confidence,
        intensity: score
      });
    }
  }

  return peaks.sort((a, b) => b.intensity - a.intensity);
};

/**
 * Analysiert Sentiment-Trend über den Text
 * 
 * @param {Array} sentiments - Array von Sentiment-Objekten
 * @returns {Object} Trend-Analyse
 */
export const analyzeSentimentTrend = (sentiments) => {
  const validSentiments = sentiments.filter(s => s.sentiment);
  if (validSentiments.length < 5) {
    return {
      trend: 'stable',
      slope: 0,
      direction: 'neutral',
      confidence: 0
    };
  }

  // Berechne lineare Regression
  const scores = validSentiments.map((s, i) => ({
    x: i,
    y: s.sentiment.score || 0
  }));

  const n = scores.length;
  const sumX = scores.reduce((sum, p) => sum + p.x, 0);
  const sumY = scores.reduce((sum, p) => sum + p.y, 0);
  const sumXY = scores.reduce((sum, p) => sum + (p.x * p.y), 0);
  const sumXX = scores.reduce((sum, p) => sum + (p.x * p.x), 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  
  // Bestimme Trend
  let trend = 'stable';
  let direction = 'neutral';
  
  if (Math.abs(slope) < 0.01) {
    trend = 'stable';
  } else if (slope > 0.01) {
    trend = 'improving';
    direction = 'positive';
  } else {
    trend = 'declining';
    direction = 'negative';
  }

  return {
    trend,
    slope: slope.toFixed(4),
    direction,
    confidence: Math.min(Math.abs(slope) * 10, 1).toFixed(3)
  };
};

/**
 * Analysiert Sentiment-Verschiebungen (Shifts)
 * 
 * @param {Array} sentiments - Array von Sentiment-Objekten
 * @returns {Array} Gefundene Shifts
 */
export const analyzeSentimentShifts = (sentiments) => {
  const validSentiments = sentiments.filter(s => s.sentiment);
  if (validSentiments.length < 3) return [];

  const shifts = [];
  const shiftThreshold = 0.5; // Minimum Score-Differenz für Shift

  for (let i = 1; i < validSentiments.length; i++) {
    const prev = validSentiments[i - 1];
    const curr = validSentiments[i];
    
    const prevScore = prev.sentiment.score || 0;
    const currScore = curr.sentiment.score || 0;
    const scoreDiff = currScore - prevScore;

    if (Math.abs(scoreDiff) > shiftThreshold) {
      shifts.push({
        position: curr.position,
        word: curr.text,
        from: prev.sentiment.label,
        to: curr.sentiment.label,
        magnitude: Math.abs(scoreDiff).toFixed(3),
        direction: scoreDiff > 0 ? 'positive' : 'negative'
      });
    }
  }

  return shifts;
};

/**
 * Normalisiert Sentiment-Result aus verschiedenen Modellen
 * Konvertiert Star-Ratings und verschiedene Label-Formate
 * 
 * @private
 */
const normalizeSentiment = (result) => {
  if (!result || !result.label) {
    return {
      label: SENTIMENT_LABELS.NEUTRAL.label,
      score: 0
    };
  }

  const label = result.label.toLowerCase();
  const modelScore = result.score || 0;
  
  // Star-Rating System (1-5 Sterne)
  if (label.includes('star')) {
    if (label.includes('5 stars') || label.includes('5 star')) {
      return { label: SENTIMENT_LABELS.POSITIVE.label, score: 0.9 };
    }
    if (label.includes('4 stars') || label.includes('4 star')) {
      return { label: SENTIMENT_LABELS.POSITIVE.label, score: 0.6 };
    }
    if (label.includes('3 stars') || label.includes('3 star')) {
      return { label: SENTIMENT_LABELS.NEUTRAL.label, score: 0 };
    }
    if (label.includes('2 stars') || label.includes('2 star')) {
      return { label: SENTIMENT_LABELS.NEGATIVE.label, score: -0.6 };
    }
    if (label.includes('1 star')) {
      return { label: SENTIMENT_LABELS.NEGATIVE.label, score: -0.9 };
    }
  }
  
  // Direkte Label-Matches
  const positiveLabels = ['positive', 'positiv', 'pos', 'good', 'great'];
  const negativeLabels = ['negative', 'negativ', 'neg', 'bad', 'poor'];
  const neutralLabels = ['neutral', 'mixed'];
  
  if (positiveLabels.some(l => label.includes(l))) {
    // Score bleibt positiv
    return { label: SENTIMENT_LABELS.POSITIVE.label, score: Math.abs(modelScore) };
  }
  if (negativeLabels.some(l => label.includes(l))) {
    // Score wird negativ
    return { label: SENTIMENT_LABELS.NEGATIVE.label, score: -Math.abs(modelScore) };
  }
  if (neutralLabels.some(l => label.includes(l))) {
    return { label: SENTIMENT_LABELS.NEUTRAL.label, score: 0 };
  }
  
  // Fallback
  return { label: SENTIMENT_LABELS.NEUTRAL.label, score: 0 };
};

/**
 * Konvertiert Sentiment-Objekt zu numerischem Score
 * @private
 */
const getSentimentScore = (sentiment) => {
  if (!sentiment) return 0;
  
  // Verwende den normalisierten Score wenn vorhanden
  if (typeof sentiment.score === 'number') {
    return sentiment.score;
  }
  
  // Fallback auf Label-basierte Konversion
  const label = sentiment.label.toLowerCase();
  if (label.includes('positiv')) return 1;
  if (label.includes('negativ')) return -1;
  return 0;
};

/**
 * Berechnet emotionale Spannweite
 * @private
 */
const calculateEmotionalRange = (sentiments) => {
  if (sentiments.length === 0) return 0;
  
  const scores = sentiments.map(s => getSentimentScore(s.sentiment));
  const max = Math.max(...scores);
  const min = Math.min(...scores);
  
  return max - min;
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