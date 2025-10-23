import { getModel } from './modelLoader';

/**
 * Führt semantische Analyse durch
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
        embeddings: null,
        wordSimilarities: null,
        semanticFields: null,
        keyPhrases: extractKeyPhrasesRuleBased(tokens)
      };
    }

    // Generiere Embeddings für den gesamten Text
    const textEmbedding = await generateEmbedding(text, model);
    
    // Generiere Embeddings für einzelne Wörter
    const wordEmbeddings = await generateWordEmbeddings(tokens, model);
    
    // Berechne semantische Ähnlichkeiten
    const similarities = calculateWordSimilarities(wordEmbeddings);
    
    // Identifiziere semantische Felder
    const semanticFields = identifySemanticFields(wordEmbeddings, similarities);
    
    // Extrahiere Schlüsselphrasen
    const keyPhrases = await extractKeyPhrases(text, tokens, wordEmbeddings);
    
    return {
      textEmbedding,
      wordEmbeddings,
      similarities,
      semanticFields,
      keyPhrases,
      cohesion: calculateTextCohesion(wordEmbeddings)
    };
  } catch (error) {
    console.error('Semantische Analyse Fehler:', error);
    return {
      embeddings: null,
      wordSimilarities: null,
      semanticFields: null,
      keyPhrases: extractKeyPhrasesRuleBased(tokens),
      error: error.message
    };
  }
};

/**
 * Generiert Embedding für Text
 * @private
 */
const generateEmbedding = async (text, model) => {
  try {
    const result = await model(text, {
      pooling: 'mean',
      normalize: true
    });
    return Array.from(result.data);
  } catch (error) {
    console.error('Embedding Generation Fehler:', error);
    return null;
  }
};

/**
 * Generiert Embeddings für einzelne Wörter
 * @private
 */
const generateWordEmbeddings = async (tokens, model) => {
  const wordEmbeddings = [];
  
  // Batche Wörter für effizientere Verarbeitung
  const batchSize = 10;
  const words = tokens.filter(t => !t.isPunctuation && t.text.length > 2);
  
  for (let i = 0; i < words.length; i += batchSize) {
    const batch = words.slice(i, i + batchSize);
    
    try {
      const embeddings = await Promise.all(
        batch.map(async (token) => {
          try {
            const result = await model(token.text, {
              pooling: 'mean',
              normalize: true
            });
            return {
              token,
              embedding: Array.from(result.data),
              word: token.text
            };
          } catch (error) {
            return {
              token,
              embedding: null,
              word: token.text,
              error: true
            };
          }
        })
      );
      
      wordEmbeddings.push(...embeddings);
    } catch (error) {
      console.error('Batch Embedding Fehler:', error);
    }
  }
  
  return wordEmbeddings;
};

/**
 * Berechnet Cosinus-Ähnlichkeit zwischen zwei Vektoren
 * @private
 */
const cosineSimilarity = (vec1, vec2) => {
  if (!vec1 || !vec2 || vec1.length !== vec2.length) return 0;
  
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
 * Berechnet Ähnlichkeiten zwischen Wörtern
 * @private
 */
const calculateWordSimilarities = (wordEmbeddings) => {
  const similarities = [];
  const validEmbeddings = wordEmbeddings.filter(we => we.embedding && !we.error);
  
  for (let i = 0; i < validEmbeddings.length; i++) {
    for (let j = i + 1; j < validEmbeddings.length; j++) {
      const similarity = cosineSimilarity(
        validEmbeddings[i].embedding,
        validEmbeddings[j].embedding
      );
      
      if (similarity > 0.7) { // Nur hohe Ähnlichkeiten
        similarities.push({
          word1: validEmbeddings[i].word,
          word2: validEmbeddings[j].word,
          similarity: similarity.toFixed(3),
          position1: validEmbeddings[i].token.position,
          position2: validEmbeddings[j].token.position
        });
      }
    }
  }
  
  return similarities.sort((a, b) => b.similarity - a.similarity);
};

/**
 * Identifiziert semantische Felder (Wortgruppen mit ähnlicher Bedeutung)
 * @private
 */
const identifySemanticFields = (wordEmbeddings, similarities) => {
  const fields = [];
  const processed = new Set();
  
  similarities.forEach(sim => {
    if (processed.has(sim.word1) || processed.has(sim.word2)) return;
    
    const field = {
      theme: `${sim.word1} / ${sim.word2}`,
      words: [sim.word1, sim.word2],
      strength: parseFloat(sim.similarity)
    };
    
    // Finde weitere verwandte Wörter
    similarities.forEach(otherSim => {
      if (
        !processed.has(otherSim.word1) &&
        !processed.has(otherSim.word2) &&
        (field.words.includes(otherSim.word1) || field.words.includes(otherSim.word2))
      ) {
        if (!field.words.includes(otherSim.word1)) field.words.push(otherSim.word1);
        if (!field.words.includes(otherSim.word2)) field.words.push(otherSim.word2);
      }
    });
    
    if (field.words.length >= 2) {
      field.words.forEach(w => processed.add(w));
      fields.push(field);
    }
  });
  
  return fields.slice(0, 5); // Top 5 semantische Felder
};

/**
 * Extrahiert Schlüsselphrasen mit ML
 * @private
 */
const extractKeyPhrases = async (text, tokens, wordEmbeddings) => {
  // Kombiniere regelbasierte und embedding-basierte Extraktion
  const ruleBasedPhrases = extractKeyPhrasesRuleBased(tokens);
  const embeddingBasedPhrases = extractKeyPhrasesWithEmbeddings(wordEmbeddings);
  
  // Merge und dedupliziere
  const allPhrases = [...ruleBasedPhrases, ...embeddingBasedPhrases];
  const uniquePhrases = Array.from(
    new Map(allPhrases.map(p => [p.phrase.toLowerCase(), p])).values()
  );
  
  return uniquePhrases.slice(0, 10);
};

/**
 * Regelbasierte Schlüsselphrasen-Extraktion
 * @private
 */
const extractKeyPhrasesRuleBased = (tokens) => {
  const phrases = [];
  const nounPhrases = [];
  
  // Suche nach Nomen-Phrasen (Adjektiv + Nomen oder Nomen + Nomen)
  for (let i = 0; i < tokens.length - 1; i++) {
    if (tokens[i].isPunctuation) continue;
    
    const current = tokens[i];
    const next = tokens[i + 1];
    
    // Adjektiv + Nomen
    if (
      /^[A-ZÄÖÜ]/.test(next.text) &&
      !/^[A-ZÄÖÜ]/.test(current.text) &&
      current.text.length > 3
    ) {
      nounPhrases.push({
        phrase: `${current.text} ${next.text}`,
        type: 'adjektiv-nomen',
        position: current.position,
        importance: 0.7
      });
    }
    
    // Nomen + Nomen (Kompositum-Konstruktion)
    if (
      /^[A-ZÄÖÜ]/.test(current.text) &&
      /^[A-ZÄÖÜ]/.test(next.text)
    ) {
      nounPhrases.push({
        phrase: `${current.text} ${next.text}`,
        type: 'nomen-kompositum',
        position: current.position,
        importance: 0.8
      });
    }
  }
  
  // Suche nach einzelnen wichtigen Nomen
  tokens
    .filter(t => !t.isPunctuation && /^[A-ZÄÖÜ]/.test(t.text) && t.text.length > 4)
    .forEach(token => {
      nounPhrases.push({
        phrase: token.text,
        type: 'einzelnomen',
        position: token.position,
        importance: 0.6
      });
    });
  
  return nounPhrases.sort((a, b) => b.importance - a.importance).slice(0, 5);
};

/**
 * Embedding-basierte Schlüsselphrasen-Extraktion
 * @private
 */
const extractKeyPhrasesWithEmbeddings = (wordEmbeddings) => {
  const validEmbeddings = wordEmbeddings.filter(we => we.embedding && !we.error);
  
  if (validEmbeddings.length === 0) return [];
  
  // Berechne durchschnittliches Embedding
  const avgEmbedding = calculateAverageEmbedding(validEmbeddings);
  
  // Finde Wörter mit höchster Ähnlichkeit zum Durchschnitt (zentrale Themen)
  const centrality = validEmbeddings.map(we => ({
    word: we.word,
    position: we.token.position,
    centrality: cosineSimilarity(we.embedding, avgEmbedding)
  }));
  
  return centrality
    .sort((a, b) => b.centrality - a.centrality)
    .slice(0, 5)
    .map(item => ({
      phrase: item.word,
      type: 'zentral',
      position: item.position,
      importance: item.centrality
    }));
};

/**
 * Berechnet durchschnittliches Embedding
 * @private
 */
const calculateAverageEmbedding = (wordEmbeddings) => {
  if (wordEmbeddings.length === 0) return null;
  
  const dimension = wordEmbeddings[0].embedding.length;
  const avgEmbedding = new Array(dimension).fill(0);
  
  wordEmbeddings.forEach(we => {
    we.embedding.forEach((value, index) => {
      avgEmbedding[index] += value;
    });
  });
  
  return avgEmbedding.map(value => value / wordEmbeddings.length);
};

/**
 * Berechnet Text-Kohäsion (wie gut hängen die Wörter zusammen)
 * @private
 */
const calculateTextCohesion = (wordEmbeddings) => {
  const validEmbeddings = wordEmbeddings.filter(we => we.embedding && !we.error);
  
  if (validEmbeddings.length < 2) {
    return { score: 0, interpretation: 'Zu wenig Wörter' };
  }
  
  let totalSimilarity = 0;
  let comparisons = 0;
  
  // Berechne durchschnittliche Ähnlichkeit zwischen aufeinanderfolgenden Wörtern
  for (let i = 0; i < validEmbeddings.length - 1; i++) {
    const similarity = cosineSimilarity(
      validEmbeddings[i].embedding,
      validEmbeddings[i + 1].embedding
    );
    totalSimilarity += similarity;
    comparisons++;
  }
  
  const avgCohesion = comparisons > 0 ? totalSimilarity / comparisons : 0;
  
  let interpretation;
  if (avgCohesion > 0.7) interpretation = 'Sehr kohäsiv';
  else if (avgCohesion > 0.5) interpretation = 'Kohäsiv';
  else if (avgCohesion > 0.3) interpretation = 'Moderat kohäsiv';
  else interpretation = 'Wenig kohäsiv';
  
  return {
    score: avgCohesion.toFixed(3),
    interpretation
  };
};

/**
 * Findet thematische Entwicklung im Text
 * @param {Array} wordEmbeddings - Word Embeddings mit Positionen
 * @param {number} windowSize - Größe des gleitenden Fensters
 * @returns {Array} Thematische Entwicklung
 */
export const analyzeThematicDevelopment = (wordEmbeddings, windowSize = 5) => {
  const validEmbeddings = wordEmbeddings.filter(we => we.embedding && !we.error);
  const development = [];
  
  for (let i = 0; i < validEmbeddings.length - windowSize; i += windowSize) {
    const window = validEmbeddings.slice(i, i + windowSize);
    const avgEmbedding = calculateAverageEmbedding(window);
    
    development.push({
      position: i,
      words: window.map(we => we.word),
      embedding: avgEmbedding,
      startPosition: window[0].token.position,
      endPosition: window[window.length - 1].token.position
    });
  }
  
  // Berechne thematische Shifts (wo ändert sich das Thema stark)
  const shifts = [];
  for (let i = 0; i < development.length - 1; i++) {
    const similarity = cosineSimilarity(
      development[i].embedding,
      development[i + 1].embedding
    );
    
    if (similarity < 0.5) { // Niedriger = größerer thematischer Shift
      shifts.push({
        position: development[i].endPosition,
        shift: (1 - similarity).toFixed(3),
        before: development[i].words.join(', '),
        after: development[i + 1].words.join(', ')
      });
    }
  }
  
  return {
    development,
    thematicShifts: shifts
  };
};