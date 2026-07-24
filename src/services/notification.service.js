import * as notificationRepository from '../repositories/notification.repository.js';
import { NotFoundError } from '../utils/errors.js';
import { notificationCreateSchema } from '../validations/notification.validation.js';

/**
 * 로그인 사용자의 알림 목록을 조회합니다.
 */
async function getNotifications(userId) {
  return notificationRepository.findManyByUserId(userId);
}

/**
 * 도메인 Service가 사용하는 내부 알림 생성 공통 함수입니다.
 *
 * 외부 `POST /notifications`를 만들지 않는 이유:
 * - 클라이언트가 수신자와 메시지를 조작해 허위 알림을 만들 수 있음
 * - 원본 변경 요청과 알림 요청이 분리되어 한쪽만 성공할 수 있음
 *
 * 따라서 Challenge 승인/거절/수정/삭제를 실제로 처리한 Service가 DB에서 확인한
 * 신청자 ID와 실제 target ID로 이 함수를 호출합니다.
 *
 * @param {object} notification 알림 수신자, 종류, 대상, 문구
 * @param {object|undefined} transactionClient 원본 변경과 같은 Prisma client
 *
 * transactionClient가 전달되면 Notification Repository도 같은 작업 단위에
 * 참여하므로 원본 변경과 알림은 함께 commit 또는 rollback됩니다.
 */
async function createNotification(
  { userId, type, targetType, targetId, message },
  transactionClient
) {
  // 내부 호출이라도 enum, ID, 메시지 길이를 공통 Schema로 다시 검증합니다.
  const validated = notificationCreateSchema.parse({
    userId,
    type,
    targetType,
    targetId,
    message,
  });

  return notificationRepository.create(validated, transactionClient);
}

/**
 * PATCH /notifications/:id/read의 읽음 처리를 수행합니다.
 *
 * - 본인의 알림만 변경 가능
 * - 다른 사용자의 알림도 "존재하지만 권한 없음"을 노출하지 않고 404
 * - 이미 읽은 알림은 그대로 반환해 반복 PATCH가 같은 결과를 내는 멱등 처리
 */
async function markAsRead(userId, notificationId) {
  const notification = await notificationRepository.findById(notificationId);

  // 소유자가 아니어도 레코드 존재 여부를 유추할 수 없게 같은 404를 반환합니다.
  if (!notification || notification.userId !== userId) {
    throw new NotFoundError('알림을 찾을 수 없습니다.');
  }

  // 이미 읽은 경우 불필요한 DB update 없이 현재 리소스를 반환합니다.
  if (notification.isRead) {
    return notification;
  }

  return notificationRepository.updateIsRead(notificationId);
}

export { getNotifications, createNotification, markAsRead };
