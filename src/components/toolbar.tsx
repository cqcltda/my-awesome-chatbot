'use client';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { UseChatHelpers } from '@ai-sdk/react';
import cx from 'classnames';
import { motion } from 'framer-motion';
import { StopIcon } from './icons';

// Toolbar simplificado para o chatbot médico
export const Toolbar = ({
  status,
  stop,
}: {
  status: UseChatHelpers['status'];
  stop: UseChatHelpers['stop'];
}) => {
  const isStreaming = status === 'streaming';

  if (!isStreaming) {
    return null;
  }

  return (
    <motion.div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            className={cx(
              'p-3 rounded-full bg-background border shadow-lg',
              'hover:bg-accent transition-colors'
            )}
            onClick={stop}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <StopIcon />
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side="top">
          Parar geração
        </TooltipContent>
      </Tooltip>
    </motion.div>
  );
};
