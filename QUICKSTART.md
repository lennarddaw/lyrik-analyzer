# 🚀 Quick Start Guide - Deutscher Lyrik Analyzer

## Installation & Setup (5 Minuten)

### 1. Dependencies installieren

```bash
# Im Projekt-Verzeichnis
npm install
```

Das installiert:
- React & React-DOM
- Vite (Build Tool)
- Tailwind CSS
- @xenova/transformers (ML im Browser)
- Lucide React (Icons)

---

### 2. Development Server starten

```bash
npm run dev
```

Die App öffnet automatisch auf: **http://localhost:5173**

---

## Erste Schritte

### 🔄 Models laden (beim ersten Start)

1. Die App lädt automatisch die wichtigsten ML-Modelle:
   - **Sentiment Model** (BERT German)
   - **Embeddings Model** (DistilBERT German)

2. Das erste Laden dauert **2-5 Minuten** (ca. 300MB Download)

3. Fortschritt wird angezeigt:
   ```
   Lade SENTIMENT... 45%
   ```

4. **Danach**: Models sind im Browser gecacht! ✅

---

### 📝 Text analysieren

#### Option 1: Beispiel-Text verwenden

1. Klicke auf einen Beispiel-Text:
   - "Der Panther" (Rilke)
   - "Erlkönig" (Goethe Auszug)

2. Klicke auf "Text Analysieren"

3. Warte 5-10 Sekunden

4. ✅ Fertig! Ergebnisse werden angezeigt

#### Option 2: Eigener Text

1. Gib deinen deutschen Text ein (10-5000 Zeichen)

2. Tipp: Strg/Cmd + Enter für schnelle Analyse

3. Klicke "Text Analysieren"

---

## 🎯 Features erkunden

### 1. Analyse-Ansicht

Nach der Analyse siehst du:

- **Farbcodierte Wörter**:
  - 🟢 Grün = Positiv
  - 🔴 Rot = Negativ
  - ⚫ Grau = Neutral

- **Interaktiv**:
  - Hover über Wörter → Tooltip mit Details
  - Klick auf Wort → Detaillierte Info

- **Highlight-Modi** umschalten:
  - Sentiment
  - Wortart (POS)
  - Entitäten (NER)

### 2. Metriken

Klicke auf den "Metriken" Tab:

- Basis-Statistiken
  - Wörter, Sätze, Lesbarkeit

- Sentiment-Verteilung
  - Positiv/Negativ/Neutral %

- Stil & Struktur
  - Reimschema
  - Alliterationen
  - Wiederholungen

- Komplexität
  - Score 0-100
  - Level: Einfach/Mittel/Komplex/Sehr komplex

- Themen
  - Automatisch erkannte Schlüsselwörter

### 3. Models verwalten

Klicke auf "ML Models":

- Sieh alle verfügbaren Models
- Lade/Entlade Models nach Bedarf
- Sieh Lade-Fortschritt

---

## 💡 Tipps & Tricks

### Performance

1. **Erste Analyse ist langsam**
   - Models müssen initialisiert werden
   - Danach: Schneller!

2. **Große Texte**
   - Max 5000 Zeichen empfohlen
   - Längere Texte = längere Analyse

3. **Browser-Cache**
   - Models bleiben gespeichert
   - Beim nächsten Besuch: Sofort bereit

### Best Practices

1. **Text-Qualität**
   ✅ Gut: Korrekte deutsche Rechtschreibung
   ✅ Gut: Satzzeichen gesetzt
   ❌ Schlecht: Abkürzungen, Slang

2. **Gedichte**
   ✅ Gut: Klassische Gedichte (Goethe, Schiller, Rilke)
   ✅ Gut: Moderne Lyrik
   ✅ Gut: Verse mit Zeilenumbrüchen

3. **Prosa**
   ✅ Gut: Literarische Texte
   ✅ Gut: Beschreibende Texte
   ❌ Weniger gut: Technische Texte

---

## 🐛 Troubleshooting

### Problem: Models laden nicht

**Lösung**:
1. Überprüfe Internetverbindung
2. Öffne Browser-Konsole (F12)
3. Schaue nach Fehler-Meldungen
4. Versuche anderen Browser

### Problem: Analyse dauert sehr lange

**Lösung**:
1. Text kürzen (max 2000 Zeichen)
2. Browser-Tab aktiv lassen
3. Andere Tabs schließen
4. Mehr RAM = Besser

### Problem: Sentiment falsch erkannt

**Normal**! ML-Models sind nicht perfekt:
- Ironie wird oft nicht erkannt
- Komplexe Metaphern schwierig
- Ambige Wörter können falsch sein

---

## 🎨 Beispiel-Analysen

### Beispiel 1: Positiver Text

```
Die Sonne scheint hell am blauen Himmel.
Vögel singen fröhlich in den Bäumen.
Ein wunderbarer Tag beginnt.
```

**Erwartet**:
- Sentiment: Positiv (85%+)
- Themen: Natur, Freude
- Wörter: "hell", "fröhlich", "wunderbar" → positiv

### Beispiel 2: Trauriger Text

```
Dunkelheit umhüllt die kalte Nacht.
Einsam steht der alte Baum im Wind.
Stille herrscht, niemand ist mehr da.
```

**Erwartet**:
- Sentiment: Negativ (70%+)
- Themen: Einsamkeit, Dunkelheit
- Wörter: "Dunkelheit", "einsam", "Stille" → negativ

### Beispiel 3: Gedicht mit Reimschema

```
Vom Eise befreit sind Strom und Bäche
Durch des Frühlings holden, belebenden Blick.
Im Tale grünet Hoffnungsglück;
Der alte Winter, in seiner Schwäche.
```

**Erwartet**:
- Reimschema: ABBA (Umarmender Reim)
- Themen: Frühling, Natur
- Stilmittel: Personifikation ("Winter")

---

## 📤 Export & Teilen

### JSON Export

1. Klicke auf "Exportieren" Button
2. Speichere JSON-Datei
3. Enthält:
   - Vollständigen Text
   - Alle Token mit Annotationen
   - Sentiment-Daten
   - Zusammenfassung

### Verwendung der Daten

```javascript
{
  "text": "Original-Text",
  "tokens": [
    {
      "text": "Sonne",
      "position": 1,
      "sentiment": {
        "label": "positiv",
        "score": 0.92
      },
      "posTag": "NOUN"
    }
  ],
  "summary": {
    "wordCount": 42,
    "sentiment": "positiv",
    ...
  }
}
```

---

## 🔧 Erweiterte Konfiguration

### Weitere Models hinzufügen

In `src/utils/constants.js`:

```javascript
export const MODELS = {
  MY_MODEL: {
    name: 'Xenova/model-name',
    task: 'text-classification',
    label: 'Mein Model'
  }
};
```

### Farben anpassen

In `tailwind.config.js`:

```javascript
colors: {
  'sentiment-positive': '#10b981', // Deine Farbe
  'sentiment-negative': '#ef4444',
  // ...
}
```

---

## 📚 Weiterführende Infos

- **Vollständige Doku**: Siehe `README.md`
- **Code-Struktur**: Siehe `PROJECT_OVERVIEW.md`
- **Transformers.js Docs**: https://huggingface.co/docs/transformers.js

---

## 🎉 Das war's!

Du bist jetzt bereit, deutsche Texte zu analysieren!

**Viel Spaß beim Explorieren der Lyrik! 📖✨**

---

## ❓ Häufige Fragen

**Q: Werden meine Texte gespeichert?**
A: Nein! Alles läuft lokal im Browser.

**Q: Brauche ich Internet?**
A: Nur beim ersten Model-Download. Danach offline nutzbar.

**Q: Welche Browser werden unterstützt?**
A: Chrome, Firefox, Edge, Safari (neueste Versionen)

**Q: Kann ich andere Sprachen analysieren?**
A: Nein, nur Deutsch. Models sind deutsch-trainiert.

**Q: Ist das kostenlos?**
A: Ja! Komplett kostenlos und Open Source.

---

**Bei Problemen**: Erstelle ein Issue auf GitHub oder überprüfe die Browser-Konsole (F12).