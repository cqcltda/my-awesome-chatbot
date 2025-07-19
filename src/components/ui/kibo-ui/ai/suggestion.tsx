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
  <ScrollArea className="w-full" {...props}>
    <div className={cn('flex flex-wrap items-center gap-3 py-2', className)}>
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
      className={cn(
        'cursor-pointer rounded-xl py-3 px-4 flex flex-col gap-1 items-start h-auto min-w-0',
        'hover:shadow-md transition-all duration-200',
        'border-2 hover:border-primary/50',
        className
      )}
      onClick={handleClick}
      size={size}
      type="button"
      variant={variant}
      {...props}
    >
      <span className="font-medium text-sm leading-tight">{suggestion.title}</span>
      <span className="text-muted-foreground text-xs leading-tight">
        {suggestion.label}
      </span>
    </Button>
  );
};
