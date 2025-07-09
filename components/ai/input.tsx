'use client';

import {
  AIInput,
  AIInputSubmit,
  AIInputTextarea,
  AIInputToolbar
} from '@/components/ui/kibo-ui/ai/input';
import * as React from 'react';
import { type FormEventHandler, memo } from 'react';

interface Props {
  onSubmit: () => void;
  inputValue: string;
  setInput: (input: string) => void;
  status?: 'submitted' | 'streaming' | 'ready' | 'error';
}

const Input = memo(({ onSubmit, setInput, inputValue, status: externalStatus }: Props) => {
  const status = externalStatus

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  React.useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();

    onSubmit();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  };

  const handleButtonClick = () => {
    onSubmit();
  };

  return (
    <AIInput onSubmit={handleSubmit}>
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
    </AIInput>
  );
});

Input.displayName = 'Input';

export { Input };

