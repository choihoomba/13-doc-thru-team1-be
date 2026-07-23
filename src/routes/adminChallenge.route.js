import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import * as adminChallengeController from '../controllers/adminChallenge.controller.js';

const router = Router();

router.get(
  '/',
  (req, res, next) => {
    if (req.query.type !== 'admin') {
      return next('route'); // admin 요청 아니면 이 라우트 통째로 건너뛰고 다음 라우터로
    }
    next();
  },
  authenticate,
  authorize,
  adminChallengeController.getList
);

export default router;
