import { z } from 'zod';

const textPartSchema = z.object({
  text: z.string().min(1).max(2000),
  type: z.enum(['text']),
});

// Schema para as informações do usuário
const userInfoSchema = z.object({
  name: z.string().optional(),
  age: z.number().optional(),
  gender: z.string().optional(),
  weight: z.number().optional(),
  height: z.number().optional(),
  profession: z.string().optional(),
  location: z.string().optional(),
  contact: z.string().optional(),
  mainComplaint: z.string().optional(),
  duration: z.string().optional(),
  intensity: z.number().optional(),
});

export const postRequestBodySchema = z.object({
  id: z.string().uuid(),
  message: z.object({
    id: z.string().uuid(),
    createdAt: z.coerce.date(),
    role: z.enum(['user']),
    content: z.string().min(1).max(2000),
    parts: z.array(textPartSchema),
    experimental_attachments: z
      .array(
        z.object({
          url: z.string().url(),
          name: z.string().min(1).max(2000),
          contentType: z.enum(['image/png', 'image/jpg', 'image/jpeg']),
        }),
      )
      .optional(),
  }),
  selectedChatModel: z.enum(['chat-model']),
  selectedVisibilityType: z.enum(['public', 'private']),
  userInfo: userInfoSchema.optional(),
  chatStep: z.enum(['GATHERING_INFO', 'MEDICAL_EVALUATION', 'TRIAGE', 'DECISION', 'FINAL_RECOMMENDATION']).optional(),
});

export type PostRequestBody = z.infer<typeof postRequestBodySchema>;
