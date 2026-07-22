import { Router } from 'express';
import * as challengeController from '../controllers/challenges.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authenticate, challengeController.getChallengesController);

export default router;
