/**
 * Tokenisiert Text in Wörter (mit Interpunktion)
 * @param {string} text - Input Text
 * @returns {Array} Array von Token-Objekten
 */
export const tokenizeText = (text) => {
  if (!text || typeof text !== 'string') return [];
  
  // Regex für deutsche Wörter und Interpunktion
  const tokenRegex = /\b\w+(?:[-']\w+)*\b|[.,!?;:—–\-"„"»«()]/g;
  const tokens = [];
  let match;
  let position = 0;
  
  while ((match = tokenRegex.exec(text)) !== null) {
    tokens.push({
      text: match[0],
      index: match.index,
      position: position++,
      isPunctuation: /^[.,!?;:—–\-"„"»«()]$/.test(match[0])
    });
  }
  
  return tokens;
};

/**
 * Teilt Text in Sätze
 * @param {string} text - Input Text
 * @returns {Array} Array von Sätzen
 */
export const sentenceSegmentation = (text) => {
  if (!text || typeof text !== 'string') return [];
  
  // Deutsche Satzzeichen-Erkennung
  const sentenceRegex = /[^.!?…]+[.!?…]+/g;
  const sentences = text.match(sentenceRegex) || [];
  
  return sentences.map((sentence, index) => ({
    text: sentence.trim(),
    index,
    wordCount: sentence.trim().split(/\s+/).length
  }));
};

/**
 * Normalisiert Text (lowercase, trim, etc.)
 * @param {string} text - Input Text
 * @param {object} options - Normalisierungsoptionen
 * @returns {string} Normalisierter Text
 */
export const normalizeText = (text, options = {}) => {
  const {
    lowercase = false,
    removeExtraSpaces = true,
    removePunctuation = false,
    removeNumbers = false
  } = options;
  
  let normalized = text;
  
  if (removeExtraSpaces) {
    normalized = normalized.replace(/\s+/g, ' ').trim();
  }
  
  if (lowercase) {
    normalized = normalized.toLowerCase();
  }
  
  if (removePunctuation) {
    normalized = normalized.replace(/[^\w\s]/g, '');
  }
  
  if (removeNumbers) {
    normalized = normalized.replace(/\d+/g, '');
  }
  
  return normalized;
};

/**
 * Erkennt Verse/Zeilen in einem Gedicht
 * @param {string} text - Gedicht-Text
 * @returns {Array} Array von Versen
 */
export const detectVerses = (text) => {
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  
  return lines.map((line, index) => ({
    text: line.trim(),
    index,
    wordCount: line.trim().split(/\s+/).length,
    syllableCount: estimateSyllables(line)
  }));
};

/**
 * Schätzt Silbenanzahl (vereinfacht für Deutsch)
 * @param {string} text - Text
 * @returns {number} Geschätzte Silbenanzahl
 */
export const estimateSyllables = (text) => {
  const words = text.toLowerCase().split(/\s+/);
  let syllableCount = 0;
  
  words.forEach(word => {
    // Deutsche Vokal-Gruppen
    const vowelGroups = word.match(/[aeiouäöüy]+/g);
    syllableCount += vowelGroups ? vowelGroups.length : 0;
  });
  
  return syllableCount;
};

/**
 * Findet Reimpaare
 * @param {Array} verses - Array von Versen
 * @returns {Array} Array von Reimpaaren
 */
export const findRhymes = (verses) => {
  const rhymePairs = [];
  
  for (let i = 0; i < verses.length; i++) {
    for (let j = i + 1; j < verses.length; j++) {
      const ending1 = getWordEnding(verses[i].text);
      const ending2 = getWordEnding(verses[j].text);
      
      if (ending1 && ending2 && ending1 === ending2) {
        rhymePairs.push({
          verse1: i,
          verse2: j,
          rhyme: ending1
        });
      }
    }
  }
  
  return rhymePairs;
};

/**
 * Extrahiert Wort-Endung für Reim-Erkennung
 * @param {string} text - Vers-Text
 * @returns {string|null} Endung
 */
const getWordEnding = (text) => {
  const words = text.trim().split(/\s+/);
  const lastWord = words[words.length - 1].toLowerCase().replace(/[^\w]/g, '');
  
  if (lastWord.length < 3) return null;
  
  // Nimm die letzten 2-3 Zeichen
  return lastWord.slice(-3);
};

/**
 * Erkennt Alliterationen
 * @param {Array} tokens - Token-Array
 * @returns {Array} Array von Alliterationen
 */
export const detectAlliterations = (tokens) => {
  const alliterations = [];
  
  for (let i = 0; i < tokens.length - 1; i++) {
    if (tokens[i].isPunctuation) continue;
    
    const currentStart = tokens[i].text[0].toLowerCase();
    const nextStart = tokens[i + 1].text[0].toLowerCase();
    
    if (currentStart === nextStart && /[a-zäöüß]/.test(currentStart)) {
      alliterations.push({
        start: i,
        end: i + 1,
        letter: currentStart,
        words: [tokens[i].text, tokens[i + 1].text]
      });
    }
  }
  
  return alliterations;
};

/**
 * Berechnet Lesbarkeits-Metriken
 * @param {string} text - Text
 * @returns {object} Metriken-Objekt
 */
export const calculateReadabilityMetrics = (text) => {
  const sentences = sentenceSegmentation(text);
  const words = tokenizeText(text).filter(t => !t.isPunctuation);
  const syllables = estimateSyllables(text);
  
  const avgWordsPerSentence = words.length / Math.max(sentences.length, 1);
  const avgSyllablesPerWord = syllables / Math.max(words.length, 1);
  
  // Vereinfachter Flesch-Reading-Ease (angepasst für Deutsch)
  const readingEase = 180 - (avgWordsPerSentence * 1.015) - (avgSyllablesPerWord * 84.6);
  
  return {
    wordCount: words.length,
    sentenceCount: sentences.length,
    syllableCount: syllables,
    avgWordsPerSentence: avgWordsPerSentence.toFixed(2),
    avgSyllablesPerWord: avgSyllablesPerWord.toFixed(2),
    readingEase: Math.max(0, Math.min(100, readingEase)).toFixed(2)
  };
};

/**
 * Findet Wiederholungen
 * @param {Array} tokens - Token-Array
 * @param {number} minLength - Minimale Wortlänge
 * @returns {object} Wiederholungs-Map
 */
export const findRepetitions = (tokens, minLength = 3) => {
  const wordFrequency = {};
  
  tokens
    .filter(t => !t.isPunctuation && t.text.length >= minLength)
    .forEach(token => {
      const word = token.text.toLowerCase();
      if (!wordFrequency[word]) {
        wordFrequency[word] = [];
      }
      wordFrequency[word].push(token.position);
    });
  
  // Nur Wörter die mindestens 2x vorkommen
  return Object.entries(wordFrequency)
    .filter(([_, positions]) => positions.length > 1)
    .reduce((acc, [word, positions]) => {
      acc[word] = {
        count: positions.length,
        positions
      };
      return acc;
    }, {});
};

/**
 * Validiert Eingabe-Text
 * @param {string} text - Input Text
 * @returns {object} Validierungs-Ergebnis
 */
export const validateText = (text) => {
  if (!text || typeof text !== 'string') {
    return { valid: false, error: 'Text ist erforderlich' };
  }
  
  const trimmed = text.trim();
  
  if (trimmed.length < 10) {
    return { valid: false, error: 'Text ist zu kurz (mind. 10 Zeichen)' };
  }
  
  if (trimmed.length > 5000) {
    return { valid: false, error: 'Text ist zu lang (max. 5000 Zeichen)' };
  }
  
  return { valid: true, text: trimmed };
};