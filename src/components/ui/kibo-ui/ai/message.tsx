import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

export type AIMessageProps = HTMLAttributes<HTMLDivElement> & {
  from: 'user' | 'assistant';
};

export const AIMessage = ({ className, from, ...props }: AIMessageProps) => (
  <div
    className={cn(
      'group flex w-full items-start gap-3 py-2',
      from === 'user' ? 'justify-end' : 'justify-start',
      '[&>div]:max-w-[85%]',
      className
    )}
    {...props}
  />
);

export type AIMessageContentProps = HTMLAttributes<HTMLDivElement>;

export const AIMessageContent = ({
  children,
  className,
  ...props
}: AIMessageContentProps) => (
  <div
    className={cn(
      'flex flex-col gap-2 rounded-2xl px-4 py-3 text-sm break-words shadow-sm',
      'bg-muted text-foreground',
      'group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground',
      'group-[.is-user]:shadow-md',
      className
    )}
    {...props}
  >
    <div className="break-words leading-relaxed">{children}</div>
  </div>
);
