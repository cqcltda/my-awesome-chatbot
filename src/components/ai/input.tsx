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
  onFocus?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
}

const Input = memo(({ onSubmit, setInput, inputValue, status: externalStatus, stop, onFocus }: Props) => {
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
    <div className="w-full overflow-hidden rounded-2xl border-2 border-muted bg-background shadow-sm hover:shadow-md transition-shadow duration-200">
      <AIInputTextarea
        ref={textareaRef}
        placeholder="Escreva uma mensagem..."
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
        value={inputValue}
        rows={1}
        className="resize-none min-h-[56px]"
      />
      <AIInputToolbar className="flex justify-end px-2 pb-2">
        <AIInputSubmit
          disabled={!inputValue}
          status={status}
          onClick={handleButtonClick}
          className="rounded-full hover:scale-105 transition-transform duration-200"
        />
      </AIInputToolbar>
    </div>
  );
});

Input.displayName = 'Input';

export { Input };

