import { getModel } from './modelLoader';
import { UNIVERSAL_POS_TAGS, ENTITY_LABELS, MORPHOLOGICAL_FEATURES, ANALYSIS_CONFIG } from '../utils/constants';

/**
 * Analysiert Token-Level Features (POS-Tagging, NER, Morphologie)
 * Vollständig modellbasiert, keine Heuristiken
 * 
 * @param {string} text - Input Text
 * @param {Array} tokens - Token-Array aus Preprocessing
 * @returns {Promise<Array>} Annotierte Tokens mit allen Features
 */
export const analyzeTokens = async (text, tokens) => {
  try {
    // Initialisiere Ergebnis-Array
    let annotatedTokens = tokens.map(token => ({
      ...token,
      entity: null,
      entityType: null,
      entityScore: null,
      posTag: null,
      posScore: null,
      morphology: null,
      lemma: null
    }));

    // 1. Named Entity Recognition
    const nerModel = getModel('NER');
    if (nerModel) {
      annotatedTokens = await applyNER(text, annotatedTokens, nerModel);
    }

    // 2. Part-of-Speech Tagging
    const posModel = getModel('POS');
    if (posModel) {
      annotatedTokens = await applyPOSTagging(text, annotatedTokens, posModel);
    } else {
      // Fallback: Verwende NER-Modell auch für POS wenn verfügbar
      if (nerModel) {
        console.log('POS-Model nicht geladen, verwende NER-Model für Token-Classification');
        annotatedTokens = await applyPOSTagging(text, annotatedTokens, nerModel);
      }
    }

    // 3. Morphologische Analyse
    const morphModel = getModel('MORPHOLOGY');
    if (morphModel) {
      annotatedTokens = await applyMorphology(text, annotatedTokens, morphModel);
    }

    // 4. Berechne abgeleitete Features (ohne Heuristiken, nur aus Modell-Outputs)
    annotatedTokens = enrichTokensWithDerivedFeatures(annotatedTokens);

    return annotatedTokens;
  } catch (error) {
    console.error('Token-Analyse Fehler:', error);
    // Gib Tokens ohne Annotation zurück statt zu failen
    return tokens.map(token => ({
      ...token,
      entity: null,
      entityType: null,
      posTag: null,
      morphology: null,
      error: error.message
    }));
  }
};

/**
 * Wendet Named Entity Recognition an
 * @private
 */
const applyNER = async (text, tokens, model) => {
  try {
    const results = await model(text, {
      aggregation_strategy: 'simple' // Gruppiere Sub-Token zu ganzen Wörtern
    });

    // Mappe NER-Ergebnisse zu Tokens
    const annotated = [...tokens];
    
    for (const entity of results) {
      const entityWord = entity.word.replace(/^##/, '').trim(); // Entferne BERT-Subtoken-Marker
      
      // Finde passende Tokens
      for (let i = 0; i < annotated.length; i++) {
        const token = annotated[i];
        
        // Überspringe Interpunktion
        if (token.isPunctuation) continue;
        
        // Exakte Übereinstimmung oder Teilübereinstimmung
        const tokenText = token.text.toLowerCase();
        const entityText = entityWord.toLowerCase();
        
        if (tokenText === entityText || 
            tokenText.includes(entityText) || 
            entityText.includes(tokenText)) {
          
          annotated[i] = {
            ...token,
            entity: entity.entity_group || entity.entity,
            entityType: normalizeEntityType(entity.entity_group || entity.entity),
            entityScore: entity.score,
            entityStart: entity.start,
            entityEnd: entity.end
          };
        }
      }
    }

    return annotated;
  } catch (error) {
    console.error('NER Fehler:', error);
    return tokens;
  }
};

/**
 * Wendet Part-of-Speech Tagging an
 * @private
 */
const applyPOSTagging = async (text, tokens, model) => {
  try {
    // Verwende Token-Classification für POS-Tagging
    const results = await model(text, {
      aggregation_strategy: 'simple'
    });

    const annotated = [...tokens];
    
    for (const posResult of results) {
      const word = posResult.word.replace(/^##/, '').trim();
      
      // Finde passende Tokens
      for (let i = 0; i < annotated.length; i++) {
        const token = annotated[i];
        
        if (token.isPunctuation) {
          // Interpunktion immer als PUNCT taggen
          annotated[i] = {
            ...token,
            posTag: 'PUNCT',
            posScore: 1.0,
            posInfo: UNIVERSAL_POS_TAGS.PUNCT
          };
          continue;
        }
        
        const tokenText = token.text.toLowerCase();
        const posText = word.toLowerCase();
        
        if (tokenText === posText || 
            tokenText.includes(posText) || 
            posText.includes(tokenText)) {
          
          // Extrahiere POS-Tag aus Entity-Label (bei NER-Modellen)
          // oder verwende direkt wenn POS-spezifisches Modell
          const posTag = extractPOSTag(posResult.entity_group || posResult.entity);
          
          annotated[i] = {
            ...token,
            posTag,
            posScore: posResult.score,
            posInfo: UNIVERSAL_POS_TAGS[posTag] || UNIVERSAL_POS_TAGS.X
          };
        }
      }
    }

    return annotated;
  } catch (error) {
    console.error('POS-Tagging Fehler:', error);
    return tokens;
  }
};

/**
 * Wendet morphologische Analyse an
 * @private
 */
const applyMorphology = async (text, tokens, model) => {
  try {
    const results = await model(text, {
      aggregation_strategy: 'simple'
    });

    const annotated = [...tokens];
    
    for (const morphResult of results) {
      const word = morphResult.word.replace(/^##/, '').trim();
      
      for (let i = 0; i < annotated.length; i++) {
        const token = annotated[i];
        if (token.isPunctuation) continue;
        
        const tokenText = token.text.toLowerCase();
        const morphText = word.toLowerCase();
        
        if (tokenText === morphText) {
          const morphFeatures = parseMorphologicalFeatures(morphResult.entity_group || morphResult.entity);
          
          annotated[i] = {
            ...token,
            morphology: {
              features: morphFeatures,
              score: morphResult.score,
              raw: morphResult.entity_group || morphResult.entity
            }
          };
        }
      }
    }

    return annotated;
  } catch (error) {
    console.error('Morphologie Fehler:', error);
    return tokens;
  }
};

/**
 * Reichert Tokens mit abgeleiteten Features an
 * Basiert nur auf Modell-Outputs, keine Heuristiken
 * @private
 */
const enrichTokensWithDerivedFeatures = (tokens) => {
  return tokens.map(token => {
    if (token.isPunctuation) {
      return token;
    }

    // Wortklassen-Features aus POS-Tag ableiten
    const wordClass = deriveWordClass(token);
    
    // Linguistische Features aus Morphologie ableiten
    const linguisticFeatures = deriveLinguisticFeatures(token);

    return {
      ...token,
      wordClass,
      linguisticFeatures
    };
  });
};

/**
 * Leitet Wortklasse aus POS-Tag ab
 * @private
 */
const deriveWordClass = (token) => {
  if (!token.posTag) return null;
  
  const isContentWord = ['NOUN', 'VERB', 'ADJ', 'ADV'].includes(token.posTag);
  const isFunctionWord = ['DET', 'ADP', 'CCONJ', 'SCONJ', 'PRON', 'AUX', 'PART'].includes(token.posTag);
  
  return {
    type: isContentWord ? 'content' : isFunctionWord ? 'function' : 'other',
    isContentWord,
    isFunctionWord,
    category: token.posInfo?.label || 'unknown',
    description: token.posInfo?.description || ''
  };
};

/**
 * Leitet linguistische Features ab
 * @private
 */
const deriveLinguisticFeatures = (token) => {
  const features = {
    length: token.text.length,
    isCapitalized: /^[\p{Lu}]/u.test(token.text),
    isAllCaps: token.text === token.text.toUpperCase() && token.text.length > 1,
    hasDigits: /\d/.test(token.text),
    hasHyphen: token.text.includes('-'),
  };

  // Morphologische Features wenn verfügbar
  if (token.morphology?.features) {
    features.morphological = token.morphology.features;
  }

  return features;
};

/**
 * Normalisiert Entity-Types zu einheitlichem Format
 * @private
 */
const normalizeEntityType = (entityLabel) => {
  if (!entityLabel) return null;
  
  // Entferne B- und I- Präfixe (BIO-Tagging)
  const cleanLabel = entityLabel.replace(/^[BI]-/, '');
  
  // Mappe zu ENTITY_LABELS
  const mapping = {
    'PER': 'PER',
    'PERSON': 'PER',
    'LOC': 'LOC',
    'LOCATION': 'LOC',
    'ORG': 'ORG',
    'ORGANIZATION': 'ORG',
    'ORGANISATION': 'ORG',
    'MISC': 'MISC',
    'MISCELLANEOUS': 'MISC',
    'DATE': 'DATE',
    'TIME': 'TIME',
    'MONEY': 'MONEY',
    'PERCENT': 'PERCENT'
  };
  
  const normalized = mapping[cleanLabel.toUpperCase()] || cleanLabel;
  return ENTITY_LABELS[normalized]?.label || cleanLabel;
};

/**
 * Extrahiert POS-Tag aus Modell-Output
 * @private
 */
const extractPOSTag = (label) => {
  if (!label) return 'X';
  
  // Entferne BIO-Präfixe
  const cleanLabel = label.replace(/^[BI]-/, '').toUpperCase();
  
  // Direct mapping wenn Universal POS Tag
  if (UNIVERSAL_POS_TAGS[cleanLabel]) {
    return cleanLabel;
  }
  
  // Versuche Mapping von alternativen Labels
  const mapping = {
    'NOUN': 'NOUN',
    'PROPN': 'NOUN', // Proper Noun -> Noun
    'VERB': 'VERB',
    'ADJ': 'ADJ',
    'ADV': 'ADV',
    'PRON': 'PRON',
    'DET': 'DET',
    'ADP': 'ADP',
    'CONJ': 'CCONJ',
    'CCONJ': 'CCONJ',
    'SCONJ': 'SCONJ',
    'NUM': 'NUM',
    'AUX': 'AUX',
    'PART': 'PART',
    'INTJ': 'INTJ',
    'PUNCT': 'PUNCT',
    'SYM': 'X',
    'X': 'X'
  };
  
  return mapping[cleanLabel] || 'X';
};

/**
 * Parsed morphologische Features aus Modell-Output
 * @private
 */
const parseMorphologicalFeatures = (morphLabel) => {
  if (!morphLabel) return {};
  
  const features = {};
  
  // Parse UD-Style Features (z.B. "Case=Nom|Gender=Masc|Number=Sing")
  if (morphLabel.includes('=')) {
    const parts = morphLabel.split('|');
    for (const part of parts) {
      const [key, value] = part.split('=');
      if (key && value) {
        const featureCategory = key.toUpperCase();
        if (MORPHOLOGICAL_FEATURES[featureCategory]) {
          features[key] = MORPHOLOGICAL_FEATURES[featureCategory][value] || value;
        } else {
          features[key] = value;
        }
      }
    }
  }
  
  return features;
};

/**
 * Analysiert Wort-Frequenzen (rein datengetrieben)
 * 
 * @param {Array} tokens - Token-Array
 * @returns {Object} Frequenz-Analyse
 */
export const analyzeWordFrequencies = (tokens) => {
  const wordTokens = tokens.filter(t => !t.isPunctuation);
  const frequencies = new Map();
  
  // Sammle Frequenzen
  for (const token of wordTokens) {
    const word = token.text.toLowerCase();
    
    if (!frequencies.has(word)) {
      frequencies.set(word, {
        word: token.text, // Original-Schreibweise
        count: 0,
        positions: [],
        posTag: token.posTag || null,
        entityType: token.entityType || null,
        firstOccurrence: token.position
      });
    }
    
    const entry = frequencies.get(word);
    entry.count++;
    entry.positions.push(token.position);
  }
  
  // Konvertiere zu sortiertem Array
  const sortedFrequencies = Array.from(frequencies.values())
    .sort((a, b) => b.count - a.count);
  
  // Berechne Statistiken
  const totalWords = wordTokens.length;
  const uniqueWords = frequencies.size;
  const lexicalDiversity = uniqueWords / totalWords;
  
  return {
    frequencies: sortedFrequencies,
    totalWords,
    uniqueWords,
    lexicalDiversity: lexicalDiversity.toFixed(3),
    mostFrequent: sortedFrequencies.slice(0, 10),
    hapaxLegomena: sortedFrequencies.filter(f => f.count === 1).length, // Wörter die nur 1x vorkommen
    statistics: {
      mean: totalWords / uniqueWords,
      median: calculateMedian(sortedFrequencies.map(f => f.count))
    }
  };
};

/**
 * Findet zusammengesetzte Wörter (Komposita)
 * Basiert auf NER und POS-Patterns
 * 
 * @param {Array} tokens - Token-Array
 * @returns {Array} Array von Komposita
 */
export const findCompoundWords = (tokens) => {
  const compounds = [];
  
  // Methode 1: Lange Wörter (typisch für deutsche Komposita)
  for (const token of tokens) {
    if (token.isPunctuation) continue;
    
    if (token.text.length >= 12) {
      compounds.push({
        word: token.text,
        position: token.position,
        length: token.text.length,
        type: 'long-word',
        posTag: token.posTag,
        entityType: token.entityType
      });
    }
  }
  
  // Methode 2: Aufeinanderfolgende Nomen (Nomen-Komposita)
  for (let i = 0; i < tokens.length - 1; i++) {
    const current = tokens[i];
    const next = tokens[i + 1];
    
    if (current.posTag === 'NOUN' && next.posTag === 'NOUN' && !next.isPunctuation) {
      compounds.push({
        word: `${current.text} ${next.text}`,
        components: [current.text, next.text],
        position: current.position,
        type: 'noun-compound',
        posTag: 'NOUN'
      });
    }
  }
  
  return compounds;
};

/**
 * Findet seltene/interessante Wörter
 * 
 * @param {Object} frequencyAnalysis - Ergebnis von analyzeWordFrequencies
 * @returns {Array} Array von seltenen Wörtern
 */
export const findRareWords = (frequencyAnalysis) => {
  if (!frequencyAnalysis || !frequencyAnalysis.frequencies) {
    return [];
  }
  
  return frequencyAnalysis.frequencies
    .filter(f => 
      f.count === 1 && // Hapax Legomena
      f.word.length > 4 && // Mindestlänge
      f.posTag && ['NOUN', 'VERB', 'ADJ'].includes(f.posTag) // Content words
    )
    .map(f => ({
      word: f.word,
      position: f.firstOccurrence,
      posTag: f.posTag,
      entityType: f.entityType
    }));
};

/**
 * Analysiert Token-Diversität nach Wortarten
 * 
 * @param {Array} tokens - Token-Array
 * @returns {Object} Diversitäts-Analyse
 */
export const analyzeTokenDiversity = (tokens) => {
  const wordTokens = tokens.filter(t => !t.isPunctuation);
  const posDistribution = {};
  const entityDistribution = {};
  
  for (const token of wordTokens) {
    // POS-Verteilung
    if (token.posTag) {
      posDistribution[token.posTag] = (posDistribution[token.posTag] || 0) + 1;
    }
    
    // Entity-Verteilung
    if (token.entityType) {
      entityDistribution[token.entityType] = (entityDistribution[token.entityType] || 0) + 1;
    }
  }
  
  const total = wordTokens.length;
  
  return {
    posDistribution: Object.entries(posDistribution).map(([tag, count]) => ({
      tag,
      count,
      percentage: ((count / total) * 100).toFixed(1),
      label: UNIVERSAL_POS_TAGS[tag]?.label || tag
    })).sort((a, b) => b.count - a.count),
    
    entityDistribution: Object.entries(entityDistribution).map(([type, count]) => ({
      type,
      count,
      percentage: ((count / total) * 100).toFixed(1)
    })).sort((a, b) => b.count - a.count),
    
    contentWordRatio: (wordTokens.filter(t => 
      ['NOUN', 'VERB', 'ADJ', 'ADV'].includes(t.posTag)
    ).length / total).toFixed(3),
    
    namedEntityRatio: (wordTokens.filter(t => t.entityType).length / total).toFixed(3)
  };
};

/**
 * Hilfsfunktion: Berechnet Median
 * @private
 */
const calculateMedian = (numbers) => {
  if (numbers.length === 0) return 0;
  
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
};

export default {
  analyzeTokens,
  analyzeWordFrequencies,
  findCompoundWords,
  findRareWords,
  analyzeTokenDiversity
};