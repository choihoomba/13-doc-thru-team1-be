import express from 'express';
import * as likeController from '../controllers/like.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

// 좋아요는 등록/취소 모두 로그인 필수
router
  .route('/submissions/:submissionId/likes')
  .post(authenticate, likeController.addLike)
  .delete(authenticate, likeController.removeLike);

export default router;