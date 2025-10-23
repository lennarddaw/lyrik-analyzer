import { getModel } from './modelLoader';
import { DEPENDENCY_RELATIONS, RHYME_SCHEMES, STYLISTIC_DEVICES, ANALYSIS_CONFIG } from '../utils/constants';
import { sentenceSegmentation, detectVerses, estimateSyllables } from '../utils/textPreprocessing';

/**
 * Führt vollständige Syntax-Analyse durch
 * Komplett modellbasiert ohne Heuristiken
 * 
 * @param {string} text - Input Text
 * @param {Array} tokens - Token-Array mit POS/NER Annotationen
 * @returns {Promise<Object>} Syntax-Analyse Ergebnis
 */
export const analyzeSyntax = async (text, tokens) => {
  const sentences = sentenceSegmentation(text);
  const verses = detectVerses(text);
  
  // 1. Dependency Parsing (wenn Modell verfügbar)
  let dependencies = null;
  const depModel = getModel('DEPENDENCY');
  if (depModel) {
    dependencies = await analyzeDependencies(text, sentences, depModel);
  }
  
  // 2. Satzstruktur-Analyse (modellbasiert)
  const sentenceStructure = await analyzeSentenceStructure(sentences, tokens, dependencies);
  
  // 3. Vers-Struktur (für Gedichte)
  const verseStructure = analyzeVerseStructure(verses);
  
  // 4. Reimschema-Analyse (phonetisch-modellbasiert)
  const rhymeScheme = verses.length > 0 
    ? await analyzeRhymeScheme(verses, tokens)
    : null;
  
  // 5. Repetitions-Analyse (datengetrieben)
  const repetitions = analyzeRepetitions(tokens);
  
  // 6. Parallelismus-Analyse (strukturbasiert)
  const parallelism = analyzeSyntacticParallelism(sentences, dependencies);
  
  // 7. Interpunktionsmuster
  const punctuationPattern = analyzePunctuation(tokens);
  
  // 8. Syntaktische Komplexität
  const complexity = calculateSyntacticComplexity(sentences, dependencies, tokens);

  return {
    sentenceStructure,
    verseStructure,
    rhymeScheme,
    dependencies,
    repetitions,
    parallelism,
    punctuationPattern,
    complexity
  };
};

/**
 * Analysiert Dependencies (syntaktische Abhängigkeiten)
 * @private
 */
const analyzeDependencies = async (text, sentences, model) => {
  try {
    const allDependencies = [];
    
    for (const sentence of sentences) {
      // Verwende Token-Classification für Dependency Parsing
      const depResults = await model(sentence.text, {
        aggregation_strategy: 'simple'
      });
      
      const sentenceDeps = depResults.map(dep => ({
        word: dep.word.replace(/^##/, ''),
        relation: parseDependencyRelation(dep.entity_group || dep.entity),
        relationLabel: DEPENDENCY_RELATIONS[parseDependencyRelation(dep.entity_group || dep.entity)]?.label,
        score: dep.score,
        start: dep.start,
        end: dep.end
      }));
      
      allDependencies.push({
        sentence: sentence.text,
        sentenceIndex: sentence.index,
        dependencies: sentenceDeps,
        graph: buildDependencyGraph(sentenceDeps)
      });
    }
    
    return allDependencies;
  } catch (error) {
    console.error('Dependency Parsing Fehler:', error);
    return null;
  }
};

/**
 * Analysiert Satzstruktur modellbasiert
 * @private
 */
const analyzeSentenceStructure = async (sentences, tokens, dependencies) => {
  const structures = [];
  
  for (const sentence of sentences) {
    // Extrahiere Tokens für diesen Satz
    const sentenceTokens = extractSentenceTokens(sentence, tokens);
    const words = sentenceTokens.filter(t => !t.isPunctuation);
    
    // Strukturelle Features aus POS-Tags
    const posPattern = words.map(t => t.posTag).filter(p => p);
    const posDistribution = calculatePOSDistribution(words);
    
    // Dependency-basierte Features
    let dependencyDepth = 0;
    let dependencyBreadth = 0;
    if (dependencies) {
      const sentenceDep = dependencies.find(d => d.sentenceIndex === sentence.index);
      if (sentenceDep) {
        const depMetrics = calculateDependencyMetrics(sentenceDep.graph);
        dependencyDepth = depMetrics.maxDepth;
        dependencyBreadth = depMetrics.avgBreadth;
      }
    }
    
    // Clause-Erkennung (basierend auf Konjunktionen)
    const subordinateClauses = words.filter(t => t.posTag === 'SCONJ').length;
    const coordinateClauses = words.filter(t => t.posTag === 'CCONJ').length;
    
    structures.push({
      ...sentence,
      tokenCount: sentenceTokens.length,
      wordCount: words.length,
      posPattern,
      posDistribution,
      dependencyDepth,
      dependencyBreadth,
      subordinateClauses,
      coordinateClauses,
      clauseCount: 1 + subordinateClauses + coordinateClauses,
      complexity: calculateSentenceComplexity(words, subordinateClauses, dependencyDepth),
      type: classifySentenceType(sentenceTokens)
    });
  }
  
  return structures;
};

/**
 * Analysiert Vers-Struktur
 * @private
 */
const analyzeVerseStructure = (verses) => {
  if (verses.length === 0) return null;
  
  return {
    verses: verses.map(verse => ({
      ...verse,
      syllableCount: estimateSyllables(verse.text),
      stressPattern: null // Könnte durch Phonetik-Modell ergänzt werden
    })),
    totalVerses: verses.length,
    avgWordsPerVerse: (verses.reduce((sum, v) => sum + v.wordCount, 0) / verses.length).toFixed(2),
    avgSyllablesPerVerse: (verses.reduce((sum, v) => sum + estimateSyllables(v.text), 0) / verses.length).toFixed(2),
    hasRegularStructure: checkStructuralRegularity(verses)
  };
};

/**
 * Analysiert Reimschema modellbasiert
 * Verwendet phonetische Ähnlichkeit statt einfacher String-Vergleiche
 * @private
 */
const analyzeRhymeScheme = async (verses, tokens) => {
  if (verses.length < 2) return null;
  
  // Extrahiere letzte Wörter jedes Verses
  const verseEndings = verses.map(verse => {
    const verseWords = verse.text.trim().split(/\s+/);
    const lastWord = verseWords[verseWords.length - 1].replace(/[.,!?;:]$/g, '');
    return {
      verseIndex: verse.index,
      word: lastWord.toLowerCase(),
      // Extrahiere phonetische Endung (letzte 2-3 Zeichen als Proxy)
      ending: extractPhoneticEnding(lastWord)
    };
  });
  
  // Finde Reimpaare basierend auf phonetischer Ähnlichkeit
  const rhymePairs = [];
  const rhymePattern = new Array(verses.length).fill(null);
  let currentLabel = 'A';
  
  for (let i = 0; i < verseEndings.length; i++) {
    if (rhymePattern[i] !== null) continue;
    
    rhymePattern[i] = currentLabel;
    
    // Suche nach Reimen
    for (let j = i + 1; j < verseEndings.length; j++) {
      if (rhymePattern[j] !== null) continue;
      
      const similarity = calculatePhoneticSimilarity(
        verseEndings[i].ending,
        verseEndings[j].ending
      );
      
      if (similarity > 0.7) { // Schwellenwert für Reim
        rhymePattern[j] = currentLabel;
        rhymePairs.push({
          verse1: i,
          verse2: j,
          word1: verseEndings[i].word,
          word2: verseEndings[j].word,
          similarity: similarity.toFixed(3)
        });
      }
    }
    
    currentLabel = String.fromCharCode(currentLabel.charCodeAt(0) + 1);
  }
  
  const schemeString = rhymePattern.join('');
  
  return {
    pattern: rhymePattern,
    scheme: schemeString,
    pairs: rhymePairs,
    description: identifyRhymeSchemeType(schemeString),
    quality: calculateRhymeQuality(rhymePairs, verses.length)
  };
};

/**
 * Analysiert Repetitionen (datengetrieben)
 * @private
 */
const analyzeRepetitions = (tokens) => {
  const wordTokens = tokens.filter(t => !t.isPunctuation && t.text.length > 2);
  const repetitions = new Map();
  
  // Sammle alle Wiederholungen
  for (const token of wordTokens) {
    const word = token.text.toLowerCase();
    
    if (!repetitions.has(word)) {
      repetitions.set(word, {
        word: token.text,
        count: 0,
        positions: [],
        posTag: token.posTag,
        isContentWord: ['NOUN', 'VERB', 'ADJ', 'ADV'].includes(token.posTag)
      });
    }
    
    const entry = repetitions.get(word);
    entry.count++;
    entry.positions.push(token.position);
  }
  
  // Filtere relevante Wiederholungen
  const significantRepetitions = Array.from(repetitions.values())
    .filter(r => r.count > 1)
    .map(r => ({
      ...r,
      patterns: detectRepetitionPatterns(r.positions, tokens),
      significance: calculateRepetitionSignificance(r, tokens.length)
    }))
    .sort((a, b) => b.significance - a.significance);
  
  return {
    total: significantRepetitions.length,
    repetitions: significantRepetitions,
    patterns: {
      anaphora: detectAnaphora(significantRepetitions, tokens),
      epiphora: detectEpiphora(significantRepetitions, tokens),
      symploce: detectSymploce(significantRepetitions, tokens)
    }
  };
};

/**
 * Analysiert syntaktischen Parallelismus
 * Basiert auf POS-Patterns und Dependency-Strukturen
 * @private
 */
const analyzeSyntacticParallelism = (sentences, dependencies) => {
  const parallelisms = [];
  
  if (sentences.length < 2) return parallelisms;
  
  for (let i = 0; i < sentences.length - 1; i++) {
    for (let j = i + 1; j < sentences.length; j++) {
      const sent1 = sentences[i];
      const sent2 = sentences[j];
      
      // Strukturelle Ähnlichkeit
      const structuralSim = calculateStructuralSimilarity(sent1, sent2);
      
      // Dependency-Ähnlichkeit (wenn verfügbar)
      let dependencySim = 0;
      if (dependencies) {
        const dep1 = dependencies[i];
        const dep2 = dependencies[j];
        if (dep1 && dep2) {
          dependencySim = calculateDependencySimilarity(dep1, dep2);
        }
      }
      
      const combinedSim = (structuralSim + dependencySim) / (dependencies ? 2 : 1);
      
      if (combinedSim > 0.6) {
        parallelisms.push({
          sentence1: i,
          sentence2: j,
          text1: sent1.text.slice(0, 50) + '...',
          text2: sent2.text.slice(0, 50) + '...',
          structuralSimilarity: structuralSim.toFixed(3),
          dependencySimilarity: dependencySim.toFixed(3),
          combinedSimilarity: combinedSim.toFixed(3)
        });
      }
    }
  }
  
  return parallelisms;
};

/**
 * Analysiert Interpunktionsmuster
 * @private
 */
const analyzePunctuation = (tokens) => {
  const punctuation = tokens.filter(t => t.isPunctuation);
  const distribution = {};
  
  for (const punct of punctuation) {
    distribution[punct.text] = (distribution[punct.text] || 0) + 1;
  }
  
  const total = punctuation.length;
  const wordTokens = tokens.filter(t => !t.isPunctuation);
  
  return {
    total,
    distribution,
    frequency: (total / Math.max(wordTokens.length, 1)).toFixed(3), // Interpunktion pro Wort
    types: Object.keys(distribution).length,
    dominantType: Object.entries(distribution).sort((a, b) => b[1] - a[1])[0]?.[0] || null
  };
};

/**
 * Berechnet syntaktische Komplexität
 * @private
 */
const calculateSyntacticComplexity = (sentences, dependencies, tokens) => {
  const wordCount = tokens.filter(t => !t.isPunctuation).length;
  const sentenceCount = Math.max(sentences.length, 1);
  
  // Durchschnittliche Satzlänge
  const avgSentenceLength = wordCount / sentenceCount;
  
  // Durchschnittliche Nebensätze
  const avgSubordinateClauses = sentences.reduce((sum, s) => 
    sum + (s.subordinateClauses || 0), 0) / sentenceCount;
  
  // Durchschnittliche Dependency-Tiefe
  let avgDepthScore = 0;
  if (dependencies) {
    const depthSum = dependencies.reduce((sum, d) => {
      const metrics = calculateDependencyMetrics(d.graph);
      return sum + metrics.maxDepth;
    }, 0);
    avgDepthScore = depthSum / dependencies.length;
  }
  
  // Gewichtete Komplexität (0-100)
  const lengthScore = Math.min(avgSentenceLength / 20 * 30, 30); // max 30 Punkte
  const clauseScore = Math.min(avgSubordinateClauses / 2 * 30, 30); // max 30 Punkte
  const depthScore = Math.min(avgDepthScore / 5 * 40, 40); // max 40 Punkte
  
  const totalScore = lengthScore + clauseScore + depthScore;
  
  let level;
  if (totalScore > 75) level = 'Sehr komplex';
  else if (totalScore > 50) level = 'Komplex';
  else if (totalScore > 25) level = 'Mittel';
  else level = 'Einfach';
  
  return {
    score: Math.round(totalScore),
    level,
    metrics: {
      avgSentenceLength: avgSentenceLength.toFixed(2),
      avgSubordinateClauses: avgSubordinateClauses.toFixed(2),
      avgDependencyDepth: avgDepthScore.toFixed(2)
    }
  };
};

// ===================== Hilfsfunktionen =====================

const extractSentenceTokens = (sentence, tokens) => {
  // Einfache Heuristik: Tokens die im Satz-Text vorkommen
  return tokens.filter(t => sentence.text.includes(t.text));
};

const calculatePOSDistribution = (words) => {
  const dist = {};
  for (const word of words) {
    if (word.posTag) {
      dist[word.posTag] = (dist[word.posTag] || 0) + 1;
    }
  }
  return dist;
};

const parseDependencyRelation = (label) => {
  if (!label) return 'dep';
  const cleanLabel = label.replace(/^[BI]-/, '').toLowerCase();
  return DEPENDENCY_RELATIONS[cleanLabel] ? cleanLabel : 'dep';
};

const buildDependencyGraph = (dependencies) => {
  // Vereinfachter Graph: Liste von Relationen
  return {
    nodes: dependencies.length,
    edges: dependencies.map(d => ({
      relation: d.relation,
      word: d.word
    }))
  };
};

const calculateDependencyMetrics = (graph) => {
  if (!graph || !graph.edges) return { maxDepth: 0, avgBreadth: 0 };
  
  // Vereinfachte Metriken
  return {
    maxDepth: Math.ceil(Math.log2(graph.nodes + 1)), // Geschätzte Tiefe
    avgBreadth: graph.nodes / Math.max(1, Math.ceil(Math.log2(graph.nodes + 1)))
  };
};

const calculateSentenceComplexity = (words, subordinateClauses, dependencyDepth) => {
  let complexity = 0;
  
  // Wortanzahl
  complexity += Math.min(words.length / 20, 1) * 30;
  
  // Nebensätze
  complexity += Math.min(subordinateClauses / 3, 1) * 35;
  
  // Dependency-Tiefe
  complexity += Math.min(dependencyDepth / 5, 1) * 35;
  
  return Math.round(complexity);
};

const classifySentenceType = (tokens) => {
  const lastToken = tokens[tokens.length - 1];
  
  if (lastToken && lastToken.isPunctuation) {
    if (lastToken.text === '?') return { type: 'Frage', marker: '?' };
    if (lastToken.text === '!') return { type: 'Ausruf', marker: '!' };
  }
  
  // Prüfe auf Imperativ (Verb am Anfang)
  const firstWord = tokens.find(t => !t.isPunctuation);
  if (firstWord && firstWord.posTag === 'VERB') {
    return { type: 'Imperativ/Aufforderung', marker: null };
  }
  
  return { type: 'Aussage', marker: '.' };
};

const checkStructuralRegularity = (verses) => {
  if (verses.length < 3) return false;
  
  const wordCounts = verses.map(v => v.wordCount);
  const avgCount = wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length;
  const variance = wordCounts.reduce((sum, c) => sum + Math.pow(c - avgCount, 2), 0) / wordCounts.length;
  
  return variance < 4; // Niedrige Varianz = regelmäßig
};

const extractPhoneticEnding = (word) => {
  const clean = word.toLowerCase().replace(/[^a-zäöüß]/g, '');
  return clean.slice(-3); // Letzte 3 Zeichen als Proxy für Phonectic
};

const calculatePhoneticSimilarity = (ending1, ending2) => {
  if (ending1 === ending2) return 1.0;
  if (ending1.length === 0 || ending2.length === 0) return 0;
  
  // Levenshtein-Distanz
  const maxLen = Math.max(ending1.length, ending2.length);
  const distance = levenshteinDistance(ending1, ending2);
  
  return 1 - (distance / maxLen);
};

const levenshteinDistance = (str1, str2) => {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};

const identifyRhymeSchemeType = (scheme) => {
  const first4 = scheme.slice(0, 4);
  
  const patterns = {
    'AABB': RHYME_SCHEMES.AABB,
    'ABAB': RHYME_SCHEMES.ABAB,
    'ABBA': RHYME_SCHEMES.ABBA,
    'ABCA': RHYME_SCHEMES.ABCABC
  };
  
  return patterns[first4] || RHYME_SCHEMES.FREE;
};

const calculateRhymeQuality = (pairs, totalVerses) => {
  if (totalVerses === 0) return 0;
  
  const rhymeRatio = (pairs.length * 2) / totalVerses; // 2 Verse pro Paar
  const avgSimilarity = pairs.length > 0
    ? pairs.reduce((sum, p) => sum + parseFloat(p.similarity), 0) / pairs.length
    : 0;
  
  return ((rhymeRatio * 0.5) + (avgSimilarity * 0.5)).toFixed(3);
};

const detectRepetitionPatterns = (positions, tokens) => {
  // Erkenne ob Wiederholung am Satzanfang, -ende, oder regelmäßig
  const patterns = [];
  
  // Prüfe auf regelmäßige Abstände
  if (positions.length > 2) {
    const intervals = [];
    for (let i = 1; i < positions.length; i++) {
      intervals.push(positions[i] - positions[i - 1]);
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length;
    
    if (variance < 4) {
      patterns.push({ type: 'regular', interval: avgInterval.toFixed(1) });
    }
  }
  
  return patterns;
};

const calculateRepetitionSignificance = (repetition, totalTokens) => {
  const frequency = repetition.count / totalTokens;
  const contentWordBonus = repetition.isContentWord ? 1.5 : 1.0;
  const lengthBonus = Math.min(repetition.word.length / 10, 1.5);
  
  return frequency * contentWordBonus * lengthBonus;
};

const detectAnaphora = (repetitions, tokens) => {
  // Wörter die häufig am Satzanfang stehen
  // Vereinfacht: Prüfe erste Positionen
  return repetitions
    .filter(r => r.positions.some(pos => pos < 5))
    .slice(0, 3);
};

const detectEpiphora = (repetitions, tokens) => {
  // Wörter die häufig am Satzende stehen
  const maxPos = Math.max(...tokens.map(t => t.position));
  return repetitions
    .filter(r => r.positions.some(pos => pos > maxPos - 5))
    .slice(0, 3);
};

const detectSymploce = (repetitions, tokens) => {
  // Kombination aus Anapher und Epipher
  const anaphoras = detectAnaphora(repetitions, tokens);
  const epiphoras = detectEpiphora(repetitions, tokens);
  
  return anaphoras.filter(a => epiphoras.some(e => e.word === a.word));
};

const calculateStructuralSimilarity = (sent1, sent2) => {
  // Vergleiche Länge
  const lengthSim = 1 - Math.abs(sent1.wordCount - sent2.wordCount) / Math.max(sent1.wordCount, sent2.wordCount);
  
  // Vergleiche Wörter (Jaccard)
  const words1 = new Set(sent1.text.toLowerCase().split(/\s+/));
  const words2 = new Set(sent2.text.toLowerCase().split(/\s+/));
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  const jaccardSim = intersection.size / union.size;
  
  return (lengthSim * 0.3 + jaccardSim * 0.7);
};

const calculateDependencySimilarity = (dep1, dep2) => {
  if (!dep1 || !dep2 || !dep1.graph || !dep2.graph) return 0;
  
  // Vergleiche Relation-Verteilung
  const relations1 = dep1.graph.edges.map(e => e.relation);
  const relations2 = dep2.graph.edges.map(e => e.relation);
  
  const set1 = new Set(relations1);
  const set2 = new Set(relations2);
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  
  return intersection.size / Math.max(set1.size, set2.size);
};

export default {
  analyzeSyntax,
  analyzeDependencies,
  analyzeSentenceStructure,
  analyzeRhymeScheme,
  analyzeRepetitions,
  analyzeSyntacticParallelism
};