import express from 'express';
import challengeController from '../controllers/challenges.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', authenticate, challengeController.getChallengeList);
router.post('/', authenticate, challengeController.createChallenge);
router.get('/:id', authenticate, challengeController.getChallengeDetail);

export default router;
