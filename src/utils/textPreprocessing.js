import { ANALYSIS_CONFIG } from './constants';

/**
 * Normalisiert UTF-8 Text und behebt Encoding-Probleme
 * Wandelt falsch kodierte Zeichen zurück zu korrekten deutschen Zeichen
 * 
 * @param {string} text - Potenziell falsch kodierter Text
 * @returns {string} Korrigierter Text
 */
export const normalizeUTF8 = (text) => {
  if (!text || typeof text !== 'string') return text;
  
  // Häufige Encoding-Fehler korrigieren
  const encodingFixes = {
    'Ã¼': 'ü',
    'Ã¤': 'ä', 
    'Ã¶': 'ö',
    'ÃŸ': 'ß',
    'Ã„': 'Ä',
    'Ã–': 'Ö',
    'Ãœ': 'Ü',
    'Ã©': 'é',
    'Ã¨': 'è',
    'Ã ': 'à',
    'Ã¢': 'â',
    'Ã«': 'ë',
    'Ã®': 'î',
    'Ã´': 'ô',
    'Ã»': 'û',
    'Ã§': 'ç',
    'â€œ': '"',
    'â€': '"',
    'â€™': "'",
    'â€˜': "'",
    'â€"': '–',
    'â€"': '—',
    'â€¦': '…',
    'Â»': '»',
    'Â«': '«',
    'Â°': '°'
  };
  
  let normalized = text;
  
  // Ersetze alle bekannten Encoding-Fehler
  for (const [wrong, correct] of Object.entries(encodingFixes)) {
    normalized = normalized.split(wrong).join(correct);
  }
  
  // Unicode Normalization (NFC - Canonical Composition)
  normalized = normalized.normalize('NFC');
  
  return normalized;
};

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
  
  // Normalisiere UTF-8 zuerst
  const normalized = normalizeUTF8(text);
  
  // Unicode-sichere Regex für deutsche Zeichen inkl. Umlaute
  // \p{L} = alle Unicode-Buchstaben
  // \p{M} = alle Unicode-Markierungen (Akzente, Umlaute)
  const tokenRegex = /[\p{L}\p{M}]+(?:[-'][\p{L}\p{M}]+)*|[.,!?;:–—\-"""»«()…]/gu;
  
  const tokens = [];
  let match;
  let position = 0;
  
  while ((match = tokenRegex.exec(normalized)) !== null) {
    const tokenText = match[0];
    const isPunctuation = /^[.,!?;:–—\-"""»«()…]$/u.test(tokenText);
    
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
  
  // Normalisiere UTF-8 zuerst
  const normalized = normalizeUTF8(text);
  
  // Intelligentere Satztrennung, die Abkürzungen berücksichtigt
  // Negatives Lookbehind für gängige Abkürzungen
  const sentences = [];
  const abbreviations = /(?:Dr|Prof|etc|z\.B|d\.h|u\.a|usw|bzw|inkl|evtl|ggf)/u;
  
  // Teile zunächst am Zeilenumbruch für Verse
  const lines = normalized.split('\n');
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    // Dann teile innerhalb der Zeilen an Satzenden
    const lineSentences = line.split(/([.!?…]+\s+)/u).filter(s => s.trim());
    
    let currentSentence = '';
    for (let i = 0; i < lineSentences.length; i++) {
      currentSentence += lineSentences[i];
      
      // Prüfe ob es ein Satzende ist (keine Abkürzung)
      if (/[.!?…]/.test(currentSentence) && 
          !abbreviations.test(currentSentence)) {
        sentences.push({
          text: currentSentence.trim(),
          index: sentences.length,
          length: currentSentence.trim().length
        });
        currentSentence = '';
      }
    }
    
    // Füge verbleibenden Text als Satz hinzu
    if (currentSentence.trim()) {
      sentences.push({
        text: currentSentence.trim(),
        index: sentences.length,
        length: currentSentence.trim().length
      });
    }
  }
  
  return sentences.length > 0 ? sentences : [{ text: normalized.trim(), index: 0, length: normalized.trim().length }];
};

/**
 * Erkennt Verse in einem Text (für Gedichte)
 * Teilt Text nach Zeilenumbrüchen und analysiert Vers-Struktur
 * 
 * @param {string} text - Input Text
 * @returns {Array} Array von Vers-Objekten
 */
export const detectVerses = (text) => {
  if (!text || typeof text !== 'string') return [];
  
  // Normalisiere UTF-8 zuerst
  const normalized = normalizeUTF8(text);
  
  // Teile nach Zeilenumbrüchen
  const lines = normalized.split('\n');
  const verses = [];
  
  let verseIndex = 0;
  let stanzaIndex = 0;
  let versesInStanza = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Leere Zeile = neue Strophe
    if (!line) {
      if (versesInStanza.length > 0) {
        stanzaIndex++;
        versesInStanza = [];
      }
      continue;
    }
    
    // Erstelle Vers-Objekt
    const verse = {
      text: line,
      index: verseIndex,
      stanza: stanzaIndex,
      verseInStanza: versesInStanza.length,
      length: line.length,
      wordCount: line.split(/\s+/).filter(w => w.length > 0).length,
      syllables: estimateSyllables(line)
    };
    
    verses.push(verse);
    versesInStanza.push(verse);
    verseIndex++;
  }
  
  return verses;
};

/**
 * Schätzt Silbenzahl eines deutschen Wortes oder Textes
 * 
 * @param {string} text - Wort oder Text
 * @returns {number} Geschätzte Silbenzahl
 */
export const estimateSyllables = (text) => {
  if (!text || text.length === 0) return 0;
  
  // Wenn es mehrere Wörter sind, summiere die Silben
  const words = text.split(/\s+/).filter(w => w.length > 0);
  if (words.length > 1) {
    return words.reduce((sum, word) => sum + estimateSyllables(word), 0);
  }
  
  const lower = text.toLowerCase();
  
  // Zähle Vokale und Diphthonge
  const vowels = lower.match(/[aeiouäöüy]+/g);
  if (!vowels) return 1;
  
  let count = vowels.length;
  
  // Korrigiere für deutsche Diphthonge
  const diphthongs = ['au', 'äu', 'ei', 'eu', 'ai', 'ie'];
  for (const diphthong of diphthongs) {
    const matches = lower.match(new RegExp(diphthong, 'g'));
    if (matches) {
      count -= matches.length * 0.5;
    }
  }
  
  // Minimum 1 Silbe
  return Math.max(1, Math.round(count));
};

/**
 * Berechnet Text-Statistiken
 * 
 * @param {Array} tokens - Token-Array
 * @param {Array} sentences - Satz-Array
 * @returns {Object} Statistik-Objekt
 */
export const calculateStatistics = (tokens, sentences) => {
  const words = tokens.filter(t => !t.isPunctuation);
  const uniqueWords = new Set(words.map(t => t.text.toLowerCase()));
  
  const totalChars = words.reduce((sum, t) => sum + t.length, 0);
  const avgWordLength = words.length > 0 ? (totalChars / words.length).toFixed(2) : 0;
  
  const avgWordsPerSentence = sentences.length > 0 
    ? (words.length / sentences.length).toFixed(2) 
    : 0;
  
  return {
    wordCount: words.length,
    uniqueWords: uniqueWords.size,
    sentenceCount: sentences.length,
    avgWordLength: parseFloat(avgWordLength),
    avgWordsPerSentence: parseFloat(avgWordsPerSentence),
    punctuationCount: tokens.filter(t => t.isPunctuation).length,
    typeTokenRatio: words.length > 0 
      ? (uniqueWords.size / words.length).toFixed(3) 
      : 0
  };
};

/**
 * Berechnet Lesbarkeits-Scores
 * 
 * @param {Object} stats - Statistik-Objekt
 * @param {Array} tokens - Token-Array
 * @returns {Object} Lesbarkeits-Scores
 */
export const calculateReadability = (stats, tokens) => {
  const words = tokens.filter(t => !t.isPunctuation);
  
  // Flesch Reading Ease (adaptiert für Deutsch)
  // Höhere Werte = leichter zu lesen
  const asl = stats.avgWordsPerSentence || 1;
  const asw = stats.avgWordLength || 1;
  const readingEase = Math.max(0, Math.min(100, 
    180 - asl - (58.5 * asw)
  ));
  
  // Wiener Sachtextformel (für Deutsch)
  // Niedrigere Werte = leichter zu lesen
  const ms = countMultiSyllableWords(words);
  const iw = countLongWords(words);
  const es = countMonosyllableWords(words);
  
  const wienerIndex = (
    0.1935 * ms + 
    0.1672 * asl + 
    0.1297 * iw - 
    0.0327 * es - 
    0.875
  ).toFixed(2);
  
  // Lexical Density (Inhaltswörter / Gesamtwörter)
  const contentWords = words.filter(w => isContentWord(w.text));
  const lexicalDensity = words.length > 0 
    ? ((contentWords.length / words.length) * 100).toFixed(2)
    : 0;
  
  return {
    fleschReadingEase: readingEase.toFixed(2),
    wienerSachtextformel: wienerIndex,
    lexicalDensity: parseFloat(lexicalDensity),
    interpretation: interpretReadability(readingEase, wienerIndex)
  };
};

/**
 * Zählt mehrsilbige Wörter
 * @private
 */
const countMultiSyllableWords = (words) => {
  return words.filter(w => {
    const syllables = estimateSyllables(w.text);
    return syllables >= 3;
  }).length;
};

/**
 * Zählt lange Wörter (>6 Zeichen)
 * @private
 */
const countLongWords = (words) => {
  return words.filter(w => w.text.length > 6).length;
};

/**
 * Zählt einsilbige Wörter
 * @private
 */
const countMonosyllableWords = (words) => {
  return words.filter(w => {
    const syllables = estimateSyllables(w.text);
    return syllables === 1;
  }).length;
};

/**
 * Prüft ob Wort ein Inhaltswort ist (vs. Funktionswort)
 * @private
 */
const isContentWord = (word) => {
  const lower = word.toLowerCase();
  const functionWords = [
    // Artikel
    'der', 'die', 'das', 'ein', 'eine', 'einen', 'einem', 'eines',
    // Pronomen
    'ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr', 'mich', 'dich', 'sich',
    // Präpositionen
    'in', 'an', 'auf', 'von', 'zu', 'mit', 'bei', 'nach', 'vor', 'über', 'unter',
    // Konjunktionen
    'und', 'oder', 'aber', 'denn', 'weil', 'dass', 'wenn', 'als',
    // Hilfsverben
    'sein', 'haben', 'werden', 'ist', 'war', 'hat', 'hatte', 'bin', 'sind'
  ];
  
  return !functionWords.includes(lower) && word.length > 2;
};

/**
 * Interpretiert Lesbarkeits-Scores
 * @private
 */
const interpretReadability = (fleschScore, wienerIndex) => {
  let interpretation = '';
  
  if (fleschScore >= 80) {
    interpretation = 'Sehr leicht zu lesen';
  } else if (fleschScore >= 60) {
    interpretation = 'Leicht zu lesen';
  } else if (fleschScore >= 40) {
    interpretation = 'Mittelschwer';
  } else if (fleschScore >= 20) {
    interpretation = 'Schwer zu lesen';
  } else {
    interpretation = 'Sehr schwer zu lesen';
  }
  
  if (wienerIndex < 4) {
    interpretation += ' (Grundschulniveau)';
  } else if (wienerIndex < 10) {
    interpretation += ' (Mittelstufe)';
  } else if (wienerIndex < 15) {
    interpretation += ' (Oberstufe)';
  } else {
    interpretation += ' (Akademisch)';
  }
  
  return interpretation;
};

/**
 * Validiert Input-Text
 * 
 * @param {string} text - Zu validierender Text
 * @returns {Object} Validierungs-Ergebnis
 */
export const validateText = (text) => {
  if (!text) {
    return { valid: false, error: 'Kein Text vorhanden' };
  }
  
  if (typeof text !== 'string') {
    return { valid: false, error: 'Text muss ein String sein' };
  }
  
  // Normalisiere UTF-8
  const normalized = normalizeUTF8(text);
  const trimmed = normalized.trim();
  
  if (trimmed.length < ANALYSIS_CONFIG.TEXT.MIN_LENGTH) {
    return { 
      valid: false, 
      error: `Text zu kurz (min. ${ANALYSIS_CONFIG.TEXT.MIN_LENGTH} Zeichen)` 
    };
  }
  
  if (trimmed.length > ANALYSIS_CONFIG.TEXT.MAX_LENGTH) {
    return { 
      valid: false, 
      error: `Text zu lang (max. ${ANALYSIS_CONFIG.TEXT.MAX_LENGTH} Zeichen)` 
    };
  }
  
  return { valid: true, text: trimmed };
};

/**
 * Bereitet Text für Modell-Input vor
 * Hauptfunktion für Text-Preprocessing
 * 
 * @param {string} text - Input Text
 * @returns {Object} Vorbereitete Text-Daten
 */
export const prepareForModel = (text) => {
  // Normalisiere UTF-8
  const normalized = normalizeUTF8(text);
  
  // Tokenisierung
  const tokens = tokenizeText(normalized);
  
  // Satzsegmentierung
  const sentences = sentenceSegmentation(normalized);
  
  // Statistiken
  const statistics = calculateStatistics(tokens, sentences);
  
  // Lesbarkeit
  const readability = calculateReadability(statistics, tokens);
  
  return {
    normalized,
    tokens,
    sentences,
    statistics,
    readability
  };
};

/**
 * Bereinigt Text von überflüssigen Zeichen
 * 
 * @param {string} text - Input Text
 * @returns {string} Bereinigter Text
 */
export const cleanText = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  let cleaned = normalizeUTF8(text);
  
  // Entferne mehrfache Leerzeichen
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  // Entferne Leerzeichen vor Interpunktion
  cleaned = cleaned.replace(/\s+([.,!?;:])/g, '$1');
  
  // Füge Leerzeichen nach Interpunktion hinzu
  cleaned = cleaned.replace(/([.,!?;:])([^\s])/g, '$1 $2');
  
  return cleaned.trim();
};

/**
 * Extrahiert Wörter aus Text
 * 
 * @param {string} text - Input Text
 * @returns {Array} Array von Wörtern
 */
export const extractWords = (text) => {
  const tokens = tokenizeText(text);
  return tokens
    .filter(t => !t.isPunctuation)
    .map(t => t.text);
};

/**
 * Zählt Wort-Frequenzen
 * 
 * @param {Array} words - Wort-Array
 * @returns {Map} Frequenz-Map
 */
export const countWordFrequencies = (words) => {
  const frequencies = new Map();
  
  for (const word of words) {
    const lower = word.toLowerCase();
    frequencies.set(lower, (frequencies.get(lower) || 0) + 1);
  }
  
  return frequencies;
};

export default {
  normalizeUTF8,
  tokenizeText,
  sentenceSegmentation,
  detectVerses,
  estimateSyllables,
  calculateStatistics,
  calculateReadability,
  validateText,
  prepareForModel,
  cleanText,
  extractWords,
  countWordFrequencies
};