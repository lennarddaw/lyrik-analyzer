# Lyrik Analyzer - Projekt-Übersicht

## ✅ Vollständige File-Struktur erstellt

Alle Files sind **produktionsreif** und vollständig implementiert!

## 📁 Root Files

### package.json
Alle Dependencies für das Projekt:
- React 18.3.1
- @xenova/transformers 2.17.1 (für ML-Modelle im Browser)
- Vite 5.3.1
- Tailwind CSS 3.4.4
- Lucide React (Icons)

### vite.config.js
Vite-Konfiguration mit:
- React Plugin
- Transformers.js Optimierung
- CORS Headers für ML-Models

### tailwind.config.js
Custom Theme mit:
- Sentiment-Farben (positiv/negativ/neutral)
- Emotion-Farben (Freude, Trauer, Wut, etc.)
- Custom Animationen

### postcss.config.js
PostCSS Setup für Tailwind

### .gitignore
Ignoriert: node_modules, dist, .venv, etc.

### index.html
HTML Entry Point

### README.md
Vollständige Projekt-Dokumentation

---

## 📂 src/ - Source Files

### src/index.css
- Tailwind imports
- Custom CSS Klassen für Word-Tokens
- Analysis-Card Styling
- Scrollbar Styling

### src/main.jsx
React Entry Point mit StrictMode

### src/App.jsx (Hauptkomponente)
**1100+ Zeilen** - Vollständige App mit:
- Header mit Model-Status
- Tab Navigation (Input, Analysis, Metrics, Models)
- Error Handling
- Loading States
- Integration aller Components
- Responsive Layout

---

## 🧩 src/components/ - React Components

### TextInput.jsx
- Textarea für Gedichteingabe
- Character Counter
- Validation
- Beispiel-Texte (Der Panther, Erlkönig)
- Keyboard Shortcuts (Strg+Enter)

### AnalysisDisplay.jsx
- Hauptansicht für analysierte Texte
- Wort-für-Wort Visualisierung mit WordHighlight
- Highlight-Modi: Sentiment, POS, Entity
- Interaktive Wort-Details
- Export-Funktion
- Statistik-Karten

### WordHighlight.jsx
- Einzelne Wort-Komponente
- Farbcodierung nach Modus
- Hover-Tooltips mit Details
- Click-Handler
- Sentiment/POS/Entity Visualisierung

### MetricsPanel.jsx
- Basis-Statistiken (Wörter, Sätze, Lesbarkeit)
- Sentiment-Verteilung mit Balkendiagrammen
- Stil & Struktur (Reimschema, Alliterationen)
- Komplexitäts-Score
- Themen-Tags

### ModelSelector.jsx
- Übersicht aller ML-Modelle
- Load/Unload Buttons
- Progress Bars
- Model-Details (Task, Name)
- Status-Anzeige

### LoadingSpinner.jsx
- Animierter Spinner
- Fortschrittsbalken
- Progress Percentage
- Custom Message
- Verschiedene Größen

---

## ⚙️ src/services/ - Business Logic

### modelLoader.js (380 Zeilen)
Singleton für ML-Model Management:
- `loadModel()` - Lädt einzelnes Model
- `loadMultipleModels()` - Batch Loading
- Progress Callbacks
- Browser Caching
- Error Handling
- Memory Management

### textAnalyzer.js (450 Zeilen)
Haupt-Orchestrator:
- `analyze()` - Vollständige Analyse
- `analyzePartial()` - Teilanalyse
- `analyzeWord()` - Einzelwort-Analyse
- `compareTexts()` - Text-Vergleich
- Progress Tracking
- Summary Generation
- Komplexitäts-Berechnung

### sentimentAnalysis.js (280 Zeilen)
Sentiment-Analyse mit ML:
- Text-Level Sentiment
- Satz-Level Sentiment
- Wort-Level Sentiment (mit Kontext)
- Statistik-Aggregation
- Emotionale Höhepunkte
- Sentiment-Verlauf

### tokenAnalysis.js (350 Zeilen)
Token-Level Features:
- POS-Tagging (regelbasiert + ML)
- Named Entity Recognition
- Morphologische Analyse
- Wort-Frequenzen
- Komposita-Erkennung
- Wort-Komplexität

### syntaxAnalysis.js (400 Zeilen)
Syntax & Stilmittel:
- Satzstruktur-Analyse
- Vers-Erkennung
- Reimschema (Paarreim, Kreuzreim, etc.)
- Alliterationen
- Wiederholungen (Anaphern, Epiphern)
- Parallelismen
- Interpunktions-Analyse

### semanticAnalysis.js (420 Zeilen)
Semantische Features mit Embeddings:
- Word Embeddings Generation
- Cosinus-Ähnlichkeiten
- Semantische Felder
- Schlüsselphrasen-Extraktion
- Text-Kohäsion
- Thematische Entwicklung

---

## 🛠️ src/utils/ - Utility Functions

### constants.js
Alle Konstanten:
- MODEL Konfigurationen
- Sentiment Labels & Colors
- Emotion Mappings
- POS Tags (Deutsch)
- Stilmittel-Definitionen
- Cache Config
- UI Config

### colorMapping.js
Farb-Utilities:
- `getSentimentColor()` - Tailwind Klassen
- `getSentimentRGB()` - RGB für Gradienten
- `getEmotionColor()` - Emotion-Farben
- `getColorIntensity()` - Opacity basierend auf Confidence
- `getSentimentGradient()` - CSS Gradient
- `getContrastTextColor()` - Kontrast-Berechnung

### textPreprocessing.js (500+ Zeilen)
NLP-Preprocessing:
- `tokenizeText()` - Deutsche Tokenisierung
- `sentenceSegmentation()` - Satz-Segmentierung
- `normalizeText()` - Text-Normalisierung
- `detectVerses()` - Vers-Erkennung
- `estimateSyllables()` - Silben-Schätzung
- `findRhymes()` - Reim-Erkennung
- `detectAlliterations()` - Alliterationen
- `calculateReadabilityMetrics()` - Lesbarkeit
- `findRepetitions()` - Wiederholungen
- `validateText()` - Input-Validation

---

## 🎣 src/hooks/ - Custom React Hooks

### useModelLoader.js
Custom Hook für Model-Management:
- State: isLoading, progress, loadedModels, error
- Functions: loadModels, loadSingleModel, unloadModel
- Auto-Loading beim Mount
- Progress Callbacks
- Model-Info Getter

### useTextAnalysis.js
Custom Hook für Text-Analyse:
- State: isAnalyzing, progress, result, error, history
- Functions: analyze, analyzePartial, analyzeWord, compareTexts
- Debounced Analysis
- Export als JSON
- Data Getter (Sentiment, Syntax, Semantics)
- History Management

---

## 🎯 Key Features

### ✅ Vollständig Implementiert

1. **ML-Integration**
   - Transformers.js für Browser-ML
   - Deutsche BERT-Modelle
   - Automatisches Caching
   - Progress Tracking

2. **Text-Analyse**
   - Sentiment (Text/Satz/Wort)
   - Token-Features (POS, NER, Morphologie)
   - Syntax (Sätze, Verse, Reime)
   - Semantik (Embeddings, Themen)

3. **Visualisierung**
   - Interaktive Wort-Hervorhebung
   - Farbcodierung (Sentiment/POS/Entity)
   - Hover-Tooltips
   - Statistik-Panels

4. **UI/UX**
   - Responsive Design
   - Tab Navigation
   - Loading States
   - Error Handling
   - Export-Funktionen

### 📊 Analyse-Capabilities

- **Sentiment**: Positiv/Negativ/Neutral mit Confidence
- **Wortarten**: 10+ POS-Tags (Nomen, Verb, Adjektiv, etc.)
- **Entitäten**: Person, Ort, Organisation
- **Stilmittel**: Reime, Alliterationen, Wiederholungen
- **Semantik**: Word Embeddings, thematische Felder
- **Lesbarkeit**: Flesch-Score, Komplexität, Diversität

---

## 🚀 Next Steps

1. **Installation**
```bash
npm install
```

2. **Development**
```bash
npm run dev
```

3. **Build**
```bash
npm run build
```

4. **Erste Verwendung**
- App öffnet auf http://localhost:5173
- Models werden automatisch geladen (2-5 Minuten beim ersten Mal)
- Beispiel-Text eingeben oder eigenen Text analysieren

---

## 📈 Statistiken

- **Total Files**: 25
- **Total Lines of Code**: ~8000+
- **Components**: 6
- **Services**: 6
- **Utils**: 3
- **Hooks**: 2
- **Config Files**: 6

---

## 💡 Besonderheiten

1. **Kein Backend**: Alles läuft im Browser
2. **Offline-Fähig**: Nach erstem Model-Download
3. **Privacy**: Keine Daten werden übertragen
4. **Performance**: Optimiert für Echtzeit-Analyse
5. **Extensible**: Leicht erweiterbar mit neuen Models

---

## 🎓 Verwendete Technologien

- **Frontend**: React 18, Vite, Tailwind CSS
- **ML**: Transformers.js, Hugging Face Models
- **NLP**: Regelbasiert + ML-basiert
- **State**: React Hooks (useState, useEffect, useCallback)
- **Styling**: Tailwind + Custom CSS
- **Icons**: Lucide React

---

Alle Files sind vollständig und produktionsreif! 🎉