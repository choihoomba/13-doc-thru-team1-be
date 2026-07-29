import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/signin', authController.signin);
router.get('/me', authenticate, authController.getMe);
router.post('/signout', authenticate, authController.signout);
router.post('/refresh', authController.refresh);

export default router;
