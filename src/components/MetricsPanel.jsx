import React from 'react';
import { BarChart3, TrendingUp, Hash, BookOpen, Zap, Target } from 'lucide-react';

/**
 * Metrics Panel Component - Zeigt Analyse-Metriken
 */
const MetricsPanel = ({ analysisResult }) => {
  if (!analysisResult) return null;

  const { summary, readability, sentiment, syntax } = analysisResult;

  const MetricCard = ({ icon: Icon, label, value, subtext, color = 'blue' }) => (
    <div className="p-4 bg-white rounded-lg border hover:shadow-md transition-shadow">
      <div className="flex items-center space-x-3">
        <div className={`p-2 bg-${color}-100 rounded-lg`}>
          <Icon className={`w-5 h-5 text-${color}-600`} />
        </div>
        <div className="flex-1">
          <div className="text-sm text-gray-600">{label}</div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          {subtext && (
            <div className="text-xs text-gray-500 mt-1">{subtext}</div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Basis-Statistiken */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <span>Basis-Statistiken</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            icon={Hash}
            label="Wörter"
            value={summary.basicStats.wordCount}
            subtext={` ${summary.basicStats.avgWordLength} Zeichen/Wort`}
            color="blue"
          />
          <MetricCard
            icon={BookOpen}
            label="Sätze"
            value={summary.basicStats.sentenceCount}
            subtext={` ${summary.basicStats.avgWordsPerSentence} Wörter/Satz`}
            color="green"
          />
          <MetricCard
            icon={Zap}
            label="Lesbarkeit"
            value={summary.basicStats.readingEase}
            subtext="Flesch-Reading-Ease"
            color="purple"
          />
        </div>
      </div>

      {/* Sentiment */}
      {sentiment && sentiment.overall && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span>Sentiment-Analyse</span>
          </h3>
          <div className="analysis-card">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Gesamt-Sentiment:</span>
                <span className={`metric-badge ${
                  sentiment.overall.label === 'positiv' ? 'bg-green-100 text-green-800' :
                  sentiment.overall.label === 'negativ' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {sentiment.overall.label.toUpperCase()}
                </span>
              </div>
              <div className="text-xs text-gray-600">
                Konfidenz: {(sentiment.overall.confidence * 100).toFixed(1)}%
              </div>
            </div>

            {/* Sentiment Distribution */}
            {sentiment.statistics && (
              <div className="space-y-3">
                <div className="text-sm font-medium mb-2">Verteilung:</div>
                
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Positiv</span>
                      <span>{sentiment.statistics.distribution.positive}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${sentiment.statistics.distribution.positive}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Negativ</span>
                      <span>{sentiment.statistics.distribution.negative}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full transition-all"
                        style={{ width: `${sentiment.statistics.distribution.negative}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Neutral</span>
                      <span>{sentiment.statistics.distribution.neutral}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gray-500 h-2 rounded-full transition-all"
                        style={{ width: `${sentiment.statistics.distribution.neutral}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stil & Struktur */}
      {summary.style && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <Target className="w-5 h-5 text-blue-600" />
            <span>Stil & Struktur</span>
          </h3>
          <div className="analysis-card">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Interpunktion</div>
                <div className="font-semibold">{summary.style.punctuationStyle}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Reimschema</div>
                <div className="font-semibold">{summary.style.rhymeScheme}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Alliterationen</div>
                <div className="font-semibold">{summary.style.alliterationsCount}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Wiederholungen</div>
                <div className="font-semibold">{summary.style.repetitionsCount}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KomplexitÃ¤t */}
      {summary.complexity && (
        <div className="analysis-card">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold">Text-Komplexität</h4>
            <span className={`metric-badge ${
              summary.complexity.level === 'Sehr komplex' ? 'bg-red-100 text-red-800' :
              summary.complexity.level === 'Komplex' ? 'bg-orange-100 text-orange-800' :
              summary.complexity.level === 'Mittel' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {summary.complexity.level}
            </span>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Komplexitäts-Score</span>
              <span className="font-semibold">{summary.complexity.score} / 100</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all"
                style={{ 
                  width: `${summary.complexity.score}%`,
                  backgroundColor: summary.complexity.score > 75 ? '#ef4444' :
                                   summary.complexity.score > 50 ? '#f97316' :
                                   summary.complexity.score > 25 ? '#eab308' : '#22c55e'
                }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Themen */}
      {summary.themes && summary.themes.length > 0 && (
        <div className="analysis-card">
          <h4 className="font-semibold mb-3">Hauptthemen</h4>
          <div className="flex flex-wrap gap-2">
            {summary.themes.map((theme, index) => (
              <span 
                key={index}
                className="metric-badge bg-blue-100 text-blue-800"
              >
                {typeof theme === "string" ? theme : theme.phrase || theme}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MetricsPanel;