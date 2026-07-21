// ============================================
// Participation Zod 스키마
// ============================================

import { z } from 'zod';

/** 작업 도전하기 등록 스키마
 * @property {number} challengeId
 */
export const createParticipationSchema = z.object({
  challengeId: z.coerce
    .number()
    .int('challengeId는 정수여야 합니다')
    .positive('challengeId는 1 이상이어야 합니다'),
});

/** 작업 도전 포기하기 스키마 (URL 파라미터)
 * @property {number} id
 */
export const cancelParticipationSchema = z.object({
  id: z.coerce
    .number()
    .int('id는 정수여야 합니다')
    .positive('id는 1 이상이어야 합니다'),
});
