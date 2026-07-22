import * as notificationService from '../services/notification.service.js';
import { notificationIdParamsSchema } from '../validations/notification.validation.js';

// Controller는 HTTP 요청 값을 꺼내 Service에 전달하고 공통 응답 형식으로 반환합니다.
// 인증 실패와 비즈니스 예외는 각각 인증 미들웨어와 전역 에러 핸들러가 처리합니다.
async function getNotifications(req, res) {
  const { userId } = req.user;
  const notifications = await notificationService.getNotifications(userId);

  return res.status(200).json({
    success: true,
    data: notifications,
  });
}

async function markAsRead(req, res) {
  const { userId } = req.user;

  // req.params는 문자열이므로 숫자 변환과 양수 검증을 함께 수행합니다.
  const { id: notificationId } = notificationIdParamsSchema.parse(req.params);
  const notification = await notificationService.markAsRead(
    userId,
    notificationId
  );

  return res.status(200).json({
    success: true,
    data: notification,
  });
}

export { getNotifications, markAsRead };
