// ML Model Konfigurationen - WORKING MODELS FOR TRANSFORMERS.JS
export const MODELS = {
  // Sentiment Analyse - Multilingual model that supports German  
  SENTIMENT: {
    name: 'Xenova/bert-base-multilingual-uncased-sentiment',
    task: 'sentiment-analysis',
    label: 'Sentiment Analyse (Multilingual)',
    language: 'de'
  },
  
  // Named Entity Recognition - Multilingual NER
  NER: {
    name: 'Xenova/bert-base-NER',
    task: 'token-classification',
    label: 'Named Entity Recognition',
    language: 'multilingual'
  },
  
  // Part-of-Speech Tagging - Rule-based fallback
  POS: {
    name: null,
    task: 'token-classification',
    label: 'Part-of-Speech Tagging (Regelbasiert)',
    language: 'de',
    subtask: 'pos'
  },
  
  // Dependency Parsing - Rule-based fallback
  DEPENDENCY: {
    name: null,
    task: 'token-classification', 
    label: 'Dependency Parsing (Regelbasiert)',
    language: 'de',
    subtask: 'dep'
  },
  
  // Embeddings - Sentence transformers
  EMBEDDINGS: {
    name: 'Xenova/all-MiniLM-L6-v2',
    task: 'feature-extraction',
    label: 'Semantische Embeddings',
    language: 'multilingual'
  },
  
  // Text Classification for emotion
  EMOTION: {
    name: 'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
    task: 'text-classification',
    label: 'Emotion Erkennung',
    language: 'en'
  },
  
  // Zero-Shot Classification
  ZERO_SHOT: {
    name: 'Xenova/mbart-large-50-many-to-one-mmt',
    task: 'zero-shot-classification',
    label: 'Zero-Shot Klassifizierung',
    language: 'multilingual'
  },
  
  // Morphology - Rule-based
  MORPHOLOGY: {
    name: null,
    task: 'token-classification',
    label: 'Morphologische Analyse (Regelbasiert)',
    language: 'de',
    subtask: 'morph'
  }
};

// Model-Gruppen fÃ¼r einfaches Laden
export const MODEL_GROUPS = {
  BASIC: ['SENTIMENT', 'NER', 'EMBEDDINGS'],
  ADVANCED: ['SENTIMENT', 'NER', 'POS', 'EMBEDDINGS', 'EMOTION'],
  FULL: ['SENTIMENT', 'NER', 'POS', 'DEPENDENCY', 'EMBEDDINGS', 'EMOTION', 'MORPHOLOGY'],
  MINIMAL: ['SENTIMENT', 'EMBEDDINGS']
};

// Sentiment Labels - Dynamisch aus Modellen
export const SENTIMENT_LABELS = {
  POSITIVE: 'positiv',
  NEGATIVE: 'negativ', 
  NEUTRAL: 'neutral',
  MIXED: 'gemischt'
};

export const SENTIMENT_COLORS = {
  POSITIVE: 'bg-green-100 text-green-800 border-green-300',
  NEGATIVE: 'bg-red-100 text-red-800 border-red-300',
  NEUTRAL: 'bg-gray-100 text-gray-800 border-gray-300',
  MIXED: 'bg-yellow-100 text-yellow-800 border-yellow-300'
};

// Emotion Labels - Werden vom Modell bestimmt
export const EMOTIONS = {
  // Diese werden dynamisch aus den Modell-Outputs generiert
  // Basis-Kategorien fÃ¼r Fallback
  JOY: { label: 'Freude', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', emoji: 'ðŸ˜Š' },
  SADNESS: { label: 'Trauer', color: 'bg-blue-100 text-blue-800 border-blue-300', emoji: 'ðŸ˜¢' },
  ANGER: { label: 'Wut', color: 'bg-red-100 text-red-800 border-red-300', emoji: 'ðŸ˜ ' },
  FEAR: { label: 'Angst', color: 'bg-purple-100 text-purple-800 border-purple-300', emoji: 'ðŸ˜°' },
  SURPRISE: { label: 'Ãœberraschung', color: 'bg-pink-100 text-pink-800 border-pink-300', emoji: 'ðŸ˜²' },
  DISGUST: { label: 'Ekel', color: 'bg-green-100 text-green-800 border-green-300', emoji: 'ðŸ¤¢' },
  TRUST: { label: 'Vertrauen', color: 'bg-teal-100 text-teal-800 border-teal-300', emoji: 'ðŸ¤' },
  ANTICIPATION: { label: 'Erwartung', color: 'bg-orange-100 text-orange-800 border-orange-300', emoji: 'ðŸ¤”' },
  NEUTRAL: { label: 'Neutral', color: 'bg-gray-100 text-gray-800 border-gray-300', emoji: 'ðŸ˜' }
};

// Universal Dependencies POS Tags (Standard)
export const UNIVERSAL_POS_TAGS = {
  NOUN: { label: 'Nomen', color: 'bg-blue-200', description: 'Substantiv', examples: ['Haus', 'Katze', 'Liebe'] },
  VERB: { label: 'Verb', color: 'bg-green-200', description: 'TÃ¤tigkeitswort', examples: ['gehen', 'sein', 'haben'] },
  ADJ: { label: 'Adjektiv', color: 'bg-yellow-200', description: 'Eigenschaftswort', examples: ['schÃ¶n', 'groÃŸ', 'gut'] },
  ADV: { label: 'Adverb', color: 'bg-orange-200', description: 'Umstandswort', examples: ['schnell', 'sehr', 'oft'] },
  PRON: { label: 'Pronomen', color: 'bg-purple-200', description: 'FÃ¼rwort', examples: ['ich', 'du', 'er'] },
  DET: { label: 'Determiner', color: 'bg-pink-200', description: 'Artikel/Begleiter', examples: ['der', 'die', 'das'] },
  ADP: { label: 'PrÃ¤position', color: 'bg-indigo-200', description: 'VerhÃ¤ltniswort', examples: ['in', 'auf', 'mit'] },
  CCONJ: { label: 'Konjunktion', color: 'bg-red-200', description: 'Bindewort', examples: ['und', 'oder', 'aber'] },
  SCONJ: { label: 'Subjunktion', color: 'bg-rose-200', description: 'Unterordnende Konjunktion', examples: ['dass', 'weil', 'wenn'] },
  PUNCT: { label: 'Interpunktion', color: 'bg-gray-200', description: 'Satzzeichen', examples: ['.', ',', '!'] },
  NUM: { label: 'Numeral', color: 'bg-cyan-200', description: 'Zahlwort', examples: ['eins', 'zwei', 'erste'] },
  AUX: { label: 'Hilfsverb', color: 'bg-lime-200', description: 'Hilfsverb', examples: ['werden', 'haben', 'sein'] },
  PART: { label: 'Partikel', color: 'bg-amber-200', description: 'Partikel', examples: ['zu', 'nicht', 'doch'] },
  INTJ: { label: 'Interjektion', color: 'bg-fuchsia-200', description: 'Ausruf', examples: ['oh', 'ach', 'wow'] },
  X: { label: 'Sonstiges', color: 'bg-gray-100', description: 'Sonstiges', examples: [] }
};

// Dependency Relations (Universal Dependencies)
export const DEPENDENCY_RELATIONS = {
  nsubj: { label: 'Subjekt', description: 'Nominales Subjekt' },
  obj: { label: 'Objekt', description: 'Direktes Objekt' },
  iobj: { label: 'Indirektes Objekt', description: 'Indirektes Objekt' },
  amod: { label: 'Adjektivisches Attribut', description: 'Adjektivische Modifikation' },
  nmod: { label: 'Nominales Attribut', description: 'Nominale Modifikation' },
  det: { label: 'Determiner', description: 'Determiner' },
  case: { label: 'Kasus-Markierung', description: 'PrÃ¤position/Kasusmarkierung' },
  root: { label: 'Wurzel', description: 'Wurzel des Satzes' },
  aux: { label: 'Hilfsverb', description: 'Hilfsverb' },
  cop: { label: 'Kopula', description: 'Kopula (sein)' },
  mark: { label: 'Markierung', description: 'Unterordnende Konjunktion' },
  advmod: { label: 'Adverbiale Bestimmung', description: 'Adverbiale Modifikation' },
  acl: { label: 'Relativsatz', description: 'Adnominaler Nebensatz' },
  conj: { label: 'Konjunkt', description: 'Konjunkt in Koordination' },
  cc: { label: 'Koordinierende Konjunktion', description: 'Koordinierende Konjunktion' }
};

// Named Entity Labels (CoNLL-2003 Standard)
export const ENTITY_LABELS = {
  PER: { label: 'Person', color: 'bg-blue-100', description: 'Personen, Charaktere' },
  LOC: { label: 'Ort', color: 'bg-green-100', description: 'Orte, LÃ¤nder, StÃ¤dte' },
  ORG: { label: 'Organisation', color: 'bg-purple-100', description: 'Firmen, Institutionen' },
  MISC: { label: 'Sonstiges', color: 'bg-gray-100', description: 'Andere EntitÃ¤ten' },
  DATE: { label: 'Datum', color: 'bg-yellow-100', description: 'Zeitangaben' },
  TIME: { label: 'Zeit', color: 'bg-orange-100', description: 'Zeitpunkte' },
  MONEY: { label: 'Geld', color: 'bg-emerald-100', description: 'WÃ¤hrungen, BetrÃ¤ge' },
  PERCENT: { label: 'Prozent', color: 'bg-pink-100', description: 'Prozentangaben' }
};

// Morphologische Merkmale
export const MORPHOLOGICAL_FEATURES = {
  // Kasus
  CASE: {
    Nom: 'Nominativ',
    Gen: 'Genitiv', 
    Dat: 'Dativ',
    Acc: 'Akkusativ'
  },
  // Numerus
  NUMBER: {
    Sing: 'Singular',
    Plur: 'Plural'
  },
  // Genus
  GENDER: {
    Masc: 'Maskulinum',
    Fem: 'Femininum',
    Neut: 'Neutrum'
  },
  // Tempus
  TENSE: {
    Past: 'Vergangenheit',
    Pres: 'PrÃ¤sens',
    Fut: 'Futur'
  },
  // Modus
  MOOD: {
    Ind: 'Indikativ',
    Imp: 'Imperativ',
    Sub: 'Konjunktiv'
  },
  // Person
  PERSON: {
    '1': '1. Person',
    '2': '2. Person',
    '3': '3. Person'
  }
};

// Poetische Stilmittel - Werden durch Modelle erkannt
export const STYLISTIC_DEVICES = {
  METAPHOR: { label: 'Metapher', description: 'Bildlicher Vergleich ohne "wie"' },
  SIMILE: { label: 'Vergleich', description: 'Vergleich mit "wie" oder "als"' },
  ALLITERATION: { label: 'Alliteration', description: 'Gleicher Anfangsbuchstabe' },
  ANAPHORA: { label: 'Anapher', description: 'Wiederholung am Satzanfang' },
  EPIPHORA: { label: 'Epipher', description: 'Wiederholung am Satzende' },
  PERSONIFICATION: { label: 'Personifikation', description: 'Vermenschlichung' },
  HYPERBOLE: { label: 'Hyperbel', description: 'Ãœbertreibung' },
  IRONY: { label: 'Ironie', description: 'Gegenteil ist gemeint' },
  SYMBOLISM: { label: 'Symbol', description: 'Stellvertretende Bedeutung' },
  REPETITION: { label: 'Wiederholung', description: 'Wortwiederholung' },
  PARALLELISM: { label: 'Parallelismus', description: 'Parallele Struktur' },
  CHIASMUS: { label: 'Chiasmus', description: 'Kreuzstellung' },
  ELLIPSIS: { label: 'Ellipse', description: 'Auslassung' },
  ENJAMBMENT: { label: 'Enjambement', description: 'Zeilensprung' },
  ASSONANCE: { label: 'Assonanz', description: 'Vokalgleichklang' },
  CONSONANCE: { label: 'Konsonanz', description: 'Konsonantengleichklang' }
};

// Reimschemata
export const RHYME_SCHEMES = {
  AABB: { label: 'Paarreim', description: 'Reimpaare hintereinander' },
  ABAB: { label: 'Kreuzreim', description: 'Alternierendes Reimschema' },
  ABBA: { label: 'Umarmender Reim', description: 'Ã„uÃŸere umarmen innere' },
  ABCABC: { label: 'Schweifreim', description: 'Komplexeres Schema' },
  FREE: { label: 'Freies Reimschema', description: 'Kein festes Schema' }
};

// Metrik-Patterns
export const METRIC_PATTERNS = {
  IAMBUS: { label: 'Jambus', pattern: 'unbetont-betont', description: 'x X' },
  TROCHAEUS: { label: 'TrochÃ¤us', pattern: 'betont-unbetont', description: 'X x' },
  DACTYLUS: { label: 'Daktylus', pattern: 'betont-unbetont-unbetont', description: 'X x x' },
  ANAPEST: { label: 'AnapÃ¤st', pattern: 'unbetont-unbetont-betont', description: 'x x X' },
  SPONDEUS: { label: 'Spondeus', pattern: 'betont-betont', description: 'X X' }
};

// Analyse-Konfiguration
export const ANALYSIS_CONFIG = {
  // Schwellenwerte fÃ¼r Klassifizierung
  THRESHOLDS: {
    SENTIMENT_CONFIDENCE: 0.6, // Mindest-Konfidenz fÃ¼r Sentiment
    ENTITY_CONFIDENCE: 0.7, // Mindest-Konfidenz fÃ¼r NER
    SIMILARITY_HIGH: 0.75, // Hohe semantische Ã„hnlichkeit
    SIMILARITY_MEDIUM: 0.5, // Mittlere semantische Ã„hnlichkeit
    EMOTION_CONFIDENCE: 0.6 // Mindest-Konfidenz fÃ¼r Emotion
  },
  
  // Text-EinschrÃ¤nkungen
  TEXT: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 10000,
    MIN_WORD_LENGTH: 2,
    MAX_WORD_LENGTH: 50
  },
  
  // Verarbeitungs-Optionen
  PROCESSING: {
    BATCH_SIZE: 16, // FÃ¼r Batch-Verarbeitung
    MAX_PARALLEL: 4, // Maximale parallele Requests
    CONTEXT_WINDOW: 3, // WÃ¶rter fÃ¼r Kontext-Analyse
    SEMANTIC_WINDOW: 5 // Fenster fÃ¼r semantische Shifts
  },
  
  // Cache-Optionen
  CACHE: {
    MODEL_CACHE_NAME: 'transformers-cache',
    MAX_CACHE_SIZE: 1024 * 1024 * 1024, // 1GB
    CACHE_DURATION: 30 * 24 * 60 * 60 * 1000 // 30 Tage
  }
};

// Feature Flags fÃ¼r optionale Funktionen
export const FEATURES = {
  ADVANCED_SYNTAX: true, // Dependency Parsing
  MORPHOLOGICAL_ANALYSIS: true, // Morphologie-Analyse
  STYLISTIC_DEVICES: true, // Automatische Stilmittel-Erkennung
  ZERO_SHOT_CLASSIFICATION: true, // Zero-Shot fÃ¼r flexible Kategorien
  SEMANTIC_SIMILARITY: true, // Semantische Ã„hnlichkeits-Analyse
  EMOTION_DETECTION: true, // Detaillierte Emotionserkennung
  RHYTHM_ANALYSIS: false, // Metrische Analyse (experimentell)
  VERSE_STRUCTURE: true // Vers- und Strophen-Analyse
};

// UI-Konfiguration
export const UI_CONFIG = {
  DEBOUNCE_DELAY: 500,
  ANIMATION_DURATION: 300,
  MAX_DISPLAY_TOKENS: 1000,
  TOOLTIP_DELAY: 200
};

// Alias for backwards compatibility
export const POS_TAGS = UNIVERSAL_POS_TAGS;

// Export auch einzelne Gruppen
export default {
  MODELS,
  MODEL_GROUPS,
  SENTIMENT_LABELS,
  SENTIMENT_COLORS,
  EMOTIONS,
  UNIVERSAL_POS_TAGS,
  POS_TAGS,
  DEPENDENCY_RELATIONS,
  ENTITY_LABELS,
  MORPHOLOGICAL_FEATURES,
  STYLISTIC_DEVICES,
  RHYME_SCHEMES,
  METRIC_PATTERNS,
  ANALYSIS_CONFIG,
  FEATURES,
  UI_CONFIG
};