// req에서 값 꺼내기 → zod 파싱 → 서비스 호출 → res 응답.
// parse() 실패 시 ZodError를 throw → 전역 에러 핸들러가 400(VALIDATION_ERROR)으로 처리.
import feedbackService from '../services/feedback.service.js';
import {
  createFeedbackSchema,
  updateFeedbackSchema,
} from '../validations/feedback.validation.js';

// GET /submissions/:submissionId/feedbacks
async function getFeedbacks(req, res) {
  // URL/쿼리 값은 전부 문자열 → id가 Int이므로 Number 변환 필수
  const submissionId = Number(req.params.submissionId);
  const cursor = req.query.cursor ? Number(req.query.cursor) : undefined;
  const take = req.query.take ? Number(req.query.take) : undefined;

  const result = await feedbackService.getFeedbacks(submissionId, {
    cursor,
    take,
  });
  res.json(result);
}

// POST /submissions/:submissionId/feedbacks
async function createFeedback(req, res) {
  const submissionId = Number(req.params.submissionId);
  const userId = req.user.id; // auth 미들웨어가 심어준 값

  const { content } = createFeedbackSchema.parse(req.body);

  const feedback = await feedbackService.createFeedback(
    submissionId,
    userId,
    content,
  );
  res.status(201).json(feedback); // 201 Created
}

// PATCH /feedbacks/:feedbackId
async function updateFeedback(req, res) {
  const feedbackId = Number(req.params.feedbackId);
  const userId = req.user.id;
  const userRole = req.user.role; // 어드민 판정용

  const { content } = updateFeedbackSchema.parse(req.body);

  const feedback = await feedbackService.updateFeedback(
    feedbackId,
    userId,
    userRole,
    content,
  );
  res.json(feedback);
}

// DELETE /feedbacks/:feedbackId
async function deleteFeedback(req, res) {
  const feedbackId = Number(req.params.feedbackId);
  const userId = req.user.id;
  const userRole = req.user.role;

  await feedbackService.deleteFeedback(feedbackId, userId, userRole);
  res.status(204).send(); // 204 No Content
}

export default {
  getFeedbacks,
  createFeedback,
  updateFeedback,
  deleteFeedback,
};