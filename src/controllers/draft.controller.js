import draftService from '../services/draft.service.js';
import {
  draftParamSchema,
  upsertDraftSchema,
} from '../validations/draft.validation.js';

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
