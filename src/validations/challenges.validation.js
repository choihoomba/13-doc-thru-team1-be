import { z } from 'zod';
import { Field, DocType, ChallengeStatus } from '@prisma/client';

/** 공통: 챌린지 id URL 파라미터 */
export const challengeIdParamSchema = z.object({
  id: z.coerce
    .number()
    .int('id는 정수여야 합니다')
    .positive('id는 1 이상이어야 합니다'),
});

/** 공개: 챌린지 목록 조회 쿼리 (승인된 챌린지만 노출) */
export const challengeListQuerySchema = z.object({
  field: z.enum(Field).optional(),
  docType: z.enum(DocType).optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

/** 공개: 챌린지 신청(생성) — 생성 즉시 승인 대기(PENDING) 상태 */
export const createChallengeSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, '제목을 입력해주세요.')
    .max(200, '제목은 200자 이내여야 합니다.'),
  field: z.enum(Field, { error: '유효하지 않은 분야입니다.' }),
  docType: z.enum(DocType, { error: '유효하지 않은 문서 타입입니다.' }),
  content: z.string().trim().min(1, '내용을 입력해주세요.'),
  originalUrl: z.url('올바른 URL 형식이 아닙니다.'),
  deadline: z.coerce
    .date({ error: '마감일은 날짜 형식이어야 합니다.' })
    .refine(
      (d) => d.getTime() > Date.now(),
      '마감일은 현재 시각 이후여야 합니다.'
    ),
  maxParticipants: z.coerce
    .number()
    .int('maxParticipants는 정수여야 합니다.')
    .positive('maxParticipants는 1 이상이어야 합니다.'),
});

/** 유저: 내가 신청한 챌린지 목록 조회 쿼리 */
export const myChallengesQuerySchema = z.object({
  status: z.enum(ChallengeStatus).optional(),
  sort: z
    .enum(['appliedAt_asc', 'appliedAt_desc', 'deadline_asc', 'deadline_desc'])
    .optional(),
  search: z.string().trim().max(100).optional(),
});

/** 어드민: 챌린지 목록 조회 쿼리 (검색/필터/페이지네이션) */
export const adminChallengesQuerySchema = z.object({
  status: z.enum(ChallengeStatus).optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

/** 어드민: 챌린지 상태 변경 (승인/거절) — 거절 시 사유 필수 */
export const updateChallengeStatusSchema = z
  .object({
    status: z.enum(['APPROVED', 'REJECTED']),
    reason: z.string().trim().min(1, '사유를 입력해주세요.').optional(),
  })
  .refine((data) => data.status === 'APPROVED' || !!data.reason, {
    message: '거절 시 사유(reason)를 입력해야 합니다.',
    path: ['reason'],
  });

/** 어드민: 챌린지 삭제(Soft Delete) 사유 — 항상 필수 */
export const deleteChallengeSchema = z.object({
  reason: z.string().trim().min(1, '삭제 사유를 입력해주세요.'),
});
