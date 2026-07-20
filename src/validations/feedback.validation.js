import { z } from 'zod';

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