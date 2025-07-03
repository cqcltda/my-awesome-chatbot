'use client';

import { AISuggestion, AISuggestions } from '@/components/ui/kibo-ui/ai/suggestion';

interface Props {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
}

const Suggestions = ({ suggestions, onSuggestionClick }: Props) => {
  return (
    <AISuggestions>
      {suggestions.map((suggestion) => (
        <AISuggestion
          key={suggestion}
          onClick={onSuggestionClick}
          suggestion={suggestion}
        />
      ))}
    </AISuggestions>
  );
};

export { Suggestions };
