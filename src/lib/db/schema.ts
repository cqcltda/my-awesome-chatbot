// Schema simplificado para chatbot médico sem persistência
// Mantido apenas para compatibilidade com migrações existentes

import type { InferSelectModel } from 'drizzle-orm';
import {
    pgTable,
    text,
    timestamp,
    uuid
} from 'drizzle-orm/pg-core';

// Tabela mínima para compatibilidade
export const chat = pgTable('Chat', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  createdAt: timestamp('createdAt').notNull(),
  title: text('title').notNull(),
});

export type Chat = InferSelectModel<typeof chat>;
