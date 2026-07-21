import express from 'express';
import * as feedbackController from '../controllers/feedback.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

// 목록 + 생성 : submission에 속한 컬렉션
router
  .route('/submissions/:submissionId/feedbacks')
  .get(feedbackController.getFeedbacks) // 조회는 비로그인 허용
  .post(authenticate, feedbackController.createFeedback);

// 수정 + 삭제 : feedback 자체를 id로 특정
router
  .route('/feedbacks/:feedbackId')
  .patch(authenticate, feedbackController.updateFeedback)
  .delete(authenticate, feedbackController.deleteFeedback);

export default router;
