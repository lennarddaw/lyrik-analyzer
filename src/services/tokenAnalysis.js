import { getModel } from './modelLoader';
import { POS_TAGS } from '../utils/constants';

/**
 * Analysiert Token-Level Features (POS-Tagging, NER)
 * @param {string} text - Input Text
 * @param {Array} tokens - Token-Array
 * @returns {Promise<Array>} Annotierte Tokens
 */
export const analyzeTokens = async (text, tokens) => {
  try {
    const model = getModel('NER');
    if (!model) {
      console.warn('NER Model nicht geladen, verwende Fallback');
      return fallbackTokenAnalysis(tokens);
    }

    // Führe NER aus
    const nerResults = await model(text);
    
    // Mappe NER-Results zu Tokens
    const annotatedTokens = mapNERToTokens(tokens, nerResults);
    
    // Ergänze mit regelbasierten Features
    return enrichTokens(annotatedTokens);
  } catch (error) {
    console.error('Token-Analyse Fehler:', error);
    return fallbackTokenAnalysis(tokens);
  }
};

/**
 * Mappt NER-Results zu Token-Objekten
 * @private
 */
const mapNERToTokens = (tokens, nerResults) => {
  const annotated = tokens.map(token => ({
    ...token,
    entity: null,
    entityType: null,
    posTag: null
  }));

  nerResults.forEach(entity => {
    // Finde matching tokens für diese Entity
    annotated.forEach(token => {
      if (token.text.toLowerCase() === entity.word.toLowerCase()) {
        token.entity = entity.entity;
        token.entityType = mapEntityType(entity.entity);
        token.entityScore = entity.score;
      }
    });
  });

  return annotated;
};

/**
 * Mappt Entity-Labels zu lesbaren deutschen Labels
 * @private
 */
const mapEntityType = (entity) => {
  const typeMap = {
    'PER': 'Person',
    'LOC': 'Ort',
    'ORG': 'Organisation',
    'MISC': 'Sonstiges'
  };

  const type = entity.split('-').pop();
  return typeMap[type] || 'Unbekannt';
};

/**
 * Reichert Tokens mit zusätzlichen linguistischen Features an
 * @private
 */
const enrichTokens = (tokens) => {
  return tokens.map((token, index) => {
    if (token.isPunctuation) {
      return {
        ...token,
        posTag: 'PUNCT',
        wordType: POS_TAGS.PUNCT
      };
    }

    // Regelbasiertes POS-Tagging (vereinfacht für Deutsch)
    const posTag = inferPOSTag(token.text, tokens, index);
    
    return {
      ...token,
      posTag: posTag.tag,
      wordType: posTag.info,
      morphology: analyzeMorphology(token.text),
      wordClass: classifyWord(token.text)
    };
  });
};

/**
 * Inferiert POS-Tag basierend auf Regeln
 * @private
 */
const inferPOSTag = (word, tokens, index) => {
  // Artikel
  if (/^(der|die|das|dem|den|des|ein|eine|einer|einem|eines)$/i.test(word)) {
    return { tag: 'DET', info: POS_TAGS.DET };
  }

  // Pronomen
  if (/^(ich|du|er|sie|es|wir|ihr|mich|dich|mir|dir|ihm|uns|euch)$/i.test(word)) {
    return { tag: 'PRON', info: POS_TAGS.PRON };
  }

  // Präpositionen
  if (/^(in|an|auf|über|unter|vor|hinter|neben|zwischen|durch|für|gegen|ohne|um|mit|nach|von|zu|bei)$/i.test(word)) {
    return { tag: 'ADP', info: POS_TAGS.ADP };
  }

  // Konjunktionen
  if (/^(und|oder|aber|denn|sondern|sowie|doch|jedoch|weil|dass|wenn|als|ob|obwohl)$/i.test(word)) {
    return { tag: 'CONJ', info: POS_TAGS.CONJ };
  }

  // Unicode-friendly + longer endings first to reduce backtracking
  if (/^(?:ge\p{L}+|be\p{L}+|ver\p{L}+|er\p{L}+|\p{L}+(?:en|test|tet|te|st|t))$/iu.test(word)) {
    return { tag: 'VERB', info: POS_TAGS.VERB };
  }


  // Adjektive (häufige Endungen)
  if (/\w+(lich|bar|sam|haft|los|ig|isch|iv)$/i.test(word)) {
    return { tag: 'ADJ', info: POS_TAGS.ADJ };
  }

  // Adverbien
  if (/\w+(weise|wärts|hin|her)$/i.test(word) || /^(sehr|ganz|recht|ziemlich|fast|kaum|oft|selten|immer|nie|heute|gestern|morgen|hier|dort|da|so|wie)$/i.test(word)) {
    return { tag: 'ADV', info: POS_TAGS.ADV };
  }

  // Großgeschriebene Wörter (außer Satzanfang) sind wahrscheinlich Nomen
  if (/^[A-ZÄÖÜ]/.test(word) && index > 0 && !tokens[index - 1].isPunctuation) {
    return { tag: 'NOUN', info: POS_TAGS.NOUN };
  }

  // Default: Nomen wenn groß geschrieben
  if (/^[A-ZÄÖÜ]/.test(word)) {
    return { tag: 'NOUN', info: POS_TAGS.NOUN };
  }

  // Sonst: OTHER
  return { tag: 'OTHER', info: POS_TAGS.OTHER };
};

/**
 * Analysiert Morphologie eines Wortes
 * @private
 */
const analyzeMorphology = (word) => {
  const analysis = {
    length: word.length,
    syllables: estimateSyllables(word),
    hasPrefix: false,
    hasSuffix: false,
    prefix: null,
    suffix: null,
    stem: word
  };

  // Präfixe
  const prefixes = ['un', 'ge', 'be', 'ver', 'er', 'ent', 'emp', 'miss', 'zer'];
  for (const prefix of prefixes) {
    if (word.toLowerCase().startsWith(prefix) && word.length > prefix.length + 2) {
      analysis.hasPrefix = true;
      analysis.prefix = prefix;
      analysis.stem = word.slice(prefix.length);
      break;
    }
  }

  // Suffixe
  const suffixes = ['ung', 'heit', 'keit', 'schaft', 'lich', 'bar', 'los', 'sam', 'ig', 'isch', 'en', 'er', 'st'];
  for (const suffix of suffixes) {
    if (word.toLowerCase().endsWith(suffix) && word.length > suffix.length + 2) {
      analysis.hasSuffix = true;
      analysis.suffix = suffix;
      if (!analysis.hasPrefix) {
        analysis.stem = word.slice(0, -suffix.length);
      }
      break;
    }
  }

  return analysis;
};

/**
 * Schätzt Silbenanzahl
 * @private
 */
const estimateSyllables = (word) => {
  const vowelGroups = word.toLowerCase().match(/[aeiouäöüy]+/g);
  return vowelGroups ? vowelGroups.length : 1;
};

/**
 * Klassifiziert Wort nach Typ
 * @private
 */
const classifyWord = (word) => {
  return {
    isCapitalized: /^[A-ZÄÖÜ]/.test(word),
    isAllCaps: word === word.toUpperCase() && word.length > 1,
    hasNumbers: /\d/.test(word),
    hasSpecialChars: /[^a-zA-ZäöüßÄÖÜ0-9]/.test(word),
    length: word.length,
    complexity: calculateWordComplexity(word)
  };
};

/**
 * Berechnet Wort-Komplexität
 * @private
 */
const calculateWordComplexity = (word) => {
  let complexity = 0;
  
  // Länge
  complexity += Math.min(word.length / 10, 1) * 30;
  
  // Silben
  const syllables = estimateSyllables(word);
  complexity += Math.min(syllables / 5, 1) * 30;
  
  // Ungewöhnliche Buchstaben
  const uncommon = (word.match(/[qxyäöüß]/gi) || []).length;
  complexity += Math.min(uncommon / 3, 1) * 20;
  
  // Konsonanten-Cluster
  const clusters = (word.match(/[bcdfghjklmnpqrstvwxyz]{3,}/gi) || []).length;
  complexity += Math.min(clusters / 2, 1) * 20;
  
  return Math.round(complexity);
};

/**
 * Fallback Token-Analyse ohne ML-Model
 * @private
 */
const fallbackTokenAnalysis = (tokens) => {
  return enrichTokens(tokens.map(token => ({
    ...token,
    entity: null,
    entityType: null,
    posTag: null
  })));
};

/**
 * Findet zusammengesetzte Wörter (Komposita)
 * @param {Array} tokens - Token-Array
 * @returns {Array} Array von Komposita
 */
export const findCompoundWords = (tokens) => {
  const compounds = [];
  
  tokens.forEach(token => {
    if (token.isPunctuation || token.text.length < 8) return;
    
    // Sehr lange Wörter sind wahrscheinlich Komposita
    if (token.text.length > 12) {
      compounds.push({
        word: token.text,
        position: token.position,
        length: token.text.length,
        isCompound: true,
        complexity: calculateWordComplexity(token.text)
      });
    }
  });
  
  return compounds;
};

/**
 * Analysiert Wort-Frequenzen
 * @param {Array} tokens - Token-Array
 * @returns {Object} Frequenz-Map
 */
export const analyzeWordFrequencies = (tokens) => {
  const frequencies = {};
  
  tokens
    .filter(t => !t.isPunctuation && t.text.length > 2)
    .forEach(token => {
      const word = token.text.toLowerCase();
      if (!frequencies[word]) {
        frequencies[word] = {
          count: 0,
          positions: [],
          firstOccurrence: token.position
        };
      }
      frequencies[word].count++;
      frequencies[word].positions.push(token.position);
    });
  
  // Sortiere nach Häufigkeit
  return Object.entries(frequencies)
    .sort((a, b) => b[1].count - a[1].count)
    .reduce((acc, [word, data]) => {
      acc[word] = data;
      return acc;
    }, {});
};

/**
 * Findet seltene/einzigartige Wörter
 * @param {Object} frequencies - Frequenz-Map
 * @returns {Array} Array von seltenen Wörtern
 */
export const findRareWords = (frequencies) => {
  return Object.entries(frequencies)
    .filter(([word, data]) => data.count === 1 && word.length > 4)
    .map(([word, data]) => ({
      word,
      position: data.firstOccurrence
    }));
};