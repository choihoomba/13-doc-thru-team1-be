import { z } from 'zod';

// URL 경로 매개변수는 문자열로 전달되므로 숫자로 변환한 뒤 양의 정수인지 확인합니다.
const notificationIdParamsSchema = z.object({
  id: z.coerce
    .number()
    .int('알림 ID는 정수여야 합니다.')
    .positive('알림 ID는 1 이상의 정수여야 합니다.'),
});

export { notificationIdParamsSchema };
