// ============================================
// 챌린지 참여 라우트
// - 작업 도전하기
// - 작업 도전 포기하기
// ============================================

import express from 'express';
import participationController from '../controllers/participations.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const participationRouter = express.Router();

/** 작업 도전하기 라우트 */
participationRouter.post(
  '/',
  authenticate,
  participationController.createParticipation
);

/** 작업 도전 포기하기 라우트 */
participationRouter.patch(
  '/:id',
  authenticate,
  participationController.cancelParticipation
);

export default participationRouter;
