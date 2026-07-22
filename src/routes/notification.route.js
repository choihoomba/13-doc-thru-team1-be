import express from 'express';
import * as notificationController from '../controllers/notification.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

// authenticate가 accessToken을 확인한 뒤 Controller에서 사용할 req.user를 만듭니다.
// USER와 ADMIN 모두 자신의 알림만 처리하므로 역할을 제한하는 authorize는 사용하지 않습니다.
router.get('/', authenticate, notificationController.getNotifications);
router.patch('/:id/read', authenticate, notificationController.markAsRead);

export default router;
