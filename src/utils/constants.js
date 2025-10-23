// ML Model Konfigurationen
export const MODELS = {
  SENTIMENT: {
    name: 'Xenova/bert-base-german-dbmdz-cased',
    task: 'sentiment-analysis',
    label: 'Sentiment Analyse'
  },
  EMOTION: {
    name: 'Xenova/bert-base-german-dbmdz-cased',
    task: 'text-classification',
    label: 'Emotion Erkennung'
  },
  NER: {
    name: 'Xenova/bert-base-german-dbmdz-cased',
    task: 'token-classification',
    label: 'Named Entity Recognition'
  },
  EMBEDDINGS: {
    name: 'Xenova/distilbert-base-german-cased',
    task: 'feature-extraction',
    label: 'Semantische Embeddings'
  }
};

// Sentiment Mapping
export const SENTIMENT_LABELS = {
  POSITIVE: 'positiv',
  NEGATIVE: 'negativ',
  NEUTRAL: 'neutral'
};

export const SENTIMENT_COLORS = {
  POSITIVE: 'bg-green-100 text-green-800 border-green-300',
  NEGATIVE: 'bg-red-100 text-red-800 border-red-300',
  NEUTRAL: 'bg-gray-100 text-gray-800 border-gray-300'
};

// Emotion Mapping
export const EMOTIONS = {
  JOY: { label: 'Freude', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', emoji: '😊' },
  SADNESS: { label: 'Trauer', color: 'bg-blue-100 text-blue-800 border-blue-300', emoji: '😢' },
  ANGER: { label: 'Wut', color: 'bg-red-100 text-red-800 border-red-300', emoji: '😠' },
  FEAR: { label: 'Angst', color: 'bg-purple-100 text-purple-800 border-purple-300', emoji: '😰' },
  SURPRISE: { label: 'Überraschung', color: 'bg-pink-100 text-pink-800 border-pink-300', emoji: '😲' },
  DISGUST: { label: 'Ekel', color: 'bg-green-100 text-green-800 border-green-300', emoji: '🤢' },
  NEUTRAL: { label: 'Neutral', color: 'bg-gray-100 text-gray-800 border-gray-300', emoji: '😐' }
};

// POS Tags (Wortarten)
export const POS_TAGS = {
  NOUN: { label: 'Nomen', color: 'bg-blue-200', description: 'Substantiv' },
  VERB: { label: 'Verb', color: 'bg-green-200', description: 'Tätigkeitswort' },
  ADJ: { label: 'Adjektiv', color: 'bg-yellow-200', description: 'Eigenschaftswort' },
  ADV: { label: 'Adverb', color: 'bg-orange-200', description: 'Umstandswort' },
  PRON: { label: 'Pronomen', color: 'bg-purple-200', description: 'Fürwort' },
  DET: { label: 'Determiner', color: 'bg-pink-200', description: 'Artikel/Begleiter' },
  ADP: { label: 'Präposition', color: 'bg-indigo-200', description: 'Verhältniswort' },
  CONJ: { label: 'Konjunktion', color: 'bg-red-200', description: 'Bindewort' },
  PUNCT: { label: 'Interpunktion', color: 'bg-gray-200', description: 'Satzzeichen' },
  OTHER: { label: 'Andere', color: 'bg-gray-100', description: 'Sonstige' }
};

// Poetische Stilmittel
export const STYLISTIC_DEVICES = {
  METAPHOR: 'Metapher',
  ALLITERATION: 'Alliteration',
  PERSONIFICATION: 'Personifikation',
  HYPERBOLE: 'Hyperbel',
  REPETITION: 'Wiederholung',
  RHYME: 'Reim'
};

// Cache-Konfiguration
export const CACHE_CONFIG = {
  MODEL_CACHE_NAME: 'transformers-cache',
  MAX_CACHE_SIZE: 500 * 1024 * 1024, // 500MB
  CACHE_DURATION: 7 * 24 * 60 * 60 * 1000 // 7 Tage
};

// Analyse-Optionen
export const ANALYSIS_OPTIONS = {
  WORD_LEVEL: 'word',
  SENTENCE_LEVEL: 'sentence',
  POEM_LEVEL: 'poem'
};

// UI-Konfiguration
export const UI_CONFIG = {
  MAX_TEXT_LENGTH: 5000,
  MIN_TEXT_LENGTH: 10,
  DEBOUNCE_DELAY: 500,
  ANIMATION_DURATION: 300
};