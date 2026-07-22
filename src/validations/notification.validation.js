import { z } from 'zod';
import { NotificationType, NotificationTargetType } from '@prisma/client';

// 알림 생성은 다른 도메인의 Service에서 호출되지만, 잘못된 값이 DB까지 전달되지 않도록
// 공통 생성 함수에서 사용할 입력 스키마를 정의합니다.
const notificationCreateSchema = z.object({
  userId: z.number().int().positive('userId는 1 이상의 정수여야 합니다.'),
  type: z.enum(NotificationType, {
    error: '유효하지 않은 알림 종류입니다.',
  }),
  targetType: z.enum(NotificationTargetType, {
    error: '유효하지 않은 대상 종류입니다.',
  }),
  targetId: z.number().int().positive('targetId는 1 이상의 정수여야 합니다.'),
  message: z
    .string()
    .trim()
    .min(1, '알림 메시지는 1자 이상이어야 합니다.')
    .max(255, '알림 메시지는 255자를 초과할 수 없습니다.'),
});

// URL 경로 매개변수는 문자열로 전달되므로 숫자로 변환한 뒤 양의 정수인지 확인합니다.
const notificationIdParamsSchema = z.object({
  id: z.coerce
    .number()
    .int('알림 ID는 정수여야 합니다.')
    .positive('알림 ID는 1 이상의 정수여야 합니다.'),
});

export { notificationCreateSchema, notificationIdParamsSchema };
