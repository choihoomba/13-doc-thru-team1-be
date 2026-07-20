import { z } from 'zod';
import * as draftService from '../services/draft.service.js';

const draftParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const upsertDraftSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1, '내용을 입력해주세요'),
});

// 임시저장 (upsert)
export async function upsertDraft(req, res) {
  const { id } = draftParamSchema.parse(req.params);
  const { title, content } = upsertDraftSchema.parse(req.body);
  const draft = await draftService.upsertDraft(req.user.id, id, {
    title,
    content,
  });
  res.status(200).json({ success: true, data: draft });
}

// 임시저장 삭제
export async function deleteDraft(req, res) {
  const { id } = draftParamSchema.parse(req.params);
  await draftService.deleteDraft(req.user.id, id);
  res.status(200).json({ success: true, data: null });
}
