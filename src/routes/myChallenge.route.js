import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import * as myChallengeController from '../controllers/myChallenge.controller.js';

const router = Router();

router.get(
  '/',
  authenticate, // 로그인 필수
  (req, res, next) => {
    // type=me가 아니면 next()로 넘겨 공개 챌린지 목록으로 라우터 넘긴다.
    if (req.query.type !== 'me') {
      return next();
    }
    return myChallengeController.getList(req, res, next);
  }
);

export default router;
