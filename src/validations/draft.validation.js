import { z } from 'zod';

export const draftParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const upsertDraftSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1, '내용을 입력해주세요'),
});
