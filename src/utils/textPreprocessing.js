import { ANALYSIS_CONFIG } from './constants';

/**
 * Tokenisiert Text in Wörter und Interpunktion
 * Verwendet Unicode-sichere Regex für deutsche Zeichen
 * WICHTIG: Dies ist nur ein Fallback - die eigentliche Tokenisierung
 * erfolgt durch die BERT-Tokenizer der Modelle
 * 
 * @param {string} text - Input Text
 * @returns {Array} Array von Token-Objekten
 */
export const tokenizeText = (text) => {
  if (!text || typeof text !== 'string') return [];
  
  // Unicode-sichere Regex für deutsche Zeichen inkl. Umlaute
  // \p{L} = alle Unicode-Buchstaben
  // \p{M} = alle Unicode-Markierungen (Akzente, Umlaute)
  const tokenRegex = /[\p{L}\p{M}]+(?:[-'][\p{L}\p{M}]+)*|[.,!?;:—–\-"""»«()…]/gu;
  
  const tokens = [];
  let match;
  let position = 0;
  
  while ((match = tokenRegex.exec(text)) !== null) {
    const tokenText = match[0];
    const isPunctuation = /^[.,!?;:—–\-"""»«()…]$/u.test(tokenText);
    
    tokens.push({
      text: tokenText,
      index: match.index,
      position: position++,
      isPunctuation,
      length: tokenText.length
    });
  }
  
  return tokens;
};

/**
 * Teilt Text in Sätze auf
 * Verwendet linguistisch informierte Satztrennung
 * 
 * @param {string} text - Input Text
 * @returns {Array} Array von Satz-Objekten
 */
export const sentenceSegmentation = (text) => {
  if (!text || typeof text !== 'string') return [];
  
  // Intelligentere Satztrennung, die Abkürzungen berücksichtigt
  // Negatives Lookbehind für gängige Abkürzungen
  const sentences = [];
  const abbreviations = /(?:Dr|Prof|etc|z\.B|d\.h|u\.a|usw|bzw|inkl|evtl|ggf)/u;
  
  // Teile zunächst am Zeilenumbruch für Verse
  const lines = text.split('\n');
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    // Dann teile innerhalb der Zeilen an Satzenden
    const lineSentences = line.split(/([.!?…]+\s+)/u).filter(s => s.trim());
    
    let currentSentence = '';
    for (let i = 0; i < lineSentences.length; i++) {
      currentSentence += lineSentences[i];
      
      // Prüfe ob es ein Satzende ist (keine Abkürzung)
      if (/[.!?…]+\s+$/u.test(lineSentences[i]) || i === lineSentences.length - 1) {
        const trimmed = currentSentence.trim();
        if (trimmed.length > 0 && !abbreviations.test(trimmed)) {
          sentences.push({
            text: trimmed,
            index: sentences.length,
            wordCount: trimmed.split(/\s+/u).length
          });
          currentSentence = '';
        }
      }
    }
    
    // Falls noch Text übrig ist
    if (currentSentence.trim()) {
      sentences.push({
        text: currentSentence.trim(),
        index: sentences.length,
        wordCount: currentSentence.trim().split(/\s+/u).length
      });
    }
  }
  
  return sentences;
};

/**
 * Normalisiert Text für Verarbeitung
 * 
 * @param {string} text - Input Text
 * @param {object} options - Normalisierungsoptionen
 * @returns {string} Normalisierter Text
 */
export const normalizeText = (text, options = {}) => {
  const {
    lowercase = false,
    removeExtraSpaces = true,
    preserveLineBreaks = true
  } = options;
  
  let normalized = text;
  
  if (removeExtraSpaces) {
    if (preserveLineBreaks) {
      // Entferne Spaces aber behalte Zeilenumbrüche
      normalized = normalized
        .split('\n')
        .map(line => line.replace(/\s+/gu, ' ').trim())
        .join('\n');
    } else {
      normalized = normalized.replace(/\s+/gu, ' ').trim();
    }
  }
  
  if (lowercase) {
    normalized = normalized.toLowerCase();
  }
  
  return normalized;
};

/**
 * Erkennt Vers-Struktur in Gedichten
 * 
 * @param {string} text - Gedicht-Text
 * @returns {Array} Array von Versen mit Metadaten
 */
export const detectVerses = (text) => {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  if (lines.length < 2) {
    return []; // Kein Gedicht
  }
  
  return lines.map((line, index) => ({
    text: line,
    index,
    wordCount: line.split(/\s+/u).length,
    charCount: line.length,
    startsWithCapital: /^[\p{Lu}]/u.test(line),
    endsWithPunctuation: /[.!?,;:]$/u.test(line)
  }));
};

/**
 * Schätzt Silbenanzahl für deutsche Wörter
 * Basiert auf linguistischen Regeln für deutsche Silbenstruktur
 * 
 * @param {string} text - Wort oder Text
 * @returns {number} Geschätzte Silbenanzahl
 */
export const estimateSyllables = (text) => {
  if (!text || typeof text !== 'string') return 0;
  
  const words = text.toLowerCase().split(/\s+/u);
  let totalSyllables = 0;
  
  for (const word of words) {
    if (word.length === 0) continue;
    
    // Zähle Vokalgruppen als Silbenkerne
    // Deutsche Vokale inkl. Umlaute und Diphthonge
    const vowelGroups = word.match(/[aeiouäöüy]+|ei|eu|au|äu|ie/gu);
    let syllables = vowelGroups ? vowelGroups.length : 1;
    
    // Korrekturen für spezielle Fälle
    // Stummes e am Ende bei bestimmten Endungen
    if (/[^aeiouäöüy]e$/u.test(word) && syllables > 1) {
      syllables--;
    }
    
    // Mindestens 1 Silbe pro Wort
    totalSyllables += Math.max(1, syllables);
  }
  
  return totalSyllables;
};

/**
 * Berechnet Lesbarkeits-Metriken
 * Verwendet mehrere Indizes für umfassende Bewertung
 * 
 * @param {string} text - Text
 * @returns {object} Metriken-Objekt
 */
export const calculateReadabilityMetrics = (text) => {
  const sentences = sentenceSegmentation(text);
  const tokens = tokenizeText(text);
  const words = tokens.filter(t => !t.isPunctuation);
  const syllables = estimateSyllables(text);
  
  const wordCount = words.length;
  const sentenceCount = Math.max(sentences.length, 1);
  const syllableCount = syllables;
  
  const avgWordsPerSentence = (wordCount / sentenceCount).toFixed(2);
  const avgSyllablesPerWord = (syllableCount / Math.max(wordCount, 1)).toFixed(2);
  
  // Flesch-Reading-Ease (angepasst für Deutsch - Amstad-Formel)
  // FRE = 180 - ASL - (58.5 × ASW)
  // ASL = durchschnittliche Satzlänge
  // ASW = durchschnittliche Silben pro Wort
  const asl = wordCount / sentenceCount;
  const asw = syllableCount / Math.max(wordCount, 1);
  const fleschReading = 180 - asl - (58.5 * asw);
  const readingEase = Math.max(0, Math.min(100, fleschReading)).toFixed(2);
  
  // Wiener Sachtextformel (für deutsche Texte)
  // WSTF = 0.1935 × MS + 0.1672 × SL + 0.1297 × IW - 0.0327 × ES - 0.875
  // MS = Prozentsatz mehrsilbiger Wörter
  // SL = durchschnittliche Satzlänge in Wörtern
  // IW = Prozentsatz langer Wörter (>6 Buchstaben)
  // ES = Prozentsatz einsilbiger Wörter
  const multiSyllableWords = words.filter(w => {
    const s = estimateSyllables(w.text);
    return s >= 3;
  }).length;
  const longWords = words.filter(w => w.text.length > 6).length;
  const monoSyllableWords = words.filter(w => estimateSyllables(w.text) === 1).length;
  
  const ms = (multiSyllableWords / Math.max(wordCount, 1)) * 100;
  const sl = avgWordsPerSentence;
  const iw = (longWords / Math.max(wordCount, 1)) * 100;
  const es = (monoSyllableWords / Math.max(wordCount, 1)) * 100;
  
  const wstf = 0.1935 * ms + 0.1672 * sl + 0.1297 * iw - 0.0327 * es - 0.875;
  const wienerIndex = Math.max(0, Math.min(20, wstf)).toFixed(2);
  
  // Lexikalische Dichte (unique words / total words)
  const uniqueWords = new Set(words.map(w => w.text.toLowerCase()));
  const lexicalDensity = ((uniqueWords.size / Math.max(wordCount, 1)) * 100).toFixed(2);
  
  return {
    wordCount,
    sentenceCount,
    syllableCount,
    uniqueWordCount: uniqueWords.size,
    avgWordsPerSentence,
    avgSyllablesPerWord,
    avgWordLength: (words.reduce((sum, w) => sum + w.text.length, 0) / Math.max(wordCount, 1)).toFixed(2),
    readingEase, // 0-100, höher = leichter
    wienerIndex, // 4-15 optimal, >15 = schwer
    lexicalDensity, // 0-100, höher = mehr Variation
    multiSyllablePercentage: ms.toFixed(2),
    longWordPercentage: iw.toFixed(2)
  };
};

/**
 * Validiert Eingabe-Text
 * 
 * @param {string} text - Input Text
 * @returns {object} Validierungs-Ergebnis
 */
export const validateText = (text) => {
  if (!text || typeof text !== 'string') {
    return { 
      valid: false, 
      error: 'Text ist erforderlich',
      errorCode: 'MISSING_TEXT'
    };
  }
  
  const trimmed = text.trim();
  
  if (trimmed.length < ANALYSIS_CONFIG.TEXT.MIN_LENGTH) {
    return { 
      valid: false, 
      error: `Text ist zu kurz (mind. ${ANALYSIS_CONFIG.TEXT.MIN_LENGTH} Zeichen)`,
      errorCode: 'TEXT_TOO_SHORT',
      length: trimmed.length
    };
  }
  
  if (trimmed.length > ANALYSIS_CONFIG.TEXT.MAX_LENGTH) {
    return { 
      valid: false, 
      error: `Text ist zu lang (max. ${ANALYSIS_CONFIG.TEXT.MAX_LENGTH} Zeichen)`,
      errorCode: 'TEXT_TOO_LONG',
      length: trimmed.length
    };
  }
  
  // Prüfe auf gültige Zeichen (mindestens einige Buchstaben)
  const letterCount = (trimmed.match(/[\p{L}]/gu) || []).length;
  if (letterCount < 5) {
    return {
      valid: false,
      error: 'Text muss mindestens 5 Buchstaben enthalten',
      errorCode: 'INSUFFICIENT_LETTERS',
      letterCount
    };
  }
  
  return { 
    valid: true, 
    text: trimmed,
    length: trimmed.length,
    letterCount
  };
};

/**
 * Extrahiert Textstatistiken
 * 
 * @param {string} text - Input Text  
 * @returns {object} Statistiken
 */
export const extractTextStatistics = (text) => {
  const tokens = tokenizeText(text);
  const words = tokens.filter(t => !t.isPunctuation);
  const sentences = sentenceSegmentation(text);
  const verses = detectVerses(text);
  
  return {
    charCount: text.length,
    wordCount: words.length,
    sentenceCount: sentences.length,
    verseCount: verses.length,
    punctuationCount: tokens.length - words.length,
    avgWordLength: words.length > 0 
      ? (words.reduce((sum, w) => sum + w.text.length, 0) / words.length).toFixed(2)
      : 0,
    isPoem: verses.length >= 2,
    hasLineBreaks: text.includes('\n')
  };
};

/**
 * Bereitet Text für Modell-Verarbeitung vor
 * 
 * @param {string} text - Input Text
 * @returns {object} Aufbereiteter Text mit Metadaten
 */
export const prepareForModel = (text) => {
  const normalized = normalizeText(text, { 
    removeExtraSpaces: true, 
    preserveLineBreaks: true 
  });
  
  const tokens = tokenizeText(normalized);
  const sentences = sentenceSegmentation(normalized);
  const statistics = extractTextStatistics(normalized);
  const readability = calculateReadabilityMetrics(normalized);
  
  return {
    original: text,
    normalized,
    tokens,
    sentences,
    statistics,
    readability,
    metadata: {
      preparedAt: new Date().toISOString(),
      language: 'de',
      encoding: 'utf-8'
    }
  };
};

// Export für Verwendung
export default {
  tokenizeText,
  sentenceSegmentation,
  normalizeText,
  detectVerses,
  estimateSyllables,
  calculateReadabilityMetrics,
  validateText,
  extractTextStatistics,
  prepareForModel
};