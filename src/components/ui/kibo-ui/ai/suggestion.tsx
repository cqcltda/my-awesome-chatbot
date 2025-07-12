'use client';

import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { ComponentProps } from 'react';

export type AISuggestionsProps = ComponentProps<typeof ScrollArea>;

export const AISuggestions = ({
  className,
  children,
  ...props
}: AISuggestionsProps) => (
  <ScrollArea className="w-full overflow-x-auto whitespace-nowrap" {...props}>
    <div className={cn('flex w-max flex-nowrap items-center gap-2', className)}>
      {children}
    </div>
    <ScrollBar className="hidden" orientation="horizontal" />
  </ScrollArea>
);

export type AISuggestionProps = Omit<
  ComponentProps<typeof Button>,
  'onClick'
> & {
  suggestion: {
    title: string;
    label: string;
  };
  onClick?: (suggestion: string) => void;
};

export const AISuggestion = ({
  suggestion,
  onClick,
  className,
  variant = 'outline',
  size = 'sm',
  children,
  ...props
}: AISuggestionProps) => {
  const handleClick = () => {
    onClick?.(suggestion.title + ' ' + suggestion.label);
  };

  return (
    <Button
      className={cn('cursor-pointer rounded-xl py-2 px-4 flex flex-col gap-1 items-start h-auto', className)}
      onClick={handleClick}
      size={size}
      type="button"
      variant={variant}
      {...props}
    >
      <span className="font-medium">{suggestion.title}</span>
      <span className="text-muted-foreground">
        {suggestion.label}
      </span>
    </Button>
  );
};
