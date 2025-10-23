import { SENTIMENT_COLORS, EMOTIONS } from './constants';

/**
 * Konvertiert einen Sentiment-Score in eine Farbe
 * @param {number} score - Score zwischen -1 und 1
 * @returns {string} Tailwind CSS Klassen
 */
export const getSentimentColor = (score) => {
  if (score > 0.3) return SENTIMENT_COLORS.POSITIVE;
  if (score < -0.3) return SENTIMENT_COLORS.NEGATIVE;
  return SENTIMENT_COLORS.NEUTRAL;
};

/**
 * Konvertiert einen Sentiment-Score in RGB für graduelle Färbung
 * @param {number} score - Score zwischen -1 und 1
 * @returns {string} RGB color string
 */
export const getSentimentRGB = (score) => {
  // Positiv: Grün (16, 185, 129)
  // Negativ: Rot (239, 68, 68)
  // Neutral: Grau (107, 114, 128)
  
  if (score > 0) {
    const intensity = Math.min(score, 1);
    const r = Math.round(107 + (16 - 107) * intensity);
    const g = Math.round(114 + (185 - 114) * intensity);
    const b = Math.round(128 + (129 - 128) * intensity);
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    const intensity = Math.min(Math.abs(score), 1);
    const r = Math.round(107 + (239 - 107) * intensity);
    const g = Math.round(114 + (68 - 114) * intensity);
    const b = Math.round(128 + (68 - 128) * intensity);
    return `rgb(${r}, ${g}, ${b})`;
  }
};

/**
 * Gibt die passende Emotion-Farbe zurück
 * @param {string} emotion - Emotion Label
 * @returns {object} Emotion Konfiguration
 */
export const getEmotionColor = (emotion) => {
  const emotionKey = emotion.toUpperCase().replace(/\s+/g, '_');
  return EMOTIONS[emotionKey] || EMOTIONS.NEUTRAL;
};

/**
 * Berechnet die Intensität der Farbe basierend auf Confidence
 * @param {number} confidence - Confidence Score (0-1)
 * @returns {number} Opacity Wert (0-1)
 */
export const getColorIntensity = (confidence) => {
  return 0.3 + (confidence * 0.7); // Min 30%, Max 100%
};

/**
 * Erstellt einen Farbverlauf für Wort-Highlighting
 * @param {number} startScore - Anfangs-Sentiment
 * @param {number} endScore - End-Sentiment
 * @returns {string} CSS gradient string
 */
export const getSentimentGradient = (startScore, endScore) => {
  const startColor = getSentimentRGB(startScore);
  const endColor = getSentimentRGB(endScore);
  return `linear-gradient(90deg, ${startColor}, ${endColor})`;
};

/**
 * Gibt eine Hintergrundfarbe mit Opacity zurück
 * @param {string} colorClass - Tailwind color class
 * @param {number} opacity - Opacity (0-1)
 * @returns {string} CSS style string
 */
export const getColorWithOpacity = (colorClass, opacity) => {
  const colorMap = {
    'bg-green-100': 'rgba(16, 185, 129, OPACITY)',
    'bg-red-100': 'rgba(239, 68, 68, OPACITY)',
    'bg-gray-100': 'rgba(107, 114, 128, OPACITY)',
    'bg-blue-100': 'rgba(59, 130, 246, OPACITY)',
    'bg-yellow-100': 'rgba(251, 191, 36, OPACITY)',
    'bg-purple-100': 'rgba(139, 92, 246, OPACITY)',
    'bg-pink-100': 'rgba(236, 72, 153, OPACITY)',
  };

  const baseColor = colorMap[colorClass.split(' ')[0]];
  return baseColor ? baseColor.replace('OPACITY', opacity) : `rgba(107, 114, 128, ${opacity})`;
};

/**
 * Berechnet Kontrast-Textfarbe für Hintergrund
 * @param {string} backgroundColor - RGB string
 * @returns {string} 'text-white' oder 'text-black'
 */
export const getContrastTextColor = (backgroundColor) => {
  // Extrahiere RGB-Werte
  const rgb = backgroundColor.match(/\d+/g);
  if (!rgb) return 'text-black';
  
  const [r, g, b] = rgb.map(Number);
  
  // Berechne Luminanz
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? 'text-black' : 'text-white';
};

/**
 * Gibt eine diskrete Farbskala zurück (für Heatmaps)
 * @param {number} value - Wert zwischen 0 und 1
 * @param {number} steps - Anzahl der Schritte
 * @returns {string} Tailwind color class
 */
export const getDiscreteColor = (value, steps = 5) => {
  const colorScale = [
    'bg-blue-200',
    'bg-green-200',
    'bg-yellow-200',
    'bg-orange-200',
    'bg-red-200'
  ];
  
  const index = Math.min(Math.floor(value * steps), steps - 1);
  return colorScale[index];
};