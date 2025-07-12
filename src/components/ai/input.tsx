'use client';

import {
  AIInputSubmit,
  AIInputTextarea,
  AIInputToolbar
} from '@/components/ui/kibo-ui/ai/input';
import * as React from 'react';
import { memo } from 'react';

interface Props {
  onSubmit: () => void;
  inputValue: string;
  setInput: (input: string) => void;
  status?: 'submitted' | 'streaming' | 'ready' | 'error';
  stop: () => void;
}

const Input = memo(({ onSubmit, setInput, inputValue, status: externalStatus, stop }: Props) => {
  const status = externalStatus

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  React.useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Reset textarea height when inputValue is cleared (after submission)
  React.useEffect(() => {
    if (textareaRef.current && inputValue === '') {
      // Force the textarea to recalculate its height
      textareaRef.current.style.height = 'auto';
      // Trigger a resize event to ensure the auto-resize hook recalculates
      window.dispatchEvent(new Event('resize'));
    }
  }, [inputValue]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  };

  const handleButtonClick = () => {
    if (status === 'streaming') {
      stop();
      return;
    }

    onSubmit();
  };

  return (
    <div className="w-full divide-y overflow-hidden rounded-xl border bg-background shadow-sm">
      <AIInputTextarea
        ref={textareaRef}
        placeholder="Escreva uma mensagem..."
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        value={inputValue}
        rows={1}
        className="resize-none"
      />
      <AIInputToolbar className="flex justify-end">
        <AIInputSubmit
          disabled={!inputValue}
          status={status}
          onClick={handleButtonClick}
        />
      </AIInputToolbar>
    </div>
  );
});

Input.displayName = 'Input';

export { Input };

