// ML Model Konfigurationen - KOMPATIBEL MIT TRANSFORMERS.JS
// Alle Modelle müssen von Xenova konvertiert sein oder ONNX-Format haben

export const MODELS = {
  // Sentiment Analyse - Multilingual (funktioniert mit Deutsch)
  SENTIMENT: {
    name: 'Xenova/bert-base-multilingual-uncased-sentiment',
    task: 'sentiment-analysis',
    label: 'Sentiment Analyse (Multilingual)',
    language: 'multilingual'
  },
  
  // Named Entity Recognition - Deutsches NER
  NER: {
    name: 'Xenova/bert-base-NER',
    task: 'token-classification',
    label: 'Named Entity Recognition',
    language: 'multilingual',
    confidenceThreshold: 0.75
  },
  
  // Part-of-Speech Tagging - Regelbasiert für Deutsch
  POS: {
    name: null, // Kein Modell verfügbar, nutze Regeln
    task: 'token-classification',
    label: 'Part-of-Speech Tagging (Regelbasiert)',
    language: 'de',
    subtask: 'pos',
    fallbackToRules: true
  },
  
  // Dependency Parsing - Regelbasiert
  DEPENDENCY: {
    name: null,
    task: 'token-classification', 
    label: 'Dependency Parsing (Regelbasiert)',
    language: 'de',
    subtask: 'dep',
    useRules: true
  },
  
  // Embeddings - Kleine, schnelle Embeddings
  EMBEDDINGS: {
    name: 'Xenova/all-MiniLM-L6-v2',
    task: 'feature-extraction',
    label: 'Semantische Embeddings',
    language: 'multilingual'
  },
  
  // Emotion Detection - Englisch (funktioniert teilweise für Deutsch)
  EMOTION: {
    name: 'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
    task: 'text-classification',
    label: 'Emotion Erkennung (Englisch)',
    language: 'en'
  },
  
  // Zero-Shot Classification - Regelbasiert
  ZERO_SHOT: {
    name: null,
    task: 'zero-shot-classification',
    label: 'Zero-Shot Klassifizierung (Regelbasiert)',
    language: 'multilingual',
    description: 'Regelbasierte Implementierung für flexible Kategorisierung'
  },
  
  // Morphology - Regelbasiert für Deutsch
  MORPHOLOGY: {
    name: null,
    task: 'morphology',
    label: 'Morphologische Analyse (Regelbasiert)',
    language: 'de',
    useRules: true
  }
};

// Model-Gruppen für organisiertes Laden
export const MODEL_GROUPS = {
  ESSENTIAL: ['SENTIMENT', 'NER'],
  SYNTACTIC: ['POS', 'DEPENDENCY'],
  SEMANTIC: ['EMBEDDINGS', 'ZERO_SHOT'],
  ADVANCED: ['EMOTION', 'MORPHOLOGY']
};

// Sentiment Labels mit optimierter Zuordnung
export const SENTIMENT_LABELS = {
  POSITIVE: { 
    label: 'positiv', 
    value: 1, 
    range: [0.4, 1.0],
    description: 'Positive Stimmung'
  },
  NEUTRAL: { 
    label: 'neutral', 
    value: 0, 
    range: [-0.4, 0.4],
    description: 'Neutrale Stimmung'
  },
  NEGATIVE: { 
    label: 'negativ', 
    value: -1, 
    range: [-1.0, -0.4],
    description: 'Negative Stimmung'
  }
};

// Farben für Sentiment-Visualisierung
export const SENTIMENT_COLORS = {
  POSITIVE: { base: '#22c55e', light: '#86efac', dark: '#15803d' },
  NEUTRAL: { base: '#94a3b8', light: '#cbd5e1', dark: '#475569' },
  NEGATIVE: { base: '#ef4444', light: '#fca5a5', dark: '#b91c1c' }
};

// Emotionen
export const EMOTIONS = {
  JOY: { label: 'Freude', color: '#fbbf24', emoji: '😊' },
  SADNESS: { label: 'Trauer', color: '#3b82f6', emoji: '😢' },
  ANGER: { label: 'Wut', color: '#ef4444', emoji: '😠' },
  FEAR: { label: 'Angst', color: '#8b5cf6', emoji: '😨' },
  SURPRISE: { label: 'Überraschung', color: '#ec4899', emoji: '😲' },
  DISGUST: { label: 'Ekel', color: '#84cc16', emoji: '🤢' },
  NEUTRAL: { label: 'Neutral', color: '#94a3b8', emoji: '😐' }
};

// Universal POS Tags (Universal Dependencies)
export const UNIVERSAL_POS_TAGS = {
  NOUN: { 
    label: 'Nomen', 
    color: 'bg-blue-100', 
    description: 'Substantiv/Hauptwort',
    examples: ['Haus', 'Freude', 'Gedanke']
  },
  VERB: { 
    label: 'Verb', 
    color: 'bg-green-100', 
    description: 'Tätigkeitswort',
    examples: ['laufen', 'denken', 'sein']
  },
  ADJ: { 
    label: 'Adjektiv', 
    color: 'bg-yellow-100', 
    description: 'Eigenschaftswort',
    examples: ['schön', 'groß', 'gut']
  },
  ADV: { 
    label: 'Adverb', 
    color: 'bg-purple-100', 
    description: 'Umstandswort',
    examples: ['schnell', 'sehr', 'gerne']
  },
  PRON: { 
    label: 'Pronomen', 
    color: 'bg-pink-100', 
    description: 'Fürwort',
    examples: ['ich', 'du', 'dieser']
  },
  DET: { 
    label: 'Artikel/Determiner', 
    color: 'bg-indigo-100', 
    description: 'Artikel, Determiner',
    examples: ['der', 'die', 'ein', 'mein']
  },
  ADP: { 
    label: 'Präposition', 
    color: 'bg-orange-100', 
    description: 'Verhältniswort',
    examples: ['in', 'auf', 'mit']
  },
  CCONJ: { 
    label: 'Konjunktion', 
    color: 'bg-teal-100', 
    description: 'Bindewort (koordinierend)',
    examples: ['und', 'oder', 'aber']
  },
  SCONJ: { 
    label: 'Subjunktion', 
    color: 'bg-cyan-100', 
    description: 'Unterordnende Konjunktion',
    examples: ['weil', 'dass', 'wenn']
  },
  NUM: { 
    label: 'Numerale', 
    color: 'bg-red-100', 
    description: 'Zahlwort',
    examples: ['eins', 'zwei', 'erste']
  },
  AUX: { 
    label: 'Hilfsverb', 
    color: 'bg-lime-100', 
    description: 'Hilfsverb',
    examples: ['sein', 'haben', 'werden']
  },
  PART: { 
    label: 'Partikel', 
    color: 'bg-amber-100', 
    description: 'Partikel',
    examples: ['zu', 'nicht', 'doch']
  },
  INTJ: { 
    label: 'Interjektion', 
    color: 'bg-rose-100', 
    description: 'Ausruf',
    examples: ['ach', 'oh', 'hurra']
  },
  PUNCT: { 
    label: 'Interpunktion', 
    color: 'bg-gray-100', 
    description: 'Satzzeichen',
    examples: ['.', ',', '!', '?']
  },
  X: { 
    label: 'Sonstiges', 
    color: 'bg-gray-100', 
    description: 'Nicht klassifiziert',
    examples: []
  }
};

// Dependency Relations (Vereinfacht für Deutsch)
export const DEPENDENCY_RELATIONS = {
  ROOT: { label: 'Wurzel', description: 'Satzwurzel (Hauptverb)' },
  NSUBJ: { label: 'Subjekt', description: 'Nominales Subjekt' },
  OBJ: { label: 'Objekt', description: 'Direktes Objekt' },
  IOBJ: { label: 'Indirektes Objekt', description: 'Indirektes Objekt' },
  NMOD: { label: 'Nominalmodifikator', description: 'Nominale Ergänzung' },
  AMOD: { label: 'Adjektivmodifikator', description: 'Attributives Adjektiv' },
  ADVMOD: { label: 'Adverbmodifikator', description: 'Adverbiale Bestimmung' },
  DET: { label: 'Determiner', description: 'Artikel/Determiner' },
  CASE: { label: 'Kasusmarkierung', description: 'Präposition' },
  CC: { label: 'Konjunktion', description: 'Koordinierende Konjunktion' },
  CONJ: { label: 'Konjunkt', description: 'Koordiniertes Element' },
  MARK: { label: 'Marker', description: 'Subordinierende Konjunktion' },
  AUX: { label: 'Hilfsverb', description: 'Hilfsverb' },
  COP: { label: 'Kopula', description: 'Kopulaverb (sein)' },
  PUNCT: { label: 'Interpunktion', description: 'Satzzeichen' }
};

// Named Entity Labels
export const ENTITY_LABELS = {
  PER: { 
    label: 'Person', 
    color: '#fbbf24', 
    description: 'Personennamen',
    examples: ['Goethe', 'Maria', 'Einstein']
  },
  LOC: { 
    label: 'Ort', 
    color: '#3b82f6', 
    description: 'Ortsbezeichnungen',
    examples: ['Berlin', 'Deutschland', 'Europa']
  },
  ORG: { 
    label: 'Organisation', 
    color: '#8b5cf6', 
    description: 'Organisationen',
    examples: ['Bundestag', 'Microsoft', 'UNESCO']
  },
  MISC: { 
    label: 'Diverses', 
    color: '#ec4899', 
    description: 'Sonstige Entitäten',
    examples: ['Deutsch', 'Euro', 'Internet']
  },
  DATE: { 
    label: 'Datum', 
    color: '#10b981', 
    description: 'Zeitangaben',
    examples: ['2024', 'Montag', 'Januar']
  },
  TIME: { 
    label: 'Uhrzeit', 
    color: '#06b6d4', 
    description: 'Uhrzeitangaben',
    examples: ['15:00', 'Mittag']
  }
};

// Morphologische Features
export const MORPHOLOGICAL_FEATURES = {
  CASE: {
    NOM: 'Nominativ',
    ACC: 'Akkusativ',
    DAT: 'Dativ',
    GEN: 'Genitiv'
  },
  GENDER: {
    MASC: 'Maskulin',
    FEM: 'Feminin',
    NEUT: 'Neutrum'
  },
  NUMBER: {
    SING: 'Singular',
    PLUR: 'Plural'
  },
  PERSON: {
    '1': 'Erste Person',
    '2': 'Zweite Person',
    '3': 'Dritte Person'
  },
  TENSE: {
    PRES: 'Präsens',
    PAST: 'Präteritum',
    PERF: 'Perfekt',
    PLUP: 'Plusquamperfekt',
    FUT: 'Futur'
  },
  MOOD: {
    IND: 'Indikativ',
    IMP: 'Imperativ',
    SUBJ: 'Konjunktiv'
  }
};

// Stilistische Mittel
export const STYLISTIC_DEVICES = {
  METAPHOR: { label: 'Metapher', description: 'Bildlicher Vergleich ohne "wie"' },
  SIMILE: { label: 'Vergleich', description: 'Vergleich mit "wie" oder "als"' },
  PERSONIFICATION: { label: 'Personifikation', description: 'Vermenschlichung' },
  ALLITERATION: { label: 'Alliteration', description: 'Gleiche Anfangslaute' },
  ANAPHORA: { label: 'Anapher', description: 'Wiederholung am Satzanfang' },
  EPIPHORA: { label: 'Epipher', description: 'Wiederholung am Satzende' },
  PARALLELISM: { label: 'Parallelismus', description: 'Parallele Satzkonstruktion' },
  CHIASMUS: { label: 'Chiasmus', description: 'Überkreuzstellung' },
  HYPERBOLE: { label: 'Hyperbel', description: 'Übertreibung' },
  IRONY: { label: 'Ironie', description: 'Gegenteil des Gemeinten' }
};

// Reimschemata
export const RHYME_SCHEMES = {
  AABB: { label: 'Paarreim', description: 'Aufeinanderfolgende Verse reimen' },
  ABAB: { label: 'Kreuzreim', description: 'Überkreuzende Reime' },
  ABBA: { label: 'Umarmender Reim', description: 'Äußere umarmen innere' },
  ABCABC: { label: 'Schweifreim', description: 'Komplexeres Schema' },
  FREE: { label: 'Freies Reimschema', description: 'Kein festes Schema' }
};

// Metrik-Patterns
export const METRIC_PATTERNS = {
  IAMBUS: { label: 'Jambus', pattern: 'unbetont-betont', description: 'x X' },
  TROCHAEUS: { label: 'Trochäus', pattern: 'betont-unbetont', description: 'X x' },
  DACTYLUS: { label: 'Daktylus', pattern: 'betont-unbetont-unbetont', description: 'X x x' },
  ANAPEST: { label: 'Anapäst', pattern: 'unbetont-unbetont-betont', description: 'x x X' },
  SPONDEUS: { label: 'Spondeus', pattern: 'betont-betont', description: 'X X' }
};

// Analyse-Konfiguration
export const ANALYSIS_CONFIG = {
  // Schwellenwerte für Klassifizierung
  THRESHOLDS: {
    SENTIMENT_CONFIDENCE: 0.6,
    ENTITY_CONFIDENCE: 0.75, // ERHÖHT für bessere Präzision
    POS_CONFIDENCE: 0.5,
    SIMILARITY_HIGH: 0.75,
    SIMILARITY_MEDIUM: 0.5,
    EMOTION_CONFIDENCE: 0.6
  },
  
  // Text-Einschränkungen
  TEXT: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 10000,
    MIN_WORD_LENGTH: 2,
    MAX_WORD_LENGTH: 50
  },
  
  // Verarbeitungs-Optionen
  PROCESSING: {
    BATCH_SIZE: 16,
    MAX_PARALLEL: 4,
    CONTEXT_WINDOW: 3,
    SEMANTIC_WINDOW: 5,
    USE_UTF8_NORMALIZATION: true,
    TEXT_ENCODING: 'UTF-8'
  },
  
  // Cache-Optionen
  CACHE: {
    MODEL_CACHE_NAME: 'transformers-cache',
    MAX_CACHE_SIZE: 1024 * 1024 * 1024,
    CACHE_DURATION: 30 * 24 * 60 * 60 * 1000
  }
};

// Feature Flags für optionale Funktionen
export const FEATURES = {
  ADVANCED_SYNTAX: true,
  MORPHOLOGICAL_ANALYSIS: true,
  STYLISTIC_DEVICES: true,
  ZERO_SHOT_CLASSIFICATION: true,
  SEMANTIC_SIMILARITY: true,
  EMOTION_DETECTION: true,
  RHYTHM_ANALYSIS: false,
  VERSE_STRUCTURE: true,
  RULE_BASED_POS: true,
  STRICT_NER: true,
  UTF8_NORMALIZATION: true
};

// UI-Konfiguration
export const UI_CONFIG = {
  DEBOUNCE_DELAY: 500,
  ANIMATION_DURATION: 300,
  MAX_DISPLAY_TOKENS: 1000,
  TOOLTIP_DELAY: 200
};

// Regelbasierte deutsche Wortartenerkennung
export const GERMAN_POS_RULES = {
  // Artikel
  ARTICLES: ['der', 'die', 'das', 'ein', 'eine', 'einen', 'einem', 'eines', 'den', 'dem', 'des'],
  // Pronomen
  PRONOUNS: ['ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr', 'mich', 'dich', 'sich', 'mir', 'dir', 'ihm', 'ihr', 'uns', 'euch', 'ihnen'],
  // Possessivpronomen
  POSSESSIVE: ['mein', 'dein', 'sein', 'ihr', 'unser', 'euer', 'meine', 'deine', 'seine', 'ihre', 'unsere', 'eure'],
  // Präpositionen
  PREPOSITIONS: ['in', 'an', 'auf', 'von', 'vom', 'zu', 'zum', 'zur', 'mit', 'bei', 'nach', 'vor', 'über', 'unter', 'durch', 'für', 'gegen', 'um', 'hinter', 'zwischen', 'aus'],
  // Konjunktionen
  CONJUNCTIONS: ['und', 'oder', 'aber', 'denn', 'sondern', 'doch', 'jedoch'],
  // Subjunktionen
  SUBJUNCTIONS: ['weil', 'dass', 'wenn', 'als', 'ob', 'obwohl', 'während', 'bevor', 'nachdem', 'damit', 'sodass'],
  // Hilfsverben
  AUXILIARIES: ['sein', 'haben', 'werden', 'ist', 'war', 'wird', 'wurde', 'hat', 'hatte', 'bin', 'bist', 'sind', 'waren', 'wirst', 'werden'],
  // Modalverben
  MODALS: ['können', 'müssen', 'dürfen', 'sollen', 'wollen', 'mögen', 'kann', 'muss', 'darf', 'soll', 'will', 'mag'],
  // Partikeln
  PARTICLES: ['zu', 'nicht', 'doch', 'schon', 'noch', 'nur', 'auch', 'etwa', 'wohl', 'ja', 'nein'],
  // Adverbien (häufige)
  ADVERBS: ['sehr', 'so', 'wie', 'als', 'hier', 'da', 'dort', 'heute', 'gestern', 'morgen', 'jetzt', 'immer', 'nie', 'oft', 'manchmal', 'ganz', 'völlig', 'gern', 'gerne', 'schnell', 'langsam']
};

// Alias for backwards compatibility
export const POS_TAGS = UNIVERSAL_POS_TAGS;

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
  UI_CONFIG,
  GERMAN_POS_RULES
};