'use client';

import {
    AIInput,
    AIInputSubmit,
    AIInputTextarea,
    AIInputToolbar
} from '@/components/ui/kibo-ui/ai/input';
import * as React from 'react';
import { type FormEventHandler, memo, useState } from 'react';

interface Props {
  onSubmit: () => void;
  inputValue: string;
  setInput: (input: string) => void;
  status?: 'submitted' | 'streaming' | 'ready' | 'error';
}

const Input = memo(({ onSubmit, setInput, inputValue, status: externalStatus }: Props) => {
  const [localStatus, setLocalStatus] = useState<
    'submitted' | 'streaming' | 'ready' | 'error'
  >('ready');

  // Use external status if provided, otherwise use local status
  const status = externalStatus || localStatus;

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Ajusta a altura dinamicamente
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  // Foco automático quando o componente é montado
  React.useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();

    // Only update local status if no external status is provided
    if (!externalStatus) {
      setLocalStatus('submitted');
    }

    // Execute the actual onSubmit function
    onSubmit();

    // Only use timeouts if no external status is provided
    if (!externalStatus) {
      setTimeout(() => {
        setLocalStatus('streaming');
      }, 200);

      setTimeout(() => {
        setLocalStatus('ready');
      }, 2000);
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

