import { z } from 'zod';

// 좋아요는 body가 없다 — 누가(쿠키) 어느 작업물에(URL) 눌렀는지가 전부
// 따라서 URL 파라미터만 검증한다
export const submissionIdParamSchema = z.object({
  submissionId: z.coerce
    .number({ error: 'submissionId는 숫자여야 합니다.' })
    .int('submissionId는 정수여야 합니다.')
    .positive('submissionId는 양수여야 합니다.'),
});