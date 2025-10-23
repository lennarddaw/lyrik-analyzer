import React, { useState } from 'react';
import { Eye, Download, Filter } from 'lucide-react';
import WordHighlight from './WordHighlight';

/**
 * Analysis Display Component - Hauptansicht für die Analyse
 */
const AnalysisDisplay = ({ analysisResult, onWordClick }) => {
  const [highlightMode, setHighlightMode] = useState('sentiment');
  const [selectedWord, setSelectedWord] = useState(null);

  if (!analysisResult) return null;

  const { tokens, sentiment, text } = analysisResult;

  // Kombiniere Token mit Sentiment-Daten
  const enrichedTokens = tokens.all.map(token => {
    const wordSentiment = sentiment?.words?.find(s => s.position === token.position);
    return {
      ...token,
      sentiment: wordSentiment?.sentiment || null
    };
  });

  const handleWordClick = (token) => {
    setSelectedWord(token);
    if (onWordClick) {
      onWordClick(token);
    }
  };

  const exportAnalysis = () => {
    const exportData = {
      text: text.original,
      analyzedAt: new Date().toISOString(),
      tokens: enrichedTokens,
      sentiment: sentiment,
      summary: analysisResult.summary
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `lyrik-analyse-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="analysis-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Eye className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Analyse-Ansicht</h3>
          </div>
          
          <button
            onClick={exportAnalysis}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            <span>Exportieren</span>
          </button>
        </div>

        {/* Highlight Mode Selector */}
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="w-4 h-4 text-gray-600" />
          <span className="text-sm text-gray-600">Hervorhebung:</span>
          <div className="flex space-x-2">
            <button
              onClick={() => setHighlightMode('sentiment')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                highlightMode === 'sentiment'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Sentiment
            </button>
            <button
              onClick={() => setHighlightMode('pos')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                highlightMode === 'pos'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Wortart
            </button>
            <button
              onClick={() => setHighlightMode('entity')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                highlightMode === 'entity'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Entitäten
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-600 mb-2">Legende:</div>
          <div className="flex flex-wrap gap-3 text-xs">
            {highlightMode === 'sentiment' && (
              <>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgb(16, 185, 129)' }}></div>
                  <span>Positiv</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgb(239, 68, 68)' }}></div>
                  <span>Negativ</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded bg-gray-300"></div>
                  <span>Neutral</span>
                </div>
              </>
            )}
            {highlightMode === 'pos' && (
              <>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded bg-blue-200"></div>
                  <span>Nomen</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded bg-green-200"></div>
                  <span>Verb</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded bg-yellow-200"></div>
                  <span>Adjektiv</span>
                </div>
              </>
            )}
            {highlightMode === 'entity' && (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-yellow-100"></div>
                <span>Named Entity</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Text Display */}
      <div className="analysis-card">
        <div className="text-lg leading-relaxed">
          {enrichedTokens.map((token, index) => (
            <React.Fragment key={index}>
              <WordHighlight
                token={token}
                sentiment={token.sentiment}
                onClick={handleWordClick}
                highlightMode={highlightMode}
                selected={selectedWord?.position === token.position}
              />
              {token.text === '\n' && <br />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Selected Word Details */}
      {selectedWord && (
        <div className="analysis-card bg-blue-50 border-blue-200">
          <h4 className="font-semibold mb-3">Wort-Details: "{selectedWord.text}"</h4>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Position</div>
              <div className="font-medium">{selectedWord.position + 1}</div>
            </div>

            {selectedWord.sentiment && (
              <>
                <div>
                  <div className="text-gray-600">Sentiment</div>
                  <div className="font-medium capitalize">{selectedWord.sentiment.label}</div>
                </div>
                <div>
                  <div className="text-gray-600">Konfidenz</div>
                  <div className="font-medium">
                    {(selectedWord.sentiment.confidence * 100).toFixed(1)}%
                  </div>
                </div>
              </>
            )}

            {selectedWord.posTag && (
              <div>
                <div className="text-gray-600">Wortart</div>
                <div className="font-medium">{selectedWord.posTag}</div>
              </div>
            )}

            {selectedWord.entityType && (
              <div>
                <div className="text-gray-600">Entity-Typ</div>
                <div className="font-medium">{selectedWord.entityType}</div>
              </div>
            )}

            {selectedWord.morphology && (
              <>
                <div>
                  <div className="text-gray-600">Länge</div>
                  <div className="font-medium">{selectedWord.morphology.length} Zeichen</div>
                </div>
                <div>
                  <div className="text-gray-600">Silben</div>
                  <div className="font-medium">{selectedWord.morphology.syllables}</div>
                </div>
              </>
            )}

            {selectedWord.wordClass && (
              <div className="col-span-2">
                <div className="text-gray-600">Komplexität</div>
                <div className="font-medium">{selectedWord.wordClass.complexity}/100</div>
              </div>
            )}
          </div>

          <button
            onClick={() => setSelectedWord(null)}
            className="mt-4 text-sm text-blue-600 hover:text-blue-800"
          >
            Schließen
          </button>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="analysis-card text-center">
          <div className="text-2xl font-bold text-blue-600">
            {tokens.words.length}
          </div>
          <div className="text-sm text-gray-600">Wörter</div>
        </div>
        
        <div className="analysis-card text-center">
          <div className="text-2xl font-bold text-green-600">
            {analysisResult.sentences.count}
          </div>
          <div className="text-sm text-gray-600">Sätze</div>
        </div>

        {sentiment?.statistics && (
          <>
            <div className="analysis-card text-center">
              <div className="text-2xl font-bold text-emerald-600">
                {sentiment.statistics.positiveCount}
              </div>
              <div className="text-sm text-gray-600">Positiv</div>
            </div>
            
            <div className="analysis-card text-center">
              <div className="text-2xl font-bold text-red-600">
                {sentiment.statistics.negativeCount}
              </div>
              <div className="text-sm text-gray-600">Negativ</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AnalysisDisplay;