import { sentenceSegmentation, findRhymes, detectAlliterations } from '../utils/textPreprocessing';

/**
 * Führt vollständige Syntax-Analyse durch
 * @param {string} text - Input Text
 * @param {Array} tokens - Token-Array
 * @returns {Object} Syntax-Analyse Ergebnis
 */
export const analyzeSyntax = (text, tokens) => {
  const sentences = sentenceSegmentation(text);
  const verses = detectVerseStructure(text);
  
  return {
    sentenceStructure: analyzeSentenceStructure(sentences, tokens),
    verseStructure: verses,
    rhymeScheme: verses.length > 0 ? analyzeRhymeScheme(verses) : null,
    alliterations: detectAlliterations(tokens),
    repetitions: findRepetitions(tokens),
    parallelism: detectParallelism(sentences),
    punctuationPattern: analyzePunctuation(tokens)
  };
};

/**
 * Analysiert Satzstruktur
 * @private
 */
const analyzeSentenceStructure = (sentences, tokens) => {
  return sentences.map(sentence => {
    const sentenceTokens = extractSentenceTokens(sentence, tokens);
    
    return {
      ...sentence,
      tokenCount: sentenceTokens.length,
      wordCount: sentenceTokens.filter(t => !t.isPunctuation).length,
      avgWordLength: calculateAvgWordLength(sentenceTokens),
      complexity: calculateSentenceComplexity(sentenceTokens),
      structure: detectSentenceType(sentence.text)
    };
  });
};

/**
 * Extrahiert Tokens für einen Satz
 * @private
 */
const extractSentenceTokens = (sentence, tokens) => {
  // Vereinfachte Extraktion basierend auf Text-Matching
  const sentenceWords = sentence.text.trim().split(/\s+/);
  return tokens.filter(token => 
    sentenceWords.some(word => word.includes(token.text))
  );
};

/**
 * Berechnet durchschnittliche Wortlänge
 * @private
 */
const calculateAvgWordLength = (tokens) => {
  const words = tokens.filter(t => !t.isPunctuation);
  if (words.length === 0) return 0;
  
  const totalLength = words.reduce((sum, token) => sum + token.text.length, 0);
  return (totalLength / words.length).toFixed(2);
};

/**
 * Berechnet Satz-Komplexität
 * @private
 */
const calculateSentenceComplexity = (tokens) => {
  let complexity = 0;
  
  // Länge
  const wordCount = tokens.filter(t => !t.isPunctuation).length;
  complexity += Math.min(wordCount / 20, 1) * 30;
  
  // Durchschnittliche Wortlänge
  const avgLength = parseFloat(calculateAvgWordLength(tokens));
  complexity += Math.min(avgLength / 10, 1) * 30;
  
  // Interpunktion (Kommas = Nebensätze)
  const commas = tokens.filter(t => t.text === ',').length;
  complexity += Math.min(commas / 3, 1) * 20;
  
  // Großgeschriebene Wörter (Namen, etc.)
  const capitalized = tokens.filter(t => !t.isPunctuation && /^[A-ZÄÖÜ]/.test(t.text)).length;
  complexity += Math.min(capitalized / wordCount, 1) * 20;
  
  return Math.round(complexity);
};

/**
 * Erkennt Satztyp
 * @private
 */
const detectSentenceType = (text) => {
  const trimmed = text.trim();
  
  if (trimmed.endsWith('?')) return { type: 'Frage', symbol: '?' };
  if (trimmed.endsWith('!')) return { type: 'Ausruf', symbol: '!' };
  if (trimmed.includes(',')) return { type: 'Komplex', symbol: ',' };
  return { type: 'Aussage', symbol: '.' };
};

/**
 * Erkennt Vers-Struktur
 * @private
 */
const detectVerseStructure = (text) => {
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  
  if (lines.length < 2) {
    return []; // Kein Gedicht
  }
  
  return lines.map((line, index) => ({
    text: line.trim(),
    index,
    wordCount: line.trim().split(/\s+/).length,
    syllables: estimateSyllables(line),
    endsWithPunctuation: /[.!?,;:]$/.test(line.trim()),
    lastWord: extractLastWord(line)
  }));
};

/**
 * Schätzt Silben in einer Zeile
 * @private
 */
const estimateSyllables = (text) => {
  const words = text.toLowerCase().split(/\s+/);
  let syllableCount = 0;
  
  words.forEach(word => {
    const vowelGroups = word.match(/[aeiouäöüy]+/g);
    syllableCount += vowelGroups ? vowelGroups.length : 0;
  });
  
  return syllableCount;
};

/**
 * Extrahiert letztes Wort einer Zeile
 * @private
 */
const extractLastWord = (line) => {
  const words = line.trim().replace(/[.,!?;:]$/, '').split(/\s+/);
  return words[words.length - 1].toLowerCase();
};

/**
 * Analysiert Reimschema
 * @private
 */
const analyzeRhymeScheme = (verses) => {
  const rhymePairs = findRhymes(verses);
  const rhymePattern = determineRhymePattern(verses, rhymePairs);
  
  return {
    pairs: rhymePairs,
    pattern: rhymePattern,
    scheme: rhymePattern.scheme,
    description: describeRhymeScheme(rhymePattern.scheme)
  };
};

/**
 * Bestimmt Reim-Muster
 * @private
 */
const determineRhymePattern = (verses, rhymePairs) => {
  const scheme = new Array(verses.length).fill(null);
  let currentLetter = 'A';
  
  // Weise Buchstaben zu basierend auf Reimpaaren
  rhymePairs.forEach(pair => {
    if (scheme[pair.verse1] === null && scheme[pair.verse2] === null) {
      scheme[pair.verse1] = currentLetter;
      scheme[pair.verse2] = currentLetter;
      currentLetter = String.fromCharCode(currentLetter.charCodeAt(0) + 1);
    } else if (scheme[pair.verse1] !== null) {
      scheme[pair.verse2] = scheme[pair.verse1];
    } else if (scheme[pair.verse2] !== null) {
      scheme[pair.verse1] = scheme[pair.verse2];
    }
  });
  
  // Fülle fehlende Verse mit neuen Buchstaben
  scheme.forEach((letter, index) => {
    if (letter === null) {
      scheme[index] = currentLetter;
      currentLetter = String.fromCharCode(currentLetter.charCodeAt(0) + 1);
    }
  });
  
  return {
    scheme: scheme.join(''),
    verses: scheme
  };
};

/**
 * Beschreibt Reimschema
 * @private
 */
const describeRhymeScheme = (scheme) => {
  const patterns = {
    'AABB': 'Paarreim',
    'ABAB': 'Kreuzreim',
    'ABBA': 'Umarmender Reim',
    'AAAA': 'Durchgehender Reim',
    'ABCD': 'Kein Reimschema'
  };
  
  // Prüfe auf bekannte Muster (erste 4 Verse)
  const first4 = scheme.slice(0, 4);
  return patterns[first4] || 'Freies Reimschema';
};

/**
 * Findet Wiederholungen
 * @private
 */
const findRepetitions = (tokens) => {
  const wordMap = new Map();
  
  tokens
    .filter(t => !t.isPunctuation && t.text.length > 3)
    .forEach(token => {
      const word = token.text.toLowerCase();
      if (!wordMap.has(word)) {
        wordMap.set(word, []);
      }
      wordMap.get(word).push(token.position);
    });
  
  // Nur Wörter die wiederholt werden
  const repetitions = [];
  wordMap.forEach((positions, word) => {
    if (positions.length > 1) {
      repetitions.push({
        word,
        count: positions.length,
        positions,
        isAnaphora: checkAnaphora(positions, tokens),
        isEpiphora: checkEpiphora(positions, tokens)
      });
    }
  });
  
  return repetitions.sort((a, b) => b.count - a.count);
};

/**
 * Prüft auf Anapher (Wiederholung am Satzanfang)
 * @private
 */
const checkAnaphora = (positions, tokens) => {
  // Vereinfachte Prüfung: Ist das Wort nahe am Anfang mehrerer Sätze?
  let anfangCount = 0;
  
  positions.forEach(pos => {
    // Prüfe ob es eines der ersten 3 Wörter im Satz ist
    const prevTokens = tokens.slice(Math.max(0, pos - 3), pos);
    const hasSentenceStart = prevTokens.some(t => 
      t.isPunctuation && /[.!?]/.test(t.text)
    );
    if (hasSentenceStart || pos < 3) {
      anfangCount++;
    }
  });
  
  return anfangCount >= 2;
};

/**
 * Prüft auf Epipher (Wiederholung am Satzende)
 * @private
 */
const checkEpiphora = (positions, tokens) => {
  let endeCount = 0;
  
  positions.forEach(pos => {
    // Prüfe ob nächstes Token ein Satzende ist
    const nextToken = tokens[pos + 1];
    if (nextToken && nextToken.isPunctuation && /[.!?]/.test(nextToken.text)) {
      endeCount++;
    }
  });
  
  return endeCount >= 2;
};

/**
 * Erkennt Parallelismen
 * @private
 */
const detectParallelism = (sentences) => {
  const parallelisms = [];
  
  for (let i = 0; i < sentences.length - 1; i++) {
    for (let j = i + 1; j < sentences.length; j++) {
      const similarity = calculateStructuralSimilarity(
        sentences[i].text,
        sentences[j].text
      );
      
      if (similarity > 0.6) {
        parallelisms.push({
          sentence1: i,
          sentence2: j,
          similarity,
          text1: sentences[i].text.slice(0, 50) + '...',
          text2: sentences[j].text.slice(0, 50) + '...'
        });
      }
    }
  }
  
  return parallelisms;
};

/**
 * Berechnet strukturelle Ähnlichkeit zwischen Sätzen
 * @private
 */
const calculateStructuralSimilarity = (text1, text2) => {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  
  // Längenähnlichkeit
  const lengthSimilarity = 1 - Math.abs(words1.length - words2.length) / Math.max(words1.length, words2.length);
  
  // Wortähnlichkeit (Jaccard)
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  const jaccardSimilarity = intersection.size / union.size;
  
  // Kombinierte Ähnlichkeit
  return (lengthSimilarity * 0.3 + jaccardSimilarity * 0.7);
};

/**
 * Analysiert Interpunktions-Muster
 * @private
 */
const analyzePunctuation = (tokens) => {
  const punctuation = tokens.filter(t => t.isPunctuation);
  
  const counts = {
    '.': 0,
    ',': 0,
    '!': 0,
    '?': 0,
    ':': 0,
    ';': 0,
    '-': 0,
    '—': 0,
    '...': 0
  };
  
  punctuation.forEach(token => {
    if (counts.hasOwnProperty(token.text)) {
      counts[token.text]++;
    }
  });
  
  const total = punctuation.length;
  
  return {
    total,
    counts,
    distribution: {
      period: ((counts['.'] / total) * 100).toFixed(1),
      comma: ((counts[','] / total) * 100).toFixed(1),
      exclamation: ((counts['!'] / total) * 100).toFixed(1),
      question: ((counts['?'] / total) * 100).toFixed(1)
    },
    style: determinePunctuationStyle(counts, total)
  };
};

/**
 * Bestimmt Interpunktions-Stil
 * @private
 */
const determinePunctuationStyle = (counts, total) => {
  const exclamationRatio = counts['!'] / total;
  const questionRatio = counts['?'] / total;
  const commaRatio = counts[','] / total;
  
  if (exclamationRatio > 0.3) return 'Expressiv';
  if (questionRatio > 0.3) return 'Fragend';
  if (commaRatio > 0.5) return 'Komplex';
  return 'Neutral';
};