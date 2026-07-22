import { z } from 'zod';

export const draftParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const upsertDraftSchema = z.object({
  title: z.string().optional(),
  // 따로 임시저장을 누르면 제목을 입력하라는 모달 등이 떠야함
  content: z.string().min(1, '내용을 입력해주세요'),
});
