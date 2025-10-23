import React, { useState } from 'react';
import { getSentimentRGB, getColorIntensity } from '../utils/colorMapping';
import { POS_TAGS } from '../utils/constants';

/**
 * Word Highlight Component - Zeigt einzelne Wörter mit Annotationen
 */
const WordHighlight = ({ 
  token, 
  sentiment = null,
  onClick = null,
  highlightMode = 'sentiment', // 'sentiment', 'pos', 'entity'
  selected = false 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Wenn es Interpunktion ist
  if (token.isPunctuation) {
    return (
      <span className="inline-block mx-0.5 text-gray-600">
        {token.text}
      </span>
    );
  }

  // Bestimme Hintergrundfarbe basierend auf Modus
  const getBackgroundStyle = () => {
    switch (highlightMode) {
      case 'sentiment':
        if (sentiment && sentiment.label) {
          const score = sentiment.label === 'positiv' ? sentiment.score : 
                       sentiment.label === 'negativ' ? -sentiment.score : 0;
          return {
            backgroundColor: getSentimentRGB(score),
            opacity: getColorIntensity(sentiment.confidence || 0.5)
          };
        }
        return { backgroundColor: 'transparent' };

      case 'pos':
        if (token.posTag && POS_TAGS[token.posTag]) {
          return { 
            backgroundColor: POS_TAGS[token.posTag].color.replace('bg-', 'rgb-'),
            opacity: 0.6 
          };
        }
        return { backgroundColor: 'transparent' };

      case 'entity':
        if (token.entity) {
          return { 
            backgroundColor: '#fef3c7',
            opacity: 0.8 
          };
        }
        return { backgroundColor: 'transparent' };

      default:
        return { backgroundColor: 'transparent' };
    }
  };

  // Tooltip Content
  const getTooltipContent = () => {
    const parts = [];

    // Wort-Info
    parts.push(`Wort: ${token.text}`);

    // Sentiment
    if (sentiment) {
      parts.push(`Sentiment: ${sentiment.label} (${(sentiment.confidence * 100).toFixed(1)}%)`);
    }

    // POS Tag
    if (token.posTag && POS_TAGS[token.posTag]) {
      parts.push(`Wortart: ${POS_TAGS[token.posTag].label}`);
    }

    // Entity
    if (token.entity) {
      parts.push(`Entity: ${token.entityType}`);
    }

    // Morphologie
    if (token.morphology) {
      parts.push(`Silben: ${token.morphology.syllables}`);
    }

    return parts;
  };

  const backgroundStyle = getBackgroundStyle();

  return (
    <span className="relative inline-block">
      <span
        className={`word-token ${selected ? 'ring-2 ring-blue-500' : ''}`}
        style={backgroundStyle}
        onClick={() => onClick && onClick(token)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {token.text}
      </span>

      {/* Tooltip */}
      {isHovered && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap pointer-events-none">
          <div className="space-y-1">
            {getTooltipContent().map((line, index) => (
              <div key={index}>{line}</div>
            ))}
          </div>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </span>
  );
};

export default WordHighlight;