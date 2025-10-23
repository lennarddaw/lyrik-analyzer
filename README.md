# Deutscher Lyrik Analyzer

Eine moderne Web-Application zur KI-gestützten Analyse deutscher Texte und Gedichte. Alle Analysen werden vollständig lokal im Browser durchgeführt - ohne Backend, ohne Datenübertragung.

## 🚀 Features

### Text-Analyse
- **Sentiment-Analyse**: Emotionale Färbung auf Wort-, Satz- und Text-Ebene
- **Token-Analyse**: POS-Tagging, Named Entity Recognition, Morphologie
- **Syntax-Analyse**: Satzstruktur, Reimschema, Alliterationen, Wiederholungen
- **Semantische Analyse**: Word Embeddings, semantische Felder, Schlüsselphrasen
- **Lesbarkeits-Metriken**: Komplexität, Wortschatz-Diversität

### Visualisierung
- **Interaktive Wort-Hervorhebung**: Farbcodierung nach Sentiment, Wortart oder Entitäten
- **Detaillierte Metriken**: Übersichtliche Darstellung aller Analyse-Ergebnisse
- **Export-Funktion**: Analysen als JSON exportieren

### ML-Modelle (lokal)
- BERT-basierte deutsche Modelle
- Transformers.js für Browser-Inferenz
- Automatisches Caching der Modelle
- Keine externe API-Aufrufe

## 📋 Voraussetzungen

- Node.js (v18 oder höher)
- npm oder yarn
- Moderner Browser (Chrome, Firefox, Edge, Safari)

## 🛠️ Installation

```bash
# Repository klonen
git clone [repository-url]
cd lyrik-analyzer

# Dependencies installieren
npm install

# Development Server starten
npm run dev

# Production Build erstellen
npm run build
```

## 🎯 Verwendung

1. **Models laden**: Beim ersten Start werden automatisch die wichtigsten ML-Modelle geladen
2. **Text eingeben**: Deutschen Text oder Gedicht in das Textfeld eingeben
3. **Analysieren**: Auf "Text Analysieren" klicken
4. **Ergebnisse erkunden**: 
   - Wort-für-Wort Analyse in der Analyse-Ansicht
   - Detaillierte Metriken im Metriken-Tab
   - Einzelne Wörter anklicken für Details

## 📦 Projekt-Struktur

```
lyrik-analyzer/
├── public/
│   └── models/              # ML-Modelle (gecacht)
├── src/
│   ├── components/          # React Components
│   │   ├── TextInput.jsx
│   │   ├── AnalysisDisplay.jsx
│   │   ├── WordHighlight.jsx
│   │   ├── MetricsPanel.jsx
│   │   ├── ModelSelector.jsx
│   │   └── LoadingSpinner.jsx
│   ├── services/            # Business Logic
│   │   ├── modelLoader.js
│   │   ├── textAnalyzer.js
│   │   ├── sentimentAnalysis.js
│   │   ├── tokenAnalysis.js
│   │   ├── syntaxAnalysis.js
│   │   └── semanticAnalysis.js
│   ├── utils/               # Hilfsfunktionen
│   │   ├── constants.js
│   │   ├── colorMapping.js
│   │   └── textPreprocessing.js
│   ├── hooks/               # Custom React Hooks
│   │   ├── useModelLoader.js
│   │   └── useTextAnalysis.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## 🧠 Verwendete Technologien

### Frontend
- **React 18**: UI Framework
- **Vite**: Build Tool & Dev Server
- **Tailwind CSS**: Styling
- **Lucide React**: Icons

### ML & NLP
- **@xenova/transformers**: Transformers.js für Browser-ML
- **Hugging Face Models**: 
  - bert-base-german-dbmdz-cased
  - distilbert-base-german-cased

### Analyse-Komponenten
- Sentiment-Analyse mit BERT
- Token-Level Classification
- Feature Extraction für Embeddings
- Regelbasierte Syntax-Analyse

## 🎨 Features im Detail

### 1. Sentiment-Analyse
- Klassifizierung: Positiv, Negativ, Neutral
- Granularität: Text, Satz, Wort
- Confidence Scores
- Verteilungs-Statistiken

### 2. Linguistische Analyse
- **POS-Tagging**: Wortarten-Erkennung
- **NER**: Named Entity Recognition
- **Morphologie**: Silben, Präfixe, Suffixe
- **Syntax**: Satzstruktur, Komplexität

### 3. Poetische Stilmittel
- Reimschema-Erkennung (Paarreim, Kreuzreim, etc.)
- Alliterationen
- Wiederholungen (Anaphern, Epiphern)
- Parallelismen

### 4. Semantische Analyse
- Word Embeddings
- Semantische Ähnlichkeiten
- Thematische Felder
- Schlüsselphrasen-Extraktion

## ⚙️ Konfiguration

### Model-Auswahl
In `src/utils/constants.js` können Sie die zu verwendenden Modelle konfigurieren:

```javascript
export const MODELS = {
  SENTIMENT: {
    name: 'Xenova/bert-base-german-dbmdz-cased',
    task: 'sentiment-analysis',
    label: 'Sentiment Analyse'
  },
  // ...
};
```

### UI-Anpassungen
In `tailwind.config.js` können Sie die Farben und das Theme anpassen:

```javascript
theme: {
  extend: {
    colors: {
      'sentiment-positive': '#10b981',
      'sentiment-negative': '#ef4444',
      // ...
    }
  }
}
```

## 🔧 Entwicklung

### Scripts
```bash
npm run dev      # Development Server
npm run build    # Production Build
npm run preview  # Preview Production Build
```

### Eigene Modelle hinzufügen
1. Model in `src/utils/constants.js` definieren
2. Model-Loader in `src/services/modelLoader.js` erweitern
3. Analyse-Logik in entsprechendem Service implementieren

## 📝 Beispiel-Analysen

### Gedicht: "Der Panther" (Rilke)
- Sentiment: Überwiegend negativ
- Themen: Gefangenschaft, Müdigkeit, Isolation
- Stilmittel: Metaphern, Wiederholungen
- Reimschema: Umarmender Reim (ABBA)

### Lyrischer Text
Jeder deutsche Text kann analysiert werden:
- Gedichte
- Prosatexte
- Literarische Fragmente
- Moderne Lyrik

## 🚧 Bekannte Einschränkungen

1. **Model-Größe**: Initiales Laden kann 2-5 Minuten dauern
2. **Browser-Performance**: Große Texte (>5000 Zeichen) können langsam sein
3. **Model-Genauigkeit**: Deutsche Modelle haben Limitierungen bei sehr spezieller Lyrik
4. **Offline**: Modelle müssen einmal online geladen werden, dann offline verfügbar

## 🔮 Roadmap

- [ ] Zusätzliche deutsche Modelle (GPT-2, T5)
- [ ] Emotionen-Analyse (Freude, Trauer, Angst, etc.)
- [ ] Vergleichs-Modus für zwei Texte
- [ ] Export als PDF mit Visualisierungen
- [ ] Speichern von Analysen im LocalStorage
- [ ] Batch-Analyse mehrerer Texte

## 🤝 Beitragen

Contributions sind willkommen! Bitte erstellen Sie einen Pull Request oder öffnen Sie ein Issue.

## 📄 Lizenz

MIT License

## 🙏 Danksagungen

- Hugging Face für die transformers.js Library
- Xenova für Browser-optimierte Modelle
- Deutsche NLP Community

## 📧 Kontakt

Bei Fragen oder Feedback öffnen Sie bitte ein Issue auf GitHub.

---

**Hinweis**: Diese Anwendung führt alle Analysen lokal im Browser durch. Es werden keine Daten an externe Server gesendet.