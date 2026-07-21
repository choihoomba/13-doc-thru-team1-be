// req에서 값 꺼내기 → zod 파싱 → 서비스 호출 → res 응답.
// parse() 실패 시 ZodError를 throw → 전역 에러 핸들러가 400(VALIDATION_ERROR)으로 처리.
import * as feedbackService from '../services/feedback.service.js';
import {
  submissionIdParamSchema,
  feedbackIdParamSchema,
  feedbackQuerySchema,
  createFeedbackSchema,
  updateFeedbackSchema,
} from '../validations/feedback.validation.js';

// GET /submissions/:submissionId/feedbacks
export async function getFeedbacks(req, res) {
  const { submissionId } = submissionIdParamSchema.parse(req.params);
  const { cursor, take } = feedbackQuerySchema.parse(req.query);

  const data = await feedbackService.getFeedbacks(submissionId, {
    cursor,
    take,
  });
  res.status(200).json({ success: true, data });
}

// POST /submissions/:submissionId/feedbacks
export async function createFeedback(req, res) {
  const { submissionId } = submissionIdParamSchema.parse(req.params);
  const { content } = createFeedbackSchema.parse(req.body);
  const { userId } = req.user; // authenticate가 심어준 값

  const data = await feedbackService.createFeedback(
    submissionId,
    userId,
    content
  );
  res.status(201).json({ success: true, data });
}

// PATCH /feedbacks/:feedbackId
export async function updateFeedback(req, res) {
  const { feedbackId } = feedbackIdParamSchema.parse(req.params);
  const { content } = updateFeedbackSchema.parse(req.body);
  const { userId, role } = req.user; // role은 어드민 판정용

  const data = await feedbackService.updateFeedback(
    feedbackId,
    userId,
    role,
    content
  );
  res.status(200).json({ success: true, data });
}

// DELETE /feedbacks/:feedbackId
export async function deleteFeedback(req, res) {
  const { feedbackId } = feedbackIdParamSchema.parse(req.params);
  const { userId, role } = req.user;

  await feedbackService.deleteFeedback(feedbackId, userId, role);
  // 공통 응답 형식을 유지하기 위해 204(No Content) 대신 200 + { success: true }
  res.status(200).json({ success: true });
}
