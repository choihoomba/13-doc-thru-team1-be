import express from 'express';
import myChallengeController from '../controllers/my-challenges.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', authenticate, myChallengeController.getMyChallenges);
router.get('/:id', authenticate, myChallengeController.getMyChallengeDetail);
router.patch(
  '/:id/cancel',
  authenticate,
  myChallengeController.cancelMyChallenge
);

export default router;
