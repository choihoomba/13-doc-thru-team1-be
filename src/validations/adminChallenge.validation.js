import { z } from 'zod';

// GET /challenges?type=admin — 신청 관리 목록 조회
export const getAdminChallengesQuerySchema = z.object({
  type: z.literal('admin'),

  status: z
    .enum(['PENDING', 'APPROVED', 'REJECTED', 'DELETED'])
    .default('PENDING'),

  search: z.string().trim().min(1).optional(),
  field: z
    .enum(['NEXTJS', 'REACT', 'MODERNJS', 'TYPESCRIPT', 'API', 'WEB', 'CAREER'])
    .optional(),
  docType: z.enum(['OFFICIAL', 'BLOG', 'BOOK', 'ETC']).optional(),

  sort: z
    .enum(['appliedAtAsc', 'appliedAtDesc', 'deadlineAsc', 'deadlineDesc'])
    .default('appliedAtDesc'),

  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});
