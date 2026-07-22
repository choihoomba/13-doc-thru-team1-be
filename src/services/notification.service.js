import * as notificationRepository from '../repositories/notification.repository.js';
import { NotFoundError } from '../utils/errors.js';
import { notificationCreateSchema } from '../validations/notification.validation.js';

async function getNotifications(userId) {
  return notificationRepository.findManyByUserId(userId);
}

// 알림은 이벤트를 처리한 Challenge, Submission, Feedback Service에서 생성합니다.
// transactionClient를 받으면 원본 변경과 알림 저장을 같은 트랜잭션으로 처리할 수 있습니다.
async function createNotification(
  { userId, type, targetType, targetId, message },
  transactionClient
) {
  const validated = notificationCreateSchema.parse({
    userId,
    type,
    targetType,
    targetId,
    message,
  });

  return notificationRepository.create(validated, transactionClient);
}

async function markAsRead(userId, notificationId) {
  const notification = await notificationRepository.findById(notificationId);

  // 다른 사용자의 알림 존재 여부가 노출되지 않도록 소유자가 달라도 404로 처리합니다.
  if (!notification || notification.userId !== userId) {
    throw new NotFoundError('알림을 찾을 수 없습니다.');
  }

  // 이미 읽은 알림도 같은 결과를 반환하여 PATCH 요청을 반복해도 결과가 달라지지 않게 합니다.
  if (notification.isRead) {
    return notification;
  }

  return notificationRepository.updateIsRead(notificationId);
}

export { getNotifications, createNotification, markAsRead };
