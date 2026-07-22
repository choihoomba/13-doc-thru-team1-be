import { z } from 'zod';

export const submissionIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const submissionListQuerySchema = z.object({
  challengeId: z.coerce.number().int().positive().optional(),
  orderBy: z.enum(['likeDesc']).optional(),
  include: z.enum(['user', 'draft']).optional(),
});

export const submissionDetailQuerySchema = z.object({
  include: z.enum(['feedback']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(3),
});

export const updateSubmissionSchema = z.object({
  content: z.string().trim().min(1, '내용을 입력해주세요'),
});
