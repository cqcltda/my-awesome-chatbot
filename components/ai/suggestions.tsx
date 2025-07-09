'use client';

import { AISuggestion, AISuggestions } from '@/components/ui/kibo-ui/ai/suggestion';
import { memo } from 'react';

interface Props {
  suggestions: {
    title: string;
    label: string;
  }[];
  onSuggestionClick: (suggestion: string) => void;
}

const Suggestions = memo(({ suggestions, onSuggestionClick }: Props) => {
  return (
    <AISuggestions>
      {suggestions.map((suggestion) => (
        <AISuggestion
          key={suggestion.title + suggestion.label}
          onClick={onSuggestionClick}
          suggestion={suggestion}
        />
      ))}
    </AISuggestions>
  );
});

Suggestions.displayName = 'Suggestions';

export { Suggestions };

