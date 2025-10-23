import { getModel } from './modelLoader';
import { tokenizeText } from '../utils/textPreprocessing';

/**
 * Analysiert Sentiment für gesamten Text
 * @param {string} text - Input Text
 * @returns {Promise<Object>} Sentiment-Analyse Ergebnis
 */
export const analyzeSentiment = async (text) => {
  try {
    const model = getModel('SENTIMENT');
    if (!model) {
      throw new Error('Sentiment Model nicht geladen');
    }

    const result = await model(text);
    
    return {
      label: mapSentimentLabel(result[0].label),
      score: result[0].score,
      confidence: result[0].score,
      rawLabel: result[0].label
    };
  } catch (error) {
    console.error('Sentiment-Analyse Fehler:', error);
    throw error;
  }
};

/**
 * Analysiert Sentiment für jeden Satz
 * @param {Array} sentences - Array von Sätzen
 * @returns {Promise<Array>} Array von Sentiment-Analysen
 */
export const analyzeSentenceSentiment = async (sentences) => {
  try {
    const model = getModel('SENTIMENT');
    if (!model) {
      throw new Error('Sentiment Model nicht geladen');
    }

    const results = await Promise.all(
      sentences.map(async (sentence) => {
        const result = await model(sentence.text);
        return {
          ...sentence,
          sentiment: {
            label: mapSentimentLabel(result[0].label),
            score: result[0].score,
            confidence: result[0].score
          }
        };
      })
    );

    return results;
  } catch (error) {
    console.error('Satz-Sentiment-Analyse Fehler:', error);
    throw error;
  }
};

/**
 * Analysiert Sentiment für jedes Wort (mit Kontext)
 * @param {string} text - Vollständiger Text
 * @param {Array} tokens - Token-Array
 * @returns {Promise<Array>} Array von Word-Sentiments
 */
export const analyzeWordSentiment = async (text, tokens) => {
  try {
    const model = getModel('SENTIMENT');
    if (!model) {
      throw new Error('Sentiment Model nicht geladen');
    }

    // Analysiere Wörter mit Kontext (vorheriges + aktuelles + nächstes Wort)
    const wordSentiments = await Promise.all(
      tokens.map(async (token, index) => {
        if (token.isPunctuation) {
          return {
            ...token,
            sentiment: null
          };
        }

        // Erstelle Kontext-String
        const contextStart = Math.max(0, index - 1);
        const contextEnd = Math.min(tokens.length, index + 2);
        const contextTokens = tokens.slice(contextStart, contextEnd);
        const contextText = contextTokens.map(t => t.text).join(' ');

        try {
          const result = await model(contextText);
          return {
            ...token,
            sentiment: {
              label: mapSentimentLabel(result[0].label),
              score: result[0].score,
              confidence: result[0].score,
              contextual: true
            }
          };
        } catch (error) {
          // Fallback für einzelne Wörter
          return {
            ...token,
            sentiment: {
              label: 'neutral',
              score: 0.5,
              confidence: 0,
              error: true
            }
          };
        }
      })
    );

    return wordSentiments;
  } catch (error) {
    console.error('Wort-Sentiment-Analyse Fehler:', error);
    throw error;
  }
};

/**
 * Berechnet aggregierte Sentiment-Statistiken
 * @param {Array} sentiments - Array von Sentiment-Objekten
 * @returns {Object} Aggregierte Statistiken
 */
export const calculateSentimentStatistics = (sentiments) => {
  const validSentiments = sentiments.filter(s => s.sentiment && !s.sentiment.error);
  
  if (validSentiments.length === 0) {
    return {
      overall: 'neutral',
      positiveCount: 0,
      negativeCount: 0,
      neutralCount: 0,
      averageScore: 0,
      dominant: 'neutral',
      distribution: { positive: 0, negative: 0, neutral: 0 }
    };
  }

  let positiveCount = 0;
  let negativeCount = 0;
  let neutralCount = 0;
  let scoreSum = 0;

  validSentiments.forEach(item => {
    const label = item.sentiment.label.toLowerCase();
    const score = item.sentiment.score;
    
    if (label.includes('positiv')) {
      positiveCount++;
      scoreSum += score;
    } else if (label.includes('negativ')) {
      negativeCount++;
      scoreSum -= score;
    } else {
      neutralCount++;
    }
  });

  const total = validSentiments.length;
  const averageScore = scoreSum / total;

  // Bestimme dominantes Sentiment
  let dominant = 'neutral';
  const maxCount = Math.max(positiveCount, negativeCount, neutralCount);
  if (maxCount === positiveCount) dominant = 'positiv';
  else if (maxCount === negativeCount) dominant = 'negativ';

  return {
    overall: averageScore > 0.1 ? 'positiv' : averageScore < -0.1 ? 'negativ' : 'neutral',
    positiveCount,
    negativeCount,
    neutralCount,
    averageScore,
    dominant,
    distribution: {
      positive: ((positiveCount / total) * 100).toFixed(1),
      negative: ((negativeCount / total) * 100).toFixed(1),
      neutral: ((neutralCount / total) * 100).toFixed(1)
    }
  };
};

/**
 * Findet emotionale Höhepunkte im Text
 * @param {Array} sentiments - Array von Sentiment-Objekten mit Positionen
 * @returns {Array} Array von Höhepunkten
 */
export const findEmotionalPeaks = (sentiments) => {
  const peaks = [];
  const windowSize = 3;

  for (let i = windowSize; i < sentiments.length - windowSize; i++) {
    const window = sentiments.slice(i - windowSize, i + windowSize + 1);
    const current = sentiments[i];
    
    if (!current.sentiment || current.sentiment.error) continue;

    const currentScore = Math.abs(getSentimentScore(current.sentiment));
    const avgScore = window.reduce((sum, item) => {
      return sum + (item.sentiment ? Math.abs(getSentimentScore(item.sentiment)) : 0);
    }, 0) / window.length;

    // Wenn aktueller Score deutlich höher als Durchschnitt
    if (currentScore > avgScore * 1.3 && currentScore > 0.7) {
      peaks.push({
        position: i,
        word: current.text,
        sentiment: current.sentiment,
        intensity: currentScore
      });
    }
  }

  return peaks;
};

/**
 * Konvertiert Sentiment Score in numerischen Wert
 * @param {Object} sentiment - Sentiment Objekt
 * @returns {number} Score zwischen -1 und 1
 */
const getSentimentScore = (sentiment) => {
  const label = sentiment.label.toLowerCase();
  const score = sentiment.score;
  
  if (label.includes('positiv')) return score;
  if (label.includes('negativ')) return -score;
  return 0;
};

/**
 * Mappt Model-Labels auf deutsche Labels
 * @param {string} label - Original Label
 * @returns {string} Deutsches Label
 */
const mapSentimentLabel = (label) => {
  const labelLower = label.toLowerCase();
  
  if (labelLower.includes('pos') || labelLower.includes('positive')) return 'positiv';
  if (labelLower.includes('neg') || labelLower.includes('negative')) return 'negativ';
  return 'neutral';
};

/**
 * Analysiert Sentiment-Verlauf über Zeit
 * @param {Array} sentiments - Chronologisch sortierte Sentiments
 * @returns {Array} Verlaufs-Daten für Visualisierung
 */
export const analyzeSentimentTrend = (sentiments) => {
  const validSentiments = sentiments.filter(s => s.sentiment && !s.sentiment.error);
  const trendData = [];
  const windowSize = 5;

  for (let i = 0; i < validSentiments.length; i++) {
    const windowStart = Math.max(0, i - windowSize + 1);
    const window = validSentiments.slice(windowStart, i + 1);
    
    const avgScore = window.reduce((sum, item) => {
      return sum + getSentimentScore(item.sentiment);
    }, 0) / window.length;

    trendData.push({
      position: i,
      score: avgScore,
      word: validSentiments[i].text
    });
  }

  return trendData;
};