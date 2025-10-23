import React, { useState, useEffect } from 'react';
import { FileText, X, Send } from 'lucide-react';

/**
 * Text Input Component für Gedichteingabe
 */
const TextInput = ({ 
  onAnalyze, 
  isAnalyzing = false,
  placeholder = "Geben Sie hier Ihren deutschen Text oder Ihr Gedicht ein...",
  maxLength = 5000
}) => {
  const [text, setText] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    setCharCount(text.length);
    
    if (text.length > maxLength) {
      setError(`Text ist zu lang (max. ${maxLength} Zeichen)`);
    } else if (text.length > 0 && text.length < 10) {
      setError('Text ist zu kurz (mind. 10 Zeichen)');
    } else {
      setError('');
    }
  }, [text, maxLength]);

  const handleSubmit = () => {
    if (text.trim().length < 10) {
      setError('Bitte geben Sie mindestens 10 Zeichen ein');
      return;
    }

    if (text.length > maxLength) {
      setError(`Text ist zu lang (max. ${maxLength} Zeichen)`);
      return;
    }

    onAnalyze(text);
  };

  const handleClear = () => {
    setText('');
    setError('');
  };

  const handleKeyDown = (e) => {
    // Strg/Cmd + Enter für Analyse
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Beispiel-Texte
  const exampleTexts = [
    {
      title: 'Der Panther',
      text: 'Sein Blick ist vom Vorübergehn der Stäbe\nso müd geworden, dass er nichts mehr hält.\nIhm ist, als ob es tausend Stäbe gäbe\nund hinter tausend Stäben keine Welt.'
    },
    {
      title: 'Erlkönig (Auszug)',
      text: 'Wer reitet so spät durch Nacht und Wind?\nEs ist der Vater mit seinem Kind;\nEr hat den Knaben wohl in dem Arm,\nEr fasst ihn sicher, er hält ihn warm.'
    }
  ];

  const loadExample = (example) => {
    setText(example.text);
  };

  return (
    <div className="analysis-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Text-Eingabe</h3>
        </div>
        
        {text && (
          <button
            onClick={handleClear}
            className="text-gray-500 hover:text-gray-700 p-1"
            disabled={isAnalyzing}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Textarea */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isAnalyzing}
        className="w-full h-64 p-4 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        maxLength={maxLength}
      />

      {/* Character Count & Error */}
      <div className="flex justify-between items-center mt-2">
        <div className="text-sm">
          {error ? (
            <span className="text-red-600">{error}</span>
          ) : (
            <span className="text-gray-500">
              Zeichen: {charCount} / {maxLength}
            </span>
          )}
        </div>

        {charCount >= 10 && !error && (
          <div className="text-xs text-gray-500">
            Tipp: Strg/Cmd + Enter zum Analysieren
          </div>
        )}
      </div>

      {/* Analyze Button */}
      <button
        onClick={handleSubmit}
        disabled={isAnalyzing || error !== '' || text.trim().length < 10}
        className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {isAnalyzing ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Analysiere...</span>
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            <span>Text Analysieren</span>
          </>
        )}
      </button>

      {/* Example Texts */}
      {!text && (
        <div className="mt-6 pt-6 border-t">
          <p className="text-sm text-gray-600 mb-3">Beispiel-Texte:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {exampleTexts.map((example, index) => (
              <button
                key={index}
                onClick={() => loadExample(example)}
                className="p-3 border rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="font-medium text-sm text-blue-600 mb-1">
                  {example.title}
                </div>
                <div className="text-xs text-gray-500 line-clamp-2">
                  {example.text}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TextInput;