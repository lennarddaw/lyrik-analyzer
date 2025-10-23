import { getModel } from './modelLoader';
import { ANALYSIS_CONFIG, FEATURES } from '../utils/constants';

/**
 * Führt semantische Analyse durch
 * Komplett modellbasiert mit Embeddings
 * 
 * @param {string} text - Input Text
 * @param {Array} tokens - Token-Array
 * @returns {Promise<Object>} Semantische Analyse
 */
export const analyzeSemantics = async (text, tokens) => {
  try {
    const model = getModel('EMBEDDINGS');
    if (!model) {
      console.warn('Embeddings Model nicht geladen');
      return {
        textEmbedding: null,
        wordEmbeddings: [],
        similarities: [],
        semanticFields: [],
        keyPhrases: [],
        cohesion: null,
        thematicDevelopment: null
      };
    }

    // 1. Generiere Text-Embedding
    const textEmbedding = await generateTextEmbedding(text, model);
    
    // 2. Generiere Word-Embeddings
    const wordEmbeddings = await generateWordEmbeddings(tokens, model);
    
    // 3. Berechne semantische Ähnlichkeiten
    const similarities = calculateSemanticSimilarities(wordEmbeddings);
    
    // 4. Identifiziere semantische Felder (Themen-Cluster)
    const semanticFields = identifySemanticFields(wordEmbeddings, similarities);
    
    // 5. Extrahiere Schlüsselphrasen
    const keyPhrases = extractKeyPhrases(wordEmbeddings, textEmbedding, tokens);
    
    // 6. Berechne Textkohäsion
    const cohesion = calculateTextCohesion(wordEmbeddings);
    
    // 7. Analysiere thematische Entwicklung
    const thematicDevelopment = analyzeThematicDevelopment(
      wordEmbeddings, 
      ANALYSIS_CONFIG.PROCESSING.SEMANTIC_WINDOW
    );

    return {
      textEmbedding,
      wordEmbeddings,
      similarities,
      semanticFields,
      keyPhrases,
      cohesion,
      thematicDevelopment
    };
  } catch (error) {
    console.error('Semantische Analyse Fehler:', error);
    return {
      textEmbedding: null,
      wordEmbeddings: [],
      similarities: [],
      semanticFields: [],
      keyPhrases: [],
      cohesion: null,
      thematicDevelopment: null,
      error: error.message
    };
  }
};

/**
 * Generiert Embedding für gesamten Text
 * @private
 */
const generateTextEmbedding = async (text, model) => {
  try {
    const result = await model(text, {
      pooling: 'mean',
      normalize: true
    });
    
    return {
      vector: Array.from(result.data || result),
      dimension: (result.data || result).length,
      method: 'mean-pooling'
    };
  } catch (error) {
    console.error('Text-Embedding Fehler:', error);
    return null;
  }
};

/**
 * Generiert Embeddings für einzelne Wörter
 * @private
 */
const generateWordEmbeddings = async (tokens, model) => {
  const wordTokens = tokens.filter(t => 
    !t.isPunctuation && 
    t.text.length >= ANALYSIS_CONFIG.TEXT.MIN_WORD_LENGTH
  );
  
  const embeddings = [];
  const batchSize = ANALYSIS_CONFIG.PROCESSING.BATCH_SIZE;
  
  for (let i = 0; i < wordTokens.length; i += batchSize) {
    const batch = wordTokens.slice(i, i + batchSize);
    const batchTexts = batch.map(t => t.text);
    
    try {
      // Verarbeite Batch
      const batchResults = await Promise.all(
        batchTexts.map(async (text) => {
          try {
            const result = await model(text, {
              pooling: 'mean',
              normalize: true
            });
            return Array.from(result.data || result);
          } catch (err) {
            console.warn(`Fehler bei Word-Embedding für "${text}":`, err);
            return null;
          }
        })
      );
      
      // Kombiniere mit Token-Daten
      for (let j = 0; j < batch.length; j++) {
        if (batchResults[j]) {
          embeddings.push({
            token: batch[j],
            word: batch[j].text,
            embedding: batchResults[j],
            position: batch[j].position,
            posTag: batch[j].posTag,
            entityType: batch[j].entityType
          });
        }
      }
    } catch (error) {
      console.error('Batch-Embedding Fehler:', error);
    }
  }
  
  return embeddings;
};

/**
 * Berechnet Cosinus-Ähnlichkeit zwischen zwei Vektoren
 * @private
 */
const cosineSimilarity = (vec1, vec2) => {
  if (!vec1 || !vec2 || vec1.length !== vec2.length || vec1.length === 0) {
    return 0;
  }
  
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }
  
  if (norm1 === 0 || norm2 === 0) return 0;
  
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
};

/**
 * Berechnet semantische Ähnlichkeiten zwischen Wörtern
 * @private
 */
const calculateSemanticSimilarities = (wordEmbeddings) => {
  const similarities = [];
  const threshold = ANALYSIS_CONFIG.THRESHOLDS.SIMILARITY_MEDIUM;
  
  for (let i = 0; i < wordEmbeddings.length; i++) {
    for (let j = i + 1; j < wordEmbeddings.length; j++) {
      const similarity = cosineSimilarity(
        wordEmbeddings[i].embedding,
        wordEmbeddings[j].embedding
      );
      
      // Nur signifikante Ähnlichkeiten speichern
      if (similarity > threshold) {
        similarities.push({
          word1: wordEmbeddings[i].word,
          word2: wordEmbeddings[j].word,
          similarity: parseFloat(similarity.toFixed(3)),
          position1: wordEmbeddings[i].position,
          position2: wordEmbeddings[j].position,
          posTag1: wordEmbeddings[i].posTag,
          posTag2: wordEmbeddings[j].posTag,
          category: categorizeSimilarity(similarity)
        });
      }
    }
  }
  
  return similarities.sort((a, b) => b.similarity - a.similarity);
};

/**
 * Kategorisiert Ähnlichkeits-Scores
 * @private
 */
const categorizeSimilarity = (similarity) => {
  const high = ANALYSIS_CONFIG.THRESHOLDS.SIMILARITY_HIGH;
  const medium = ANALYSIS_CONFIG.THRESHOLDS.SIMILARITY_MEDIUM;
  
  if (similarity >= high) return 'very-similar';
  if (similarity >= medium) return 'similar';
  return 'somewhat-similar';
};

/**
 * Identifiziert semantische Felder (Themen-Cluster)
 * Verwendet Clustering-Algorithmus auf Embeddings
 * @private
 */
const identifySemanticFields = (wordEmbeddings, similarities) => {
  if (wordEmbeddings.length < 3) return [];
  
  // Erstelle Ähnlichkeits-Graph
  const graph = new Map();
  for (const emb of wordEmbeddings) {
    graph.set(emb.word, new Set());
  }
  
  // Füge Kanten für ähnliche Wörter hinzu
  for (const sim of similarities) {
    if (sim.similarity > ANALYSIS_CONFIG.THRESHOLDS.SIMILARITY_MEDIUM) {
      graph.get(sim.word1).add(sim.word2);
      graph.get(sim.word2).add(sim.word1);
    }
  }
  
  // Finde Cluster (Connected Components)
  const visited = new Set();
  const clusters = [];
  
  for (const word of graph.keys()) {
    if (visited.has(word)) continue;
    
    const cluster = [];
    const queue = [word];
    
    while (queue.length > 0) {
      const current = queue.shift();
      if (visited.has(current)) continue;
      
      visited.add(current);
      cluster.push(current);
      
      for (const neighbor of graph.get(current)) {
        if (!visited.has(neighbor)) {
          queue.push(neighbor);
        }
      }
    }
    
    if (cluster.length >= 2) { // Mindestens 2 Wörter pro Cluster
      // Berechne Cluster-Zentrum
      const clusterEmbeddings = cluster.map(w => 
        wordEmbeddings.find(e => e.word === w).embedding
      );
      const centroid = calculateCentroid(clusterEmbeddings);
      
      // Finde repräsentativste Wörter
      const representatives = cluster
        .map(w => ({
          word: w,
          centrality: cosineSimilarity(
            wordEmbeddings.find(e => e.word === w).embedding,
            centroid
          )
        }))
        .sort((a, b) => b.centrality - a.centrality)
        .slice(0, 3)
        .map(r => r.word);
      
      clusters.push({
        theme: representatives.join(', '),
        words: cluster,
        size: cluster.length,
        representatives,
        coherence: calculateClusterCoherence(clusterEmbeddings)
      });
    }
  }
  
  return clusters.sort((a, b) => b.size - a.size).slice(0, 10);
};

/**
 * Berechnet Zentroid (Durchschnitts-Embedding) eines Clusters
 * @private
 */
const calculateCentroid = (embeddings) => {
  if (embeddings.length === 0) return null;
  
  const dimension = embeddings[0].length;
  const centroid = new Array(dimension).fill(0);
  
  for (const emb of embeddings) {
    for (let i = 0; i < dimension; i++) {
      centroid[i] += emb[i];
    }
  }
  
  for (let i = 0; i < dimension; i++) {
    centroid[i] /= embeddings.length;
  }
  
  return centroid;
};

/**
 * Berechnet Cluster-Kohärenz (durchschnittliche interne Ähnlichkeit)
 * @private
 */
const calculateClusterCoherence = (embeddings) => {
  if (embeddings.length < 2) return 1;
  
  let totalSim = 0;
  let count = 0;
  
  for (let i = 0; i < embeddings.length; i++) {
    for (let j = i + 1; j < embeddings.length; j++) {
      totalSim += cosineSimilarity(embeddings[i], embeddings[j]);
      count++;
    }
  }
  
  return count > 0 ? (totalSim / count).toFixed(3) : 0;
};

/**
 * Extrahiert Schlüsselphrasen
 * Basiert auf Zentralität im semantischen Raum
 * @private
 */
const extractKeyPhrases = (wordEmbeddings, textEmbedding, tokens) => {
  if (wordEmbeddings.length === 0) return [];
  if (!textEmbedding || !textEmbedding.vector) return [];
  
  // Berechne Zentralität jedes Wortes (Ähnlichkeit zum Text-Embedding)
  const centralities = wordEmbeddings.map(we => ({
    word: we.word,
    position: we.position,
    posTag: we.posTag,
    entityType: we.entityType,
    centrality: cosineSimilarity(we.embedding, textEmbedding.vector),
    isContentWord: ['NOUN', 'VERB', 'ADJ', 'ADV'].includes(we.posTag)
  }));
  
  // Sortiere nach Zentralität
  const sortedByRelevance = centralities
    .sort((a, b) => b.centrality - a.centrality);
  
  // Bevorzuge Content Words
  const contentWords = sortedByRelevance.filter(c => c.isContentWord);
  const otherWords = sortedByRelevance.filter(c => !c.isContentWord);
  
  // Kombiniere: Hauptsächlich Content Words, einige andere
  const keyPhrases = [
    ...contentWords.slice(0, 8),
    ...otherWords.slice(0, 2)
  ].map(c => ({
    phrase: c.word,
    type: c.isContentWord ? 'content-word' : 'function-word',
    importance: parseFloat(c.centrality.toFixed(3)),
    position: c.position,
    posTag: c.posTag,
    entityType: c.entityType
  }));
  
  // Suche auch nach Mehrwort-Phrasen (aufeinanderfolgende wichtige Wörter)
  const multiWordPhrases = extractMultiWordPhrases(keyPhrases, tokens);
  
  return [...keyPhrases, ...multiWordPhrases]
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 15);
};

/**
 * Extrahiert Mehrwort-Phrasen
 * @private
 */
const extractMultiWordPhrases = (keyWords, tokens) => {
  const phrases = [];
  const keyPositions = new Set(keyWords.map(k => k.position));
  
  for (let i = 0; i < tokens.length - 1; i++) {
    const current = tokens[i];
    const next = tokens[i + 1];
    
    // Wenn beide Wörter Schlüsselwörter sind und aufeinander folgen
    if (keyPositions.has(current.position) && 
        keyPositions.has(next.position) &&
        !current.isPunctuation && !next.isPunctuation) {
      
      const avgImportance = (
        keyWords.find(k => k.position === current.position).importance +
        keyWords.find(k => k.position === next.position).importance
      ) / 2;
      
      phrases.push({
        phrase: `${current.text} ${next.text}`,
        type: 'multi-word',
        importance: avgImportance,
        position: current.position,
        posTag: `${current.posTag}+${next.posTag}`
      });
    }
  }
  
  return phrases.slice(0, 5);
};

/**
 * Berechnet Text-Kohäsion (semantischen Zusammenhang)
 * @private
 */
const calculateTextCohesion = (wordEmbeddings) => {
  if (wordEmbeddings.length < 2) {
    return {
      score: 0,
      interpretation: 'Zu wenig Wörter',
      method: 'pairwise-similarity'
    };
  }
  
  // Methode 1: Durchschnittliche paarweise Ähnlichkeit
  let totalSimilarity = 0;
  let comparisons = 0;
  
  for (let i = 0; i < wordEmbeddings.length - 1; i++) {
    const similarity = cosineSimilarity(
      wordEmbeddings[i].embedding,
      wordEmbeddings[i + 1].embedding
    );
    totalSimilarity += similarity;
    comparisons++;
  }
  
  const avgCohesion = comparisons > 0 ? totalSimilarity / comparisons : 0;
  
  // Methode 2: Varianz der Embeddings (niedrig = kohäsiv)
  const centroid = calculateCentroid(wordEmbeddings.map(we => we.embedding));
  const avgDistanceFromCenter = wordEmbeddings.reduce((sum, we) => 
    sum + (1 - cosineSimilarity(we.embedding, centroid)), 0
  ) / wordEmbeddings.length;
  
  // Kombinierte Kohäsions-Score
  const combinedScore = (avgCohesion * 0.6) + ((1 - avgDistanceFromCenter) * 0.4);
  
  let interpretation;
  if (combinedScore > 0.7) interpretation = 'Sehr kohäsiv';
  else if (combinedScore > 0.5) interpretation = 'Kohäsiv';
  else if (combinedScore > 0.3) interpretation = 'Moderat kohäsiv';
  else interpretation = 'Wenig kohäsiv';
  
  return {
    score: parseFloat(combinedScore.toFixed(3)),
    sequentialCohesion: parseFloat(avgCohesion.toFixed(3)),
    centralCohesion: parseFloat((1 - avgDistanceFromCenter).toFixed(3)),
    interpretation,
    method: 'combined'
  };
};

/**
 * Analysiert thematische Entwicklung im Text
 * Verwendet Sliding Window über Embeddings
 * 
 * @param {Array} wordEmbeddings - Word Embeddings mit Positionen
 * @param {number} windowSize - Größe des gleitenden Fensters
 * @returns {Object} Thematische Entwicklung
 */
export const analyzeThematicDevelopment = (wordEmbeddings, windowSize = 5) => {
  if (wordEmbeddings.length < windowSize * 2) {
    return {
      segments: [],
      shifts: [],
      consistency: 1,
      interpretation: 'Zu kurzer Text für Entwicklungsanalyse'
    };
  }
  
  const segments = [];
  
  // Erstelle Segmente mit Sliding Window
  for (let i = 0; i < wordEmbeddings.length - windowSize + 1; i += windowSize) {
    const window = wordEmbeddings.slice(i, i + windowSize);
    const windowEmbeddings = window.map(we => we.embedding);
    const centroid = calculateCentroid(windowEmbeddings);
    
    segments.push({
      startPosition: window[0].position,
      endPosition: window[window.length - 1].position,
      words: window.map(we => we.word),
      centroid,
      internalCoherence: calculateClusterCoherence(windowEmbeddings)
    });
  }
  
  // Analysiere thematische Shifts (große Änderungen zwischen Segmenten)
  const shifts = [];
  for (let i = 0; i < segments.length - 1; i++) {
    const similarity = cosineSimilarity(
      segments[i].centroid,
      segments[i + 1].centroid
    );
    
    const shift = 1 - similarity;
    
    // Signifikanter Shift wenn Ähnlichkeit niedrig
    if (similarity < 0.5) {
      shifts.push({
        position: segments[i].endPosition,
        fromSegment: i,
        toSegment: i + 1,
        shift: parseFloat(shift.toFixed(3)),
        fromWords: segments[i].words.slice(-3).join(', '),
        toWords: segments[i + 1].words.slice(0, 3).join(', '),
        type: shift > 0.7 ? 'major' : 'minor'
      });
    }
  }
  
  // Berechne Overall-Konsistenz
  const avgShift = shifts.length > 0
    ? shifts.reduce((sum, s) => sum + parseFloat(s.shift), 0) / shifts.length
    : 0;
  const consistency = 1 - avgShift;
  
  let interpretation;
  if (consistency > 0.7) interpretation = 'Thematisch konsistent';
  else if (consistency > 0.5) interpretation = 'Moderate thematische Entwicklung';
  else interpretation = 'Starke thematische Wechsel';
  
  return {
    segments: segments.map(s => ({
      startPosition: s.startPosition,
      endPosition: s.endPosition,
      words: s.words,
      coherence: s.internalCoherence
    })),
    shifts,
    consistency: parseFloat(consistency.toFixed(3)),
    interpretation,
    hasProgressiveNarrative: shifts.length > 0 && shifts.every(s => s.type === 'minor')
  };
};

/**
 * Berechnet semantische Diversität
 * 
 * @param {Array} wordEmbeddings - Word Embeddings
 * @returns {Object} Diversitäts-Metriken
 */
export const calculateSemanticDiversity = (wordEmbeddings) => {
  if (wordEmbeddings.length < 2) {
    return { diversity: 0, interpretation: 'Zu wenig Daten' };
  }
  
  // Berechne durchschnittliche paarweise Distanz
  let totalDistance = 0;
  let comparisons = 0;
  
  for (let i = 0; i < wordEmbeddings.length; i++) {
    for (let j = i + 1; j < wordEmbeddings.length; j++) {
      const distance = 1 - cosineSimilarity(
        wordEmbeddings[i].embedding,
        wordEmbeddings[j].embedding
      );
      totalDistance += distance;
      comparisons++;
    }
  }
  
  const avgDistance = comparisons > 0 ? totalDistance / comparisons : 0;
  
  let interpretation;
  if (avgDistance > 0.6) interpretation = 'Sehr divers';
  else if (avgDistance > 0.4) interpretation = 'Divers';
  else if (avgDistance > 0.2) interpretation = 'Moderat divers';
  else interpretation = 'Wenig divers (fokussiert)';
  
  return {
    diversity: parseFloat(avgDistance.toFixed(3)),
    interpretation,
    totalComparisons: comparisons
  };
};

export default {
  analyzeSemantics,
  analyzeThematicDevelopment,
  calculateSemanticDiversity,
  cosineSimilarity
};