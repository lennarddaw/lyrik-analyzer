import { tokenizeText, sentenceSegmentation, validateText, calculateReadabilityMetrics } from '../utils/textPreprocessing';
import { analyzeSentiment, analyzeSentenceSentiment, analyzeWordSentiment, calculateSentimentStatistics } from './sentimentAnalysis';
import { analyzeTokens, analyzeWordFrequencies, findCompoundWords } from './tokenAnalysis';
import { analyzeSyntax } from './syntaxAnalysis';
import { analyzeSemantics, analyzeThematicDevelopment } from './semanticAnalysis';
import { isModelLoaded } from './modelLoader';

/**
 * Hauptklasse für Text-Analyse
 */
class TextAnalyzer {
  constructor() {
    this.currentAnalysis = null;
    this.isAnalyzing = false;
  }

  /**
   * Führt vollständige Analyse durch
   * @param {string} text - Input Text
   * @param {Object} options - Analyse-Optionen
   * @param {function} progressCallback - Callback für Fortschritt
   * @returns {Promise<Object>} Analyse-Ergebnis
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
      // Schritt 1: Preprocessing (10%)
      this.updateProgress(progressCallback, 10, 'Tokenisierung läuft...');
      const tokens = tokenizeText(validation.text);
      const sentences = sentenceSegmentation(validation.text);
      const readability = calculateReadabilityMetrics(validation.text);

      // Schritt 2: Token-Analyse (25%)
      this.updateProgress(progressCallback, 25, 'Token-Analyse läuft...');
      const tokenAnalysis = isModelLoaded('NER') 
        ? await analyzeTokens(validation.text, tokens)
        : tokens;
      const frequencies = analyzeWordFrequencies(tokenAnalysis);
      const compounds = findCompoundWords(tokenAnalysis);

      // Schritt 3: Sentiment-Analyse (45%)
      this.updateProgress(progressCallback, 45, 'Sentiment-Analyse läuft...');
      let sentimentResults = null;
      if (isModelLoaded('SENTIMENT')) {
        sentimentResults = {
          overall: await analyzeSentiment(validation.text),
          sentences: await analyzeSentenceSentiment(sentences),
          words: await analyzeWordSentiment(validation.text, tokens),
          statistics: null
        };
        sentimentResults.statistics = calculateSentimentStatistics(sentimentResults.words);
      }

      // Schritt 4: Syntax-Analyse (65%)
      this.updateProgress(progressCallback, 65, 'Syntax-Analyse läuft...');
      const syntaxAnalysis = analyzeSyntax(validation.text, tokenAnalysis);

      // Schritt 5: Semantische Analyse (85%)
      this.updateProgress(progressCallback, 85, 'Semantische Analyse läuft...');
      let semanticResults = null;
      if (isModelLoaded('EMBEDDINGS')) {
        semanticResults = await analyzeSemantics(validation.text, tokenAnalysis);
        if (semanticResults.wordEmbeddings && semanticResults.wordEmbeddings.length > 0) {
          semanticResults.thematicDevelopment = analyzeThematicDevelopment(
            semanticResults.wordEmbeddings,
            5
          );
        }
      }

      // Schritt 6: Zusammenfassung (100%)
      this.updateProgress(progressCallback, 100, 'Analyse abgeschlossen!');

      const analysis = {
        metadata: {
          analyzedAt: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          textLength: validation.text.length,
          modelsUsed: this.getUsedModels()
        },
        text: {
          original: validation.text,
          normalized: validation.text.trim()
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
        sentiment: sentimentResults,
        syntax: syntaxAnalysis,
        semantics: semanticResults,
        summary: this.generateSummary({
          tokens: tokenAnalysis,
          sentences,
          readability,
          sentiment: sentimentResults,
          syntax: syntaxAnalysis,
          semantics: semanticResults
        })
      };

      this.currentAnalysis = analysis;
      this.isAnalyzing = false;
      return analysis;

    } catch (error) {
      this.isAnalyzing = false;
      console.error('Analyse Fehler:', error);
      throw error;
    }
  }

  /**
   * Analysiert nur bestimmte Aspekte
   * @param {string} text - Input Text
   * @param {Array} aspects - Gewünschte Analyse-Aspekte
   * @returns {Promise<Object>} Partial Analyse
   */
  async analyzePartial(text, aspects = ['tokens', 'sentiment']) {
    const validation = validateText(text);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const result = {};
    const tokens = tokenizeText(validation.text);

    if (aspects.includes('tokens')) {
      result.tokens = isModelLoaded('NER')
        ? await analyzeTokens(validation.text, tokens)
        : tokens;
    }

    if (aspects.includes('sentiment') && isModelLoaded('SENTIMENT')) {
      result.sentiment = {
        overall: await analyzeSentiment(validation.text),
        words: await analyzeWordSentiment(validation.text, tokens)
      };
    }

    if (aspects.includes('syntax')) {
      result.syntax = analyzeSyntax(validation.text, tokens);
    }

    if (aspects.includes('semantics') && isModelLoaded('EMBEDDINGS')) {
      result.semantics = await analyzeSemantics(validation.text, tokens);
    }

    return result;
  }

  /**
   * Analysiert einzelnes Wort im Kontext
   * @param {string} word - Wort
   * @param {string} context - Kontext-Text
   * @returns {Promise<Object>} Wort-Analyse
   */
  async analyzeWord(word, context) {
    const tokens = tokenizeText(context);
    const wordToken = tokens.find(t => t.text.toLowerCase() === word.toLowerCase());

    if (!wordToken) {
      throw new Error('Wort nicht im Kontext gefunden');
    }

    const analysis = {
      word,
      token: wordToken
    };

    // Token-Features
    if (isModelLoaded('NER')) {
      const tokenAnalysis = await analyzeTokens(context, tokens);
      const analyzedToken = tokenAnalysis.find(t => t.position === wordToken.position);
      analysis.tokenFeatures = analyzedToken;
    }

    // Sentiment
    if (isModelLoaded('SENTIMENT')) {
      const sentimentAnalysis = await analyzeWordSentiment(context, tokens);
      const wordSentiment = sentimentAnalysis.find(t => t.position === wordToken.position);
      analysis.sentiment = wordSentiment?.sentiment;
    }

    return analysis;
  }

  /**
   * Vergleicht zwei Texte
   * @param {string} text1 - Erster Text
   * @param {string} text2 - Zweiter Text
   * @returns {Promise<Object>} Vergleichs-Ergebnis
   */
  async compareTexts(text1, text2) {
    const [analysis1, analysis2] = await Promise.all([
      this.analyze(text1),
      this.analyze(text2)
    ]);

    return {
      text1: analysis1.summary,
      text2: analysis2.summary,
      comparison: {
        lengthDifference: Math.abs(text1.length - text2.length),
        sentimentDifference: this.compareSentiment(
          analysis1.sentiment,
          analysis2.sentiment
        ),
        complexityDifference: this.compareComplexity(
          analysis1.readability,
          analysis2.readability
        ),
        thematicSimilarity: this.compareThemes(
          analysis1.semantics,
          analysis2.semantics
        )
      }
    };
  }

  /**
   * Generiert Zusammenfassung der Analyse
   * @private
   */
  generateSummary(data) {
    const { tokens, sentences, readability, sentiment, syntax, semantics } = data;

    const wordCount = tokens.filter(t => !t.isPunctuation).length;
    const avgWordLength = (tokens.filter(t => !t.isPunctuation)
      .reduce((sum, t) => sum + t.text.length, 0) / wordCount).toFixed(2);

    return {
      basicStats: {
        wordCount,
        sentenceCount: sentences.length,
        avgWordLength,
        avgWordsPerSentence: readability.avgWordsPerSentence,
        readingEase: readability.readingEase
      },
      sentiment: sentiment ? {
        overall: sentiment.overall.label,
        confidence: sentiment.overall.confidence,
        distribution: sentiment.statistics.distribution
      } : null,
      style: {
        punctuationStyle: syntax.punctuationPattern.style,
        hasRhymes: syntax.rhymeScheme !== null,
        rhymeScheme: syntax.rhymeScheme?.description || 'Keine',
        alliterationsCount: syntax.alliterations.length,
        repetitionsCount: syntax.repetitions.length
      },
      themes: semantics && semantics.keyPhrases ? 
        semantics.keyPhrases.slice(0, 5).map(p => p.phrase) : [],
      complexity: this.assessComplexity(readability, tokens, syntax)
    };
  }

  /**
   * Bewertet Text-Komplexität
   * @private
   */
  assessComplexity(readability, tokens, syntax) {
    let score = 0;

    // Wortlänge
    const avgLength = parseFloat(readability.avgSyllablesPerWord);
    score += Math.min(avgLength / 3, 1) * 25;

    // Satzlänge
    const avgSentenceLength = parseFloat(readability.avgWordsPerSentence);
    score += Math.min(avgSentenceLength / 20, 1) * 25;

    // Syntax-Komplexität
    const avgSentenceComplexity = syntax.sentenceStructure.reduce(
      (sum, s) => sum + s.complexity, 0
    ) / Math.max(syntax.sentenceStructure.length, 1);
    score += (avgSentenceComplexity / 100) * 25;

    // Wortschatz-Diversität
    const uniqueWords = new Set(
      tokens.filter(t => !t.isPunctuation).map(t => t.text.toLowerCase())
    );
    const diversity = uniqueWords.size / tokens.filter(t => !t.isPunctuation).length;
    score += diversity * 25;

    let level;
    if (score > 75) level = 'Sehr komplex';
    else if (score > 50) level = 'Komplex';
    else if (score > 25) level = 'Mittel';
    else level = 'Einfach';

    return { score: Math.round(score), level };
  }

  /**
   * Vergleicht Sentiment zwischen zwei Analysen
   * @private
   */
  compareSentiment(sentiment1, sentiment2) {
    if (!sentiment1 || !sentiment2) return null;

    const score1 = sentiment1.overall.label === 'positiv' ? 1 : 
                   sentiment1.overall.label === 'negativ' ? -1 : 0;
    const score2 = sentiment2.overall.label === 'positiv' ? 1 : 
                   sentiment2.overall.label === 'negativ' ? -1 : 0;

    return {
      difference: Math.abs(score1 - score2),
      similar: score1 === score2,
      text1Sentiment: sentiment1.overall.label,
      text2Sentiment: sentiment2.overall.label
    };
  }

  /**
   * Vergleicht Komplexität zwischen zwei Analysen
   * @private
   */
  compareComplexity(readability1, readability2) {
    return {
      wordCountDiff: Math.abs(readability1.wordCount - readability2.wordCount),
      complexityDiff: Math.abs(
        parseFloat(readability1.readingEase) - parseFloat(readability2.readingEase)
      )
    };
  }

  /**
   * Vergleicht Themen zwischen zwei Analysen
   * @private
   */
  compareThemes(semantics1, semantics2) {
    if (!semantics1?.keyPhrases || !semantics2?.keyPhrases) return null;

    const phrases1 = new Set(semantics1.keyPhrases.map(p => p.phrase.toLowerCase()));
    const phrases2 = new Set(semantics2.keyPhrases.map(p => p.phrase.toLowerCase()));

    const intersection = new Set([...phrases1].filter(x => phrases2.has(x)));
    const union = new Set([...phrases1, ...phrases2]);

    const similarity = intersection.size / union.size;

    return {
      similarity: similarity.toFixed(2),
      commonThemes: Array.from(intersection),
      uniqueToText1: Array.from(phrases1).filter(x => !phrases2.has(x)),
      uniqueToText2: Array.from(phrases2).filter(x => !phrases1.has(x))
    };
  }

  /**
   * Gibt verwendete Modelle zurück
   * @private
   */
  getUsedModels() {
    return {
      sentiment: isModelLoaded('SENTIMENT'),
      ner: isModelLoaded('NER'),
      embeddings: isModelLoaded('EMBEDDINGS'),
      emotion: isModelLoaded('EMOTION')
    };
  }

  /**
   * Update Progress Helper
   * @private
   */
  updateProgress(callback, progress, message) {
    if (callback) {
      callback({ progress, message });
    }
  }

  /**
   * Gibt aktuelle Analyse zurück
   * @returns {Object|null}
   */
  getCurrentAnalysis() {
    return this.currentAnalysis;
  }

  /**
   * Löscht aktuelle Analyse
   */
  clearAnalysis() {
    this.currentAnalysis = null;
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