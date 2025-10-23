import { getModel } from './modelLoader';
import { UNIVERSAL_POS_TAGS, ENTITY_LABELS, MORPHOLOGICAL_FEATURES, ANALYSIS_CONFIG, GERMAN_POS_RULES, FEATURES } from '../utils/constants';

/**
 * Analysiert Token-Level Features (POS-Tagging, NER, Morphologie)
 * Mit regelbasiertem Fallback für Deutsch
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

    // 1. Named Entity Recognition (mit strengem Confidence-Threshold)
    const nerModel = getModel('NER');
    if (nerModel) {
      annotatedTokens = await applyNER(text, annotatedTokens, nerModel);
    }

    // 2. Part-of-Speech Tagging
    const posModel = getModel('POS');
    if (posModel) {
      // Verwende echtes POS-Modell
      annotatedTokens = await applyPOSTagging(text, annotatedTokens, posModel);
    } else if (FEATURES.RULE_BASED_POS) {
      // Fallback auf regelbasiertes POS für Deutsch
      console.log('⚙️ Verwende regelbasiertes POS-Tagging für Deutsch');
      annotatedTokens = applyRuleBasedPOS(annotatedTokens);
    }

    // 3. Morphologische Analyse (regelbasiert für Deutsch)
    if (FEATURES.MORPHOLOGICAL_ANALYSIS) {
      annotatedTokens = applyGermanMorphology(annotatedTokens);
    }

    // 4. Berechne abgeleitete Features
    annotatedTokens = enrichTokensWithDerivedFeatures(annotatedTokens);

    return annotatedTokens;
  } catch (error) {
    console.error('Token-Analyse Fehler:', error);
    // Gib Tokens mit regelbasiertem POS zurück
    return applyRuleBasedPOS(tokens.map(token => ({
      ...token,
      entity: null,
      entityType: null,
      posTag: null,
      morphology: null,
      error: error.message
    })));
  }
};

/**
 * Wendet Named Entity Recognition an
 * Mit STRENGEM Confidence-Threshold für bessere Präzision
 * @private
 */
const applyNER = async (text, tokens, model) => {
  try {
    const results = await model(text, {
      aggregation_strategy: 'simple'
    });

    const annotated = [...tokens];
    const threshold = ANALYSIS_CONFIG.THRESHOLDS.ENTITY_CONFIDENCE;
    
    for (const entity of results) {
      // WICHTIG: Nur Entities mit hoher Confidence akzeptieren
      if (entity.score < threshold) {
        continue;
      }
      
      const entityWord = entity.word.replace(/^##/, '').trim();
      
      // Finde passende Tokens
      for (let i = 0; i < annotated.length; i++) {
        const token = annotated[i];
        
        if (token.isPunctuation) continue;
        
        const tokenText = token.text.toLowerCase();
        const entityText = entityWord.toLowerCase();
        
        // Nur bei starker Übereinstimmung
        if (tokenText === entityText) {
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
 * Wendet Part-of-Speech Tagging mit echtem POS-Modell an
 * @private
 */
const applyPOSTagging = async (text, tokens, model) => {
  try {
    const results = await model(text, {
      aggregation_strategy: 'simple'
    });

    const annotated = [...tokens];
    
    for (const posResult of results) {
      const word = posResult.word.replace(/^##/, '').trim();
      
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
        
        if (tokenText === posText) {
          // Extrahiere POS-Tag aus Modell-Output
          const posTag = extractPOSFromModel(posResult);
          
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
    return applyRuleBasedPOS(tokens);
  }
};

/**
 * Regelbasiertes POS-Tagging für Deutsch
 * Verwendet linguistische Regeln und Wortlisten
 * @private
 */
const applyRuleBasedPOS = (tokens) => {
  return tokens.map(token => {
    if (token.isPunctuation) {
      return {
        ...token,
        posTag: 'PUNCT',
        posScore: 1.0,
        posInfo: UNIVERSAL_POS_TAGS.PUNCT
      };
    }

    const word = token.text;
    const wordLower = word.toLowerCase();
    let posTag = 'X'; // Default: unbekannt
    let posScore = 0.8; // Regel-basiert hat mittlere Confidence

    // 1. Artikel / Determiner
    if (GERMAN_POS_RULES.ARTICLES.includes(wordLower)) {
      posTag = 'DET';
      posScore = 0.95;
    }
    // 2. Pronomen
    else if (GERMAN_POS_RULES.PRONOUNS.includes(wordLower)) {
      posTag = 'PRON';
      posScore = 0.95;
    }
    // 3. Possessivpronomen
    else if (GERMAN_POS_RULES.POSSESSIVE.some(p => wordLower.startsWith(p))) {
      posTag = 'DET'; // Possessive als Determiner
      posScore = 0.9;
    }
    // 4. Präpositionen
    else if (GERMAN_POS_RULES.PREPOSITIONS.includes(wordLower)) {
      posTag = 'ADP';
      posScore = 0.95;
    }
    // 5. Konjunktionen (koordinierend)
    else if (GERMAN_POS_RULES.CONJUNCTIONS.includes(wordLower)) {
      posTag = 'CCONJ';
      posScore = 0.95;
    }
    // 6. Subjunktionen (subordinierend)
    else if (GERMAN_POS_RULES.SUBJUNCTIONS.includes(wordLower)) {
      posTag = 'SCONJ';
      posScore = 0.95;
    }
    // 7. Hilfsverben
    else if (GERMAN_POS_RULES.AUXILIARIES.includes(wordLower)) {
      posTag = 'AUX';
      posScore = 0.9;
    }
    // 8. Modalverben (auch als AUX behandeln)
    else if (GERMAN_POS_RULES.MODALS.includes(wordLower)) {
      posTag = 'AUX';
      posScore = 0.9;
    }
    // 9. Partikeln
    else if (GERMAN_POS_RULES.PARTICLES.includes(wordLower)) {
      posTag = 'PART';
      posScore = 0.9;
    }
    // 10. Adverbien (häufige)
    else if (GERMAN_POS_RULES.ADVERBS.includes(wordLower)) {
      posTag = 'ADV';
      posScore = 0.85;
    }
    // 11. Heuristiken für Wortarten
    else {
      // Großgeschrieben -> wahrscheinlich Nomen
      if (/^\p{Lu}/u.test(word)) {
        posTag = 'NOUN';
        posScore = 0.7;
      }
      // Endet auf -en, -st, -t -> wahrscheinlich Verb
      else if (/(?:en|st|t)$/i.test(word)) {
        posTag = 'VERB';
        posScore = 0.6;
      }
      // Endet auf -lich, -ig, -isch, -bar, -sam -> wahrscheinlich Adjektiv
      else if (/(?:lich|ig|isch|bar|sam|haft)$/i.test(word)) {
        posTag = 'ADJ';
        posScore = 0.65;
      }
      // Enthält Zahlen -> Numerale
      else if (/\d/.test(word)) {
        posTag = 'NUM';
        posScore = 0.9;
      }
    }

    return {
      ...token,
      posTag,
      posScore,
      posInfo: UNIVERSAL_POS_TAGS[posTag] || UNIVERSAL_POS_TAGS.X
    };
  });
};

/**
 * Extrahiert POS-Tag aus Modell-Output
 * @private
 */
const extractPOSFromModel = (result) => {
  if (!result.entity_group && !result.entity) return 'X';
  
  const label = (result.entity_group || result.entity).toUpperCase();
  
  // Direktes Mapping wenn Universal POS Tag
  if (UNIVERSAL_POS_TAGS[label]) {
    return label;
  }
  
  // Alternative Labels mappen
  const mapping = {
    'NOUN': 'NOUN',
    'PROPN': 'NOUN',
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
    'SYM': 'X'
  };
  
  return mapping[label] || 'X';
};

/**
 * Wendet deutsche morphologische Analyse an (regelbasiert)
 * @private
 */
const applyGermanMorphology = (tokens) => {
  return tokens.map(token => {
    if (token.isPunctuation || !token.posTag) {
      return token;
    }

    const morphology = {
      features: {},
      syllables: estimateSyllables(token.text),
      complexity: estimateComplexity(token.text)
    };

    // Morphologische Features basierend auf POS-Tag
    switch (token.posTag) {
      case 'NOUN':
        morphology.features = analyzeNounMorphology(token.text);
        break;
      case 'VERB':
      case 'AUX':
        morphology.features = analyzeVerbMorphology(token.text);
        break;
      case 'ADJ':
        morphology.features = analyzeAdjectiveMorphology(token.text);
        break;
      case 'PRON':
      case 'DET':
        morphology.features = analyzePronounMorphology(token.text);
        break;
    }

    return {
      ...token,
      morphology
    };
  });
};

/**
 * Analysiert Nomen-Morphologie
 * @private
 */
const analyzeNounMorphology = (word) => {
  const features = {};
  
  // Genus (sehr vereinfacht, nur Heuristiken)
  if (word.endsWith('ung') || word.endsWith('heit') || word.endsWith('keit')) {
    features.gender = 'FEM';
  } else if (word.endsWith('chen') || word.endsWith('lein')) {
    features.gender = 'NEUT';
  }
  
  // Numerus
  if (word.endsWith('e') || word.endsWith('en') || word.endsWith('er') || word.endsWith('s')) {
    features.number = 'PLUR';
  } else {
    features.number = 'SING';
  }
  
  return features;
};

/**
 * Analysiert Verb-Morphologie
 * @private
 */
const analyzeVerbMorphology = (word) => {
  const features = {};
  const lower = word.toLowerCase();
  
  // Infinitiv
  if (lower.endsWith('en')) {
    features.verbForm = 'INF';
  }
  // Partizip Perfekt
  else if (lower.startsWith('ge') && lower.endsWith('t')) {
    features.verbForm = 'PART';
    features.tense = 'PAST';
  }
  // Konjugierte Formen
  else if (lower.endsWith('t') || lower.endsWith('st') || lower.endsWith('e')) {
    features.verbForm = 'FIN';
    features.tense = 'PRES';
    
    if (lower.endsWith('st')) {
      features.person = '2';
    } else if (lower.endsWith('t')) {
      features.person = '3';
    } else if (lower.endsWith('e')) {
      features.person = '1';
    }
  }
  
  return features;
};

/**
 * Analysiert Adjektiv-Morphologie
 * @private
 */
const analyzeAdjectiveMorphology = (word) => {
  const features = {};
  
  // Komparativ
  if (word.endsWith('er') && !word.startsWith('er')) {
    features.degree = 'CMP';
  }
  // Superlativ
  else if (word.endsWith('st') || word.endsWith('ste')) {
    features.degree = 'SUP';
  }
  // Positiv
  else {
    features.degree = 'POS';
  }
  
  return features;
};

/**
 * Analysiert Pronomen-Morphologie
 * @private
 */
const analyzePronounMorphology = (word) => {
  const features = {};
  const lower = word.toLowerCase();
  
  // Person
  if (['ich', 'mich', 'mir', 'mein'].includes(lower)) {
    features.person = '1';
    features.number = 'SING';
  } else if (['du', 'dich', 'dir', 'dein'].includes(lower)) {
    features.person = '2';
    features.number = 'SING';
  } else if (['er', 'sie', 'es', 'ihm', 'ihr', 'sein'].includes(lower)) {
    features.person = '3';
    features.number = 'SING';
  } else if (['wir', 'uns', 'unser'].includes(lower)) {
    features.person = '1';
    features.number = 'PLUR';
  } else if (['ihr', 'euch', 'euer'].includes(lower)) {
    features.person = '2';
    features.number = 'PLUR';
  } else if (['sie', 'ihnen'].includes(lower)) {
    features.person = '3';
    features.number = 'PLUR';
  }
  
  return features;
};

/**
 * Schätzt Silbenzahl
 * @private
 */
const estimateSyllables = (word) => {
  if (!word || word.length === 0) return 0;
  
  const lower = word.toLowerCase();
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
  
  return Math.max(1, Math.round(count));
};

/**
 * Schätzt Wort-Komplexität
 * @private
 */
const estimateComplexity = (word) => {
  const length = word.length;
  const syllables = estimateSyllables(word);
  
  // Einfach: kurz und wenige Silben
  if (length <= 5 && syllables <= 2) return 'simple';
  // Komplex: lang oder viele Silben
  if (length > 12 || syllables > 4) return 'complex';
  // Sonst mittel
  return 'medium';
};

/**
 * Reichert Tokens mit abgeleiteten Features an
 * @private
 */
const enrichTokensWithDerivedFeatures = (tokens) => {
  return tokens.map(token => {
    if (token.isPunctuation) {
      return token;
    }

    const wordClass = deriveWordClass(token);
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
  
  const mapping = {
    'PER': 'PER',
    'PERSON': 'PER',
    'LOC': 'LOC',
    'LOCATION': 'LOC',
    'ORG': 'ORG',
    'ORGANIZATION': 'ORG',
    'ORGANISATION': 'ORG',
    'MISC': 'MISC',
    'MISCELLANEOUS': 'MISC'
  };
  
  const normalized = mapping[cleanLabel.toUpperCase()] || cleanLabel;
  return ENTITY_LABELS[normalized]?.label || cleanLabel;
};

/**
 * Analysiert Wort-Frequenzen
 * 
 * @param {Array} tokens - Token-Array
 * @returns {Object} Frequenz-Analyse
 */
export const analyzeWordFrequencies = (tokens) => {
  const wordTokens = tokens.filter(t => !t.isPunctuation);
  const frequencies = new Map();
  const firstOccurrence = new Map();
  
  for (const token of wordTokens) {
    const word = token.text.toLowerCase();
    
    if (!frequencies.has(word)) {
      frequencies.set(word, {
        count: 0,
        word: token.text,
        firstOccurrence: token.position,
        posTag: token.posTag,
        entityType: token.entityType
      });
    }
    
    const freq = frequencies.get(word);
    freq.count++;
    frequencies.set(word, freq);
  }
  
  const sorted = Array.from(frequencies.values())
    .sort((a, b) => b.count - a.count);
  
  return {
    total: wordTokens.length,
    unique: frequencies.size,
    typeTokenRatio: (frequencies.size / wordTokens.length).toFixed(3),
    topWords: sorted.slice(0, 20),
    hapaxLegomena: sorted.filter(f => f.count === 1).length
  };
};

/**
 * Findet Komposita
 * 
 * @param {Array} tokens - Token-Array
 * @returns {Array} Gefundene Komposita
 */
export const findCompoundWords = (tokens) => {
  const compounds = [];
  
  for (const token of tokens) {
    if (token.isPunctuation || !token.text) continue;
    
    // Heuristik: Wörter mit Bindestrich oder sehr lange Wörter
    if (token.text.includes('-') || token.text.length > 15) {
      const parts = token.text.split(/[-\s]/);
      
      if (parts.length > 1 || token.text.length > 15) {
        compounds.push({
          word: token.text,
          position: token.position,
          length: token.text.length,
          estimatedParts: parts.length > 1 ? parts : null,
          posTag: token.posTag
        });
      }
    }
  }
  
  return compounds;
};

/**
 * Findet seltene/komplexe Wörter
 * 
 * @param {Array} tokens - Token-Array
 * @returns {Array} Seltene Wörter
 */
export const findRareWords = (tokens) => {
  const wordTokens = tokens.filter(t => !t.isPunctuation && t.wordClass?.isContentWord);
  
  return wordTokens
    .filter(t => 
      t.text.length > 10 || 
      (t.morphology?.syllables && t.morphology.syllables > 4) ||
      t.morphology?.complexity === 'complex'
    )
    .map(t => ({
      word: t.text,
      position: t.position,
      length: t.text.length,
      syllables: t.morphology?.syllables,
      posTag: t.posTag
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
    if (token.posTag) {
      posDistribution[token.posTag] = (posDistribution[token.posTag] || 0) + 1;
    }
    
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

export default {
  analyzeTokens,
  analyzeWordFrequencies,
  findCompoundWords,
  findRareWords,
  analyzeTokenDiversity
};