import { z } from 'zod';
import * as draftService from '../services/draft.service.js';

const draftParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const upsertDraftSchema = z.object({
  title: z.string().optional(), // 제목은 challenge에서 가져와서 써서 seed로 넣지 않는 이상 null 값으로 되어있을것 같음
  // 아니면 따로 임시저장을 누르면 제목을 입력하라는 모달 등이 떠야함
  content: z.string().min(1, '내용을 입력해주세요'),
});

// 임시저장 (upsert)
export async function upsertDraft(req, res) {
  const { id } = draftParamSchema.parse(req.params);
  const { title, content } = upsertDraftSchema.parse(req.body);
  const draft = await draftService.upsertDraft(req.user.userId, id, {
    title,
    content,
  });
  res.status(200).json({ success: true, data: draft });
}

// 임시저장 삭제
export async function deleteDraft(req, res) {
  const { id } = draftParamSchema.parse(req.params);
  await draftService.deleteDraft(req.user.userId, id);
  res.status(200).json({ success: true, data: null });
}
