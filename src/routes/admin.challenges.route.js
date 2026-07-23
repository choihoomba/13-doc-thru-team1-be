import express from 'express';
import adminChallengeController from '../controllers/admin.challenges.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get(
  '/',
  authenticate,
  authorize,
  adminChallengeController.getAdminChallenges
);

router.patch(
  '/:id/status',
  authenticate,
  authorize,
  adminChallengeController.updateChallengeStatus
);

router.delete(
  '/:id',
  authenticate,
  authorize,
  adminChallengeController.deleteChallenge
);

export default router;
