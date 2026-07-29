import { z } from 'zod';

// URL 파라미터 검증
// z.coerce가 문자열 → 숫자 변환과 검증을 함께 처리하므로 컨트롤러의 Number() 변환이 불필요
export const submissionIdParamSchema = z.object({
  submissionId: z.coerce
    .number({ error: 'submissionId는 숫자여야 합니다.' })
    .int('submissionId는 정수여야 합니다.')
    .positive('submissionId는 양수여야 합니다.'),
});

export const feedbackIdParamSchema = z.object({
  feedbackId: z.coerce
    .number({ error: 'feedbackId는 숫자여야 합니다.' })
    .int('feedbackId는 정수여야 합니다.')
    .positive('feedbackId는 양수여야 합니다.'),
});

// 쿼리스트링 검증 (커서 페이지네이션)
// optional이라 미전달 시 서비스의 기본값이 적용됨
export const feedbackQuerySchema = z.object({
  cursor: z.coerce.number().int().positive().optional(),
  take: z.coerce.number().int().positive().max(50).optional(),
});

export const createFeedbackSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, '피드백 내용을 입력해주세요.')
    .max(1000, '피드백은 1000자 이내로 작성해주세요.'),
});

export const updateFeedbackSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, '피드백 내용을 입력해주세요.')
    .max(1000, '피드백은 1000자 이내로 작성해주세요.'),
});
