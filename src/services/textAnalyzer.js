import { prepareForModel, validateText } from '../utils/textPreprocessing';
import { analyzeSentiment, analyzeSentenceSentiment, analyzeWordSentiment, calculateSentimentStatistics, findEmotionalPeaks, analyzeSentimentTrend } from './sentimentAnalysis';
import { analyzeTokens, analyzeWordFrequencies, findCompoundWords, findRareWords, analyzeTokenDiversity } from './tokenAnalysis';
import { analyzeSyntax } from './syntaxAnalysis';
import { analyzeSemantics, analyzeThematicDevelopment, calculateSemanticDiversity } from './semanticAnalysis';
import { isModelLoaded } from './modelLoader';
import { FEATURES, MODEL_GROUPS } from '../utils//constants';

/**
 * Hauptklasse für Text-Analyse
 * Orchestriert alle Analyse-Module
 */
class TextAnalyzer {
  constructor() {
    this.currentAnalysis = null;
    this.isAnalyzing = false;
    this.analysisCache = new Map();
  }

  /**
   * Führt vollständige Analyse durch
   * Komplett modellbasiert, keine Heuristiken
   * 
   * @param {string} text - Input Text
   * @param {Object} options - Analyse-Optionen
   * @param {function} progressCallback - Callback für Fortschritt
   * @returns {Promise<Object>} Vollständiges Analyse-Ergebnis
   */
  async analyze(text, options = {}, progressCallback = null) {
    // Validiere Input
    const validation = validateText(text);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    this.isAnalyzing = true;
    const startTime = Date.now();
    
    try {
      const {
        enabledModules = ['all'],
        detailedAnalysis = true,
        includeMetrics = true
      } = options;

      // Schritt 1: Text-Vorbereitung (5%)
      this.updateProgress(progressCallback, 5, 'Bereite Text vor...');
      const prepared = prepareForModel(validation.text);
      const { tokens, sentences, statistics, readability } = prepared;

      // Schritt 2: Token-Level-Analyse (20%)
      this.updateProgress(progressCallback, 20, 'Analysiere Tokens (POS, NER)...');
      let tokenAnalysis = tokens;
      let frequencies = null;
      let compounds = null;
      let tokenDiversity = null;
      
      if (this.shouldRunModule('tokens', enabledModules)) {
        tokenAnalysis = await analyzeTokens(validation.text, tokens);
        
        if (detailedAnalysis) {
          frequencies = analyzeWordFrequencies(tokenAnalysis);
          compounds = findCompoundWords(tokenAnalysis);
          tokenDiversity = analyzeTokenDiversity(tokenAnalysis);
        }
      }

      // Schritt 3: Sentiment-Analyse (40%)
      this.updateProgress(progressCallback, 40, 'Analysiere Sentiment...');
      let sentimentResults = null;
      
      if (this.shouldRunModule('sentiment', enabledModules) && isModelLoaded('SENTIMENT')) {
        sentimentResults = {
          overall: await analyzeSentiment(validation.text),
          sentences: await analyzeSentenceSentiment(sentences),
          words: await analyzeWordSentiment(validation.text, tokenAnalysis),
          statistics: null,
          peaks: null,
          trend: null
        };
        
        sentimentResults.statistics = calculateSentimentStatistics(sentimentResults.words);
        
        if (detailedAnalysis) {
          sentimentResults.peaks = findEmotionalPeaks(sentimentResults.words);
          sentimentResults.trend = analyzeSentimentTrend(sentimentResults.words);
        }
      }

      // Schritt 4: Syntaktische Analyse (60%)
      this.updateProgress(progressCallback, 60, 'Analysiere Syntax...');
      let syntaxAnalysis = null;
      
      if (this.shouldRunModule('syntax', enabledModules)) {
        syntaxAnalysis = await analyzeSyntax(validation.text, tokenAnalysis);
      }

      // Schritt 5: Semantische Analyse (80%)
      this.updateProgress(progressCallback, 80, 'Analysiere Semantik...');
      let semanticResults = null;
      let semanticDiversity = null;
      
      if (this.shouldRunModule('semantics', enabledModules) && 
          isModelLoaded('EMBEDDINGS') && 
          FEATURES.SEMANTIC_SIMILARITY) {
        semanticResults = await analyzeSemantics(validation.text, tokenAnalysis);
        
        if (detailedAnalysis && semanticResults.wordEmbeddings.length > 0) {
          semanticDiversity = calculateSemanticDiversity(semanticResults.wordEmbeddings);
        }
      }

      // Schritt 6: Zusammenfassung und Metriken (95%)
      this.updateProgress(progressCallback, 95, 'Erstelle Zusammenfassung...');
      
      const summary = this.generateAdvancedSummary({
        tokens: tokenAnalysis,
        sentences,
        readability,
        statistics,
        sentiment: sentimentResults,
        syntax: syntaxAnalysis,
        semantics: semanticResults,
        frequencies,
        tokenDiversity,
        semanticDiversity
      });

      // Schritt 7: Qualitäts-Metriken (100%)
      this.updateProgress(progressCallback, 100, 'Analyse abgeschlossen!');
      
      let qualityMetrics = null;
      if (includeMetrics) {
        qualityMetrics = this.calculateQualityMetrics({
          sentiment: sentimentResults,
          syntax: syntaxAnalysis,
          semantics: semanticResults,
          readability
        });
      }

      // Erstelle Analyse-Ergebnis
      const analysis = {
        metadata: {
          analyzedAt: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          textLength: validation.text.length,
          modelsUsed: this.getUsedModels(),
          analysisVersion: '2.0.0',
          options
        },
        text: {
          original: validation.text,
          normalized: prepared.normalized,
          statistics
        },
        tokens: {
          all: tokenAnalysis,
          count: tokenAnalysis.length,
          words: tokenAnalysis.filter(t => !t.isPunctuation),
          punctuation: tokenAnalysis.filter(t => t.isPunctuation)
        },
        sentences: {
          all: sentences,
          count: sentences.length
        },
        readability,
        frequencies,
        compounds,
        tokenDiversity,
        sentiment: sentimentResults,
        syntax: syntaxAnalysis,
        semantics: semanticResults,
        semanticDiversity,
        summary,
        qualityMetrics
      };

      this.currentAnalysis = analysis;
      this.isAnalyzing = false;
      
      // Cache Ergebnis
      this.cacheAnalysis(validation.text, analysis);
      
      return analysis;

    } catch (error) {
      this.isAnalyzing = false;
      console.error('Analyse Fehler:', error);
      throw new Error(`Analyse fehlgeschlagen: ${error.message}`);
    }
  }

  /**
   * Analysiert nur bestimmte Aspekte (schnellere Teilanalyse)
   * 
   * @param {string} text - Input Text
   * @param {Array} aspects - Gewünschte Analyse-Aspekte
   * @returns {Promise<Object>} Partial Analyse
   */
  async analyzePartial(text, aspects = ['tokens', 'sentiment']) {
    const validation = validateText(text);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const result = {
      metadata: {
        analyzedAt: new Date().toISOString(),
        type: 'partial',
        aspects
      }
    };

    const prepared = prepareForModel(validation.text);
    const { tokens } = prepared;

    // Tokens
    if (aspects.includes('tokens')) {
      result.tokens = await analyzeTokens(validation.text, tokens);
    }

    // Sentiment
    if (aspects.includes('sentiment') && isModelLoaded('SENTIMENT')) {
      result.sentiment = {
        overall: await analyzeSentiment(validation.text),
        words: await analyzeWordSentiment(validation.text, tokens)
      };
    }

    // Syntax
    if (aspects.includes('syntax')) {
      result.syntax = await analyzeSyntax(validation.text, tokens);
    }

    // Semantik
    if (aspects.includes('semantics') && isModelLoaded('EMBEDDINGS')) {
      result.semantics = await analyzeSemantics(validation.text, tokens);
    }

    return result;
  }

  /**
   * Analysiert einzelnes Wort im Kontext
   * 
   * @param {string} word - Wort
   * @param {string} context - Kontext-Text
   * @returns {Promise<Object>} Wort-Analyse
   */
  async analyzeWord(word, context) {
    const prepared = prepareForModel(context);
    const { tokens } = prepared;
    
    const wordToken = tokens.find(t => 
      t.text.toLowerCase() === word.toLowerCase()
    );

    if (!wordToken) {
      throw new Error('Wort nicht im Kontext gefunden');
    }

    const analysis = {
      word,
      token: wordToken,
      context: context.slice(
        Math.max(0, wordToken.index - 50),
        Math.min(context.length, wordToken.index + 50)
      )
    };

    // Token-Features
    const tokenAnalysis = await analyzeTokens(context, tokens);
    const analyzedToken = tokenAnalysis.find(t => t.position === wordToken.position);
    analysis.tokenFeatures = analyzedToken;

    // Sentiment
    if (isModelLoaded('SENTIMENT')) {
      const sentimentAnalysis = await analyzeWordSentiment(context, tokens);
      const wordSentiment = sentimentAnalysis.find(t => t.position === wordToken.position);
      analysis.sentiment = wordSentiment?.sentiment;
    }

    // Embedding
    if (isModelLoaded('EMBEDDINGS')) {
      const semantics = await analyzeSemantics(context, tokens);
      const wordEmb = semantics.wordEmbeddings.find(we => 
        we.position === wordToken.position
      );
      analysis.embedding = wordEmb;
    }

    return analysis;
  }

  /**
   * Vergleicht zwei Texte
   * 
   * @param {string} text1 - Erster Text
   * @param {string} text2 - Zweiter Text
   * @returns {Promise<Object>} Vergleichs-Ergebnis
   */
  async compareTexts(text1, text2) {
    const [analysis1, analysis2] = await Promise.all([
      this.analyze(text1, { detailedAnalysis: false }),
      this.analyze(text2, { detailedAnalysis: false })
    ]);

    return {
      text1: {
        summary: analysis1.summary,
        length: text1.length
      },
      text2: {
        summary: analysis2.summary,
        length: text2.length
      },
      comparison: {
        lengthDifference: Math.abs(text1.length - text2.length),
        lengthRatio: (Math.min(text1.length, text2.length) / Math.max(text1.length, text2.length)).toFixed(3),
        
        sentimentComparison: this.compareSentiment(
          analysis1.sentiment,
          analysis2.sentiment
        ),
        
        complexityComparison: this.compareComplexity(
          analysis1.readability,
          analysis2.readability,
          analysis1.syntax,
          analysis2.syntax
        ),
        
        thematicSimilarity: this.compareThemes(
          analysis1.semantics,
          analysis2.semantics
        ),
        
        styleSimilarity: this.compareStyle(
          analysis1.syntax,
          analysis2.syntax
        )
      }
    };
  }

  /**
   * Generiert erweiterte Zusammenfassung
   * @private
   */
  generateAdvancedSummary(data) {
    const { tokens, sentences, readability, statistics, sentiment, syntax, semantics, frequencies, tokenDiversity, semanticDiversity } = data;

    const words = tokens.filter(t => !t.isPunctuation);
    const avgWordLength = words.length > 0
      ? (words.reduce((sum, t) => sum + t.text.length, 0) / words.length).toFixed(2)
      : 0;

    return {
      basicStats: {
        wordCount: words.length,
        uniqueWords: frequencies ? frequencies.uniqueWords : 0,
        sentenceCount: sentences.length,
        avgWordLength,
        avgWordsPerSentence: readability.avgWordsPerSentence,
        readingEase: readability.readingEase,
        wienerIndex: readability.wienerIndex,
        lexicalDensity: readability.lexicalDensity
      },
      
      sentiment: sentiment ? {
        overall: sentiment.overall.label,
        confidence: sentiment.overall.confidence,
        distribution: sentiment.statistics.distribution,
        dominantEmotion: sentiment.statistics.dominant,
        emotionalRange: this.calculateEmotionalRange(sentiment)
      } : null,
      
      style: {
        syntacticComplexity: syntax?.complexity?.level || 'Unbekannt',
        punctuationStyle: syntax?.punctuationPattern?.dominantType || 'Neutral',
        hasRhymes: syntax?.rhymeScheme !== null,
        rhymeScheme: syntax?.rhymeScheme?.description?.label || 'Keins',
        repetitionsCount: syntax?.repetitions?.total || 0,
        parallelismsCount: syntax?.parallelism?.length || 0
      },
      
      themes: semantics && semantics.keyPhrases ? 
        semantics.keyPhrases.slice(0, 8).map(p => ({
          phrase: p.phrase,
          importance: p.importance,
          type: p.type
        })) : [],
      
      semanticFields: semantics && semantics.semanticFields ?
        semantics.semanticFields.slice(0, 5).map(f => ({
          theme: f.theme,
          wordCount: f.size,
          coherence: f.coherence
        })) : [],
      
      cohesion: semantics?.cohesion || null,
      
      diversity: {
        lexical: frequencies ? parseFloat(frequencies.lexicalDiversity) : 0,
        semantic: semanticDiversity ? parseFloat(semanticDiversity.diversity) : 0,
        interpretation: this.interpretDiversity(
          frequencies?.lexicalDiversity,
          semanticDiversity?.diversity
        )
      },
      
      linguisticFeatures: {
        posDistribution: tokenDiversity?.posDistribution?.slice(0, 5) || [],
        contentWordRatio: tokenDiversity?.contentWordRatio || 0,
        namedEntityRatio: tokenDiversity?.namedEntityRatio || 0,
        compoundCount: data.compounds?.length || 0
      },
      
      textType: this.classifyTextType({
        hasVerses: syntax?.verseStructure !== null,
        hasRhymes: syntax?.rhymeScheme !== null,
        avgSentenceLength: parseFloat(readability.avgWordsPerSentence),
        complexity: syntax?.complexity
      })
    };
  }

  /**
   * Berechnet Qualitäts-Metriken
   * @private
   */
  calculateQualityMetrics(data) {
    const { sentiment, syntax, semantics, readability } = data;
    
    const metrics = {
      confidence: {},
      coverage: {},
      quality: {}
    };

    // Konfidenz-Metriken
    if (sentiment) {
      metrics.confidence.sentiment = parseFloat(sentiment.statistics.averageConfidence);
    }
    
    if (semantics && semantics.cohesion) {
      metrics.confidence.semanticCohesion = parseFloat(semantics.cohesion.score);
    }

    // Coverage-Metriken (wie viel wurde annotiert)
    if (syntax) {
      const totalTokens = data.readability.wordCount;
      metrics.coverage.posTagged = syntax.sentenceStructure?.[0]?.posDistribution ? 1.0 : 0.0;
      metrics.coverage.syntaxAnalyzed = syntax.dependencies ? 1.0 : 0.5;
    }

    // Qualitäts-Metriken
    metrics.quality.readabilityScore = this.normalizeScore(parseFloat(readability.readingEase), 0, 100);
    metrics.quality.complexityScore = syntax?.complexity?.score || 0;
    
    if (semantics) {
      metrics.quality.semanticRichness = semantics.keyPhrases?.length || 0;
    }

    // Overall-Score
    const avgConfidence = Object.values(metrics.confidence).reduce((a, b) => a + b, 0) / 
      Math.max(Object.values(metrics.confidence).length, 1);
    const avgCoverage = Object.values(metrics.coverage).reduce((a, b) => a + b, 0) /
      Math.max(Object.values(metrics.coverage).length, 1);
    
    metrics.overall = {
      confidence: avgConfidence.toFixed(3),
      coverage: avgCoverage.toFixed(3),
      score: ((avgConfidence * 0.6) + (avgCoverage * 0.4)).toFixed(3)
    };

    return metrics;
  }

  /**
   * Berechnet emotionale Bandbreite
   * @private
   */
  calculateEmotionalRange(sentiment) {
    if (!sentiment || !sentiment.statistics) return 0;
    
    const dist = sentiment.statistics.distribution;
    const values = [
      parseFloat(dist.positive),
      parseFloat(dist.negative),
      parseFloat(dist.neutral)
    ];
    
    const max = Math.max(...values);
    const min = Math.min(...values);
    
    return ((max - min) / 100).toFixed(3);
  }

  /**
   * Interpretiert Diversität
   * @private
   */
  interpretDiversity(lexical, semantic) {
    const lex = parseFloat(lexical) || 0;
    const sem = parseFloat(semantic) || 0;
    const avg = (lex + sem) / 2;
    
    if (avg > 0.6) return 'Sehr divers';
    if (avg > 0.4) return 'Divers';
    if (avg > 0.2) return 'Moderat';
    return 'Fokussiert';
  }

  /**
   * Klassifiziert Texttyp
   * @private
   */
  classifyTextType(features) {
    if (features.hasVerses && features.hasRhymes) {
      return { type: 'Gedicht (gereimt)', confidence: 0.9 };
    }
    if (features.hasVerses) {
      return { type: 'Gedicht (frei)', confidence: 0.8 };
    }
    if (features.avgSentenceLength > 25 && features.complexity?.level === 'Sehr komplex') {
      return { type: 'Akademischer Text', confidence: 0.7 };
    }
    if (features.avgSentenceLength < 12) {
      return { type: 'Einfacher Text', confidence: 0.7 };
    }
    return { type: 'Prosa', confidence: 0.6 };
  }

  /**
   * Vergleicht Sentiment zwischen Texten
   * @private
   */
  compareSentiment(sent1, sent2) {
    if (!sent1 || !sent2) return null;

    const score1 = sent1.overall.label === 'positiv' ? 1 : 
                   sent1.overall.label === 'negativ' ? -1 : 0;
    const score2 = sent2.overall.label === 'positiv' ? 1 : 
                   sent2.overall.label === 'negativ' ? -1 : 0;

    return {
      difference: Math.abs(score1 - score2),
      similar: score1 === score2,
      text1Sentiment: sent1.overall.label,
      text2Sentiment: sent2.overall.label,
      text1Confidence: sent1.overall.confidence,
      text2Confidence: sent2.overall.confidence
    };
  }

  /**
   * Vergleicht Komplexität zwischen Texten
   * @private
   */
  compareComplexity(read1, read2, syn1, syn2) {
    return {
      readabilityDiff: Math.abs(
        parseFloat(read1.readingEase) - parseFloat(read2.readingEase)
      ).toFixed(2),
      complexityDiff: syn1 && syn2 ? Math.abs(
        syn1.complexity.score - syn2.complexity.score
      ) : 0,
      text1Level: syn1?.complexity?.level || 'Unbekannt',
      text2Level: syn2?.complexity?.level || 'Unbekannt'
    };
  }

  /**
   * Vergleicht Themen zwischen Texten
   * @private
   */
  compareThemes(sem1, sem2) {
    if (!sem1?.keyPhrases || !sem2?.keyPhrases) return null;

    const phrases1 = new Set(sem1.keyPhrases.map(p => p.phrase.toLowerCase()));
    const phrases2 = new Set(sem2.keyPhrases.map(p => p.phrase.toLowerCase()));

    const intersection = new Set([...phrases1].filter(x => phrases2.has(x)));
    const union = new Set([...phrases1, ...phrases2]);
    const jaccardSim = intersection.size / union.size;

    return {
      similarity: jaccardSim.toFixed(3),
      commonThemes: Array.from(intersection),
      uniqueToText1: Array.from(phrases1).filter(x => !phrases2.has(x)).slice(0, 5),
      uniqueToText2: Array.from(phrases2).filter(x => !phrases1.has(x)).slice(0, 5)
    };
  }

  /**
   * Vergleicht Stil zwischen Texten
   * @private
   */
  compareStyle(syn1, syn2) {
    if (!syn1 || !syn2) return null;

    return {
      rhymeSchemeSimilar: syn1.rhymeScheme?.scheme === syn2.rhymeScheme?.scheme,
      repetitionsComparison: {
        text1: syn1.repetitions?.total || 0,
        text2: syn2.repetitions?.total || 0
      },
      complexityComparison: {
        text1: syn1.complexity?.score || 0,
        text2: syn2.complexity?.score || 0
      }
    };
  }

  // ===================== Utility Methods =====================

  shouldRunModule(module, enabledModules) {
    if (enabledModules.includes('all')) return true;
    return enabledModules.includes(module);
  }

  getUsedModels() {
    return {
      sentiment: isModelLoaded('SENTIMENT'),
      ner: isModelLoaded('NER'),
      pos: isModelLoaded('POS'),
      dependency: isModelLoaded('DEPENDENCY'),
      embeddings: isModelLoaded('EMBEDDINGS'),
      emotion: isModelLoaded('EMOTION'),
      morphology: isModelLoaded('MORPHOLOGY')
    };
  }

  updateProgress(callback, progress, message) {
    if (callback) {
      callback({ progress, message });
    }
  }

  normalizeScore(value, min, max) {
    return ((value - min) / (max - min)).toFixed(3);
  }

  cacheAnalysis(text, analysis) {
    const hash = this.hashText(text);
    this.analysisCache.set(hash, {
      analysis,
      timestamp: Date.now()
    });
    
    // Limit cache size
    if (this.analysisCache.size > 10) {
      const firstKey = this.analysisCache.keys().next().value;
      this.analysisCache.delete(firstKey);
    }
  }

  hashText(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }

  getCurrentAnalysis() {
    return this.currentAnalysis;
  }

  clearAnalysis() {
    this.currentAnalysis = null;
  }

  clearCache() {
    this.analysisCache.clear();
  }
}

// Singleton Instance
const textAnalyzer = new TextAnalyzer();

export default textAnalyzer;

// Export wichtiger Funktionen
export const analyzeText = (text, options, progressCallback) => 
  textAnalyzer.analyze(text, options, progressCallback);

export const analyzePartialText = (text, aspects) => 
  textAnalyzer.analyzePartial(text, aspects);

export const analyzeWord = (word, context) => 
  textAnalyzer.analyzeWord(word, context);

export const compareTexts = (text1, text2) => 
  textAnalyzer.compareTexts(text1, text2);