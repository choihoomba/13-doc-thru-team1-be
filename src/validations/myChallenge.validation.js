// validations/myChallenge.validation.js
import { z } from 'zod';

// GET /challenges?type=me 전용 검증 스키마
export const getMyChallengesQuerySchema = z.object({
  // 'me' 고정값 - 이 값으로 "나의 챌린지" 요청임을 확정
  type: z.literal('me'),

  // 참여중(ACTIVE) / 완료(CLOSED) 탭 구분
  // 주의: Prisma ChallengeStatus enum엔 ACTIVE가 없음. 이 화면 전용 별칭
  // Service에서 실제 값(APPROVED/CLOSED)으로 변환함
  status: z.enum(['ACTIVE', 'CLOSED']),

  // 제목 검색어 (요구사항: 검색(제목))
  search: z.string().trim().min(1).optional(),

  // 분야 필터 (요구사항: 필터링(분야, 문서타입))
  field: z
    .enum(['NEXTJS', 'REACT', 'MODERNJS', 'TYPESCRIPT', 'API', 'WEB', 'CAREER'])
    .optional(),

  // 문서타입 필터
  docType: z.enum(['OFFICIAL', 'BLOG', 'BOOK', 'ETC']).optional(),

  // 무한 스크롤 커서 - 이전 응답의 nextCursor를 그대로 다시 보내는 값
  cursor: z.coerce.number().int().positive().optional(),

  // 한 번에 몇 개씩 가져올지
  limit: z.coerce.number().int().min(1).max(20).default(10),
});
