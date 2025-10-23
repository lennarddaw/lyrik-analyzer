import { SENTIMENT_COLORS, SENTIMENT_LABELS } from './constants';

/**
 * Mappt Sentiment-Score zu RGB-Farbe
 * @param {number} score - Sentiment Score (-1 bis 1)
 * @returns {string} RGB-Farbe als String
 */
export const getSentimentRGB = (score) => {
  // Normalisiere Score auf -1 bis 1
  const normalizedScore = Math.max(-1, Math.min(1, score));
  
  // Bestimme Farbe basierend auf Score
  if (normalizedScore > 0.15) {
    // Positiv: Grün
    const intensity = Math.min(normalizedScore * 1.5, 1);
    const r = Math.floor(34 + (136 - 34) * (1 - intensity));
    const g = Math.floor(197 + (239 - 197) * (1 - intensity));
    const b = Math.floor(94 + (172 - 94) * (1 - intensity));
    return `rgb(${r}, ${g}, ${b})`;
  } else if (normalizedScore < -0.15) {
    // Negativ: Rot
    const intensity = Math.min(Math.abs(normalizedScore) * 1.5, 1);
    const r = Math.floor(239 + (185 - 239) * (1 - intensity));
    const g = Math.floor(68 + (28 - 68) * (1 - intensity));
    const b = Math.floor(68 + (28 - 68) * (1 - intensity));
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // Neutral: Grau
    return 'rgb(148, 163, 184)';
  }
};

/**
 * Mappt Confidence-Score zu Opacity
 * @param {number} confidence - Confidence Score (0 bis 1)
 * @returns {number} Opacity-Wert (0.3 bis 0.9)
 */
export const getColorIntensity = (confidence) => {
  // Mappt Confidence (0-1) auf Opacity (0.3-0.9)
  return 0.3 + (confidence * 0.6);
};

/**
 * Gibt Sentiment-Label basierend auf Score zurück
 * @param {number} score - Sentiment Score (-1 bis 1)
 * @returns {string} Sentiment Label ('positiv', 'neutral', 'negativ')
 */
export const getSentimentLabel = (score) => {
  const normalizedScore = Math.max(-1, Math.min(1, score));
  
  if (normalizedScore > 0.15) {
    return SENTIMENT_LABELS.POSITIVE.label;
  } else if (normalizedScore < -0.15) {
    return SENTIMENT_LABELS.NEGATIVE.label;
  } else {
    return SENTIMENT_LABELS.NEUTRAL.label;
  }
};

/**
 * Gibt passende Hintergrundfarbe für Sentiment-Label
 * @param {string} label - Sentiment Label
 * @param {number} intensity - Intensität (0-1), optional
 * @returns {string} Farbe als Hex oder RGB
 */
export const getSentimentColor = (label, intensity = 0.6) => {
  const colors = {
    'positiv': SENTIMENT_COLORS.POSITIVE,
    'neutral': SENTIMENT_COLORS.NEUTRAL,
    'negativ': SENTIMENT_COLORS.NEGATIVE
  };
  
  const colorSet = colors[label] || colors.neutral;
  
  // Wähle Farbstärke basierend auf Intensität
  if (intensity > 0.7) {
    return colorSet.dark;
  } else if (intensity < 0.4) {
    return colorSet.light;
  } else {
    return colorSet.base;
  }
};

/**
 * Gibt CSS-Klasse für POS-Tag zurück
 * @param {string} posTag - POS Tag
 * @returns {string} Tailwind CSS Klasse
 */
export const getPOSColor = (posTag) => {
  const colors = {
    'NOUN': 'bg-blue-100 text-blue-800',
    'VERB': 'bg-green-100 text-green-800',
    'ADJ': 'bg-yellow-100 text-yellow-800',
    'ADV': 'bg-purple-100 text-purple-800',
    'PRON': 'bg-pink-100 text-pink-800',
    'DET': 'bg-indigo-100 text-indigo-800',
    'ADP': 'bg-orange-100 text-orange-800',
    'CCONJ': 'bg-teal-100 text-teal-800',
    'SCONJ': 'bg-cyan-100 text-cyan-800',
    'NUM': 'bg-red-100 text-red-800',
    'AUX': 'bg-lime-100 text-lime-800',
    'PART': 'bg-amber-100 text-amber-800',
    'INTJ': 'bg-rose-100 text-rose-800',
    'PUNCT': 'bg-gray-100 text-gray-600',
    'X': 'bg-gray-100 text-gray-600'
  };
  
  return colors[posTag] || colors.X;
};

/**
 * Gibt Farbe für Named Entity zurück
 * @param {string} entityType - Entity Type
 * @returns {string} Farbe als Hex
 */
export const getEntityColor = (entityType) => {
  const colors = {
    'Person': '#fbbf24',
    'Ort': '#3b82f6',
    'Organisation': '#8b5cf6',
    'Diverses': '#ec4899',
    'Datum': '#10b981',
    'Uhrzeit': '#06b6d4'
  };
  
  return colors[entityType] || '#94a3b8';
};

/**
 * Interpoliert zwischen zwei Farben
 * @param {string} color1 - Start-Farbe (Hex)
 * @param {string} color2 - End-Farbe (Hex)
 * @param {number} factor - Interpolationsfaktor (0-1)
 * @returns {string} Interpolierte Farbe als RGB
 */
export const interpolateColor = (color1, color2, factor) => {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  
  if (!c1 || !c2) return color1;
  
  const r = Math.round(c1.r + (c2.r - c1.r) * factor);
  const g = Math.round(c1.g + (c2.g - c1.g) * factor);
  const b = Math.round(c1.b + (c2.b - c1.b) * factor);
  
  return `rgb(${r}, ${g}, ${b})`;
};

/**
 * Konvertiert Hex zu RGB
 * @private
 */
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

/**
 * Gibt Gradient-String für Sentiment-Verlauf zurück
 * @param {Array} sentiments - Array von Sentiment-Objekten mit score
 * @returns {string} CSS Gradient String
 */
export const getSentimentGradient = (sentiments) => {
  if (!sentiments || sentiments.length === 0) {
    return 'linear-gradient(90deg, #cbd5e1 0%, #cbd5e1 100%)';
  }
  
  const steps = sentiments.map((s, i) => {
    const position = (i / (sentiments.length - 1)) * 100;
    const color = getSentimentRGB(s.score || 0);
    return `${color} ${position}%`;
  });
  
  return `linear-gradient(90deg, ${steps.join(', ')})`;
};

/**
 * Gibt Heatmap-Farbe für Wert zurück
 * @param {number} value - Wert (0-1)
 * @param {string} scheme - Farbschema ('heat', 'cool', 'diverging')
 * @returns {string} Farbe als RGB
 */
export const getHeatmapColor = (value, scheme = 'heat') => {
  const normalized = Math.max(0, Math.min(1, value));
  
  switch (scheme) {
    case 'heat':
      // Weiß -> Gelb -> Orange -> Rot
      if (normalized < 0.33) {
        return interpolateColor('#ffffff', '#fbbf24', normalized * 3);
      } else if (normalized < 0.66) {
        return interpolateColor('#fbbf24', '#f97316', (normalized - 0.33) * 3);
      } else {
        return interpolateColor('#f97316', '#dc2626', (normalized - 0.66) * 3);
      }
    
    case 'cool':
      // Weiß -> Cyan -> Blau -> Violett
      if (normalized < 0.33) {
        return interpolateColor('#ffffff', '#06b6d4', normalized * 3);
      } else if (normalized < 0.66) {
        return interpolateColor('#06b6d4', '#3b82f6', (normalized - 0.33) * 3);
      } else {
        return interpolateColor('#3b82f6', '#8b5cf6', (normalized - 0.66) * 3);
      }
    
    case 'diverging':
      // Rot -> Gelb -> Grün (für negative bis positive Werte)
      if (normalized < 0.5) {
        return interpolateColor('#dc2626', '#fbbf24', normalized * 2);
      } else {
        return interpolateColor('#fbbf24', '#22c55e', (normalized - 0.5) * 2);
      }
    
    default:
      return getSentimentRGB((normalized - 0.5) * 2);
  }
};

/**
 * Gibt kontrastreiche Textfarbe für Hintergrund zurück
 * @param {string} backgroundColor - Hintergrundfarbe (RGB oder Hex)
 * @returns {string} 'black' oder 'white'
 */
export const getContrastColor = (backgroundColor) => {
  let rgb;
  
  // Parse RGB oder Hex
  if (backgroundColor.startsWith('rgb')) {
    const matches = backgroundColor.match(/\d+/g);
    rgb = { r: parseInt(matches[0]), g: parseInt(matches[1]), b: parseInt(matches[2]) };
  } else if (backgroundColor.startsWith('#')) {
    rgb = hexToRgb(backgroundColor);
  } else {
    return 'black';
  }
  
  if (!rgb) return 'black';
  
  // Berechne relative Luminanz
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  
  return luminance > 0.5 ? 'black' : 'white';
};

export default {
  getSentimentRGB,
  getColorIntensity,
  getSentimentLabel,
  getSentimentColor,
  getPOSColor,
  getEntityColor,
  interpolateColor,
  getSentimentGradient,
  getHeatmapColor,
  getContrastColor
};