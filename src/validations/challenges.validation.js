import { z } from 'zod';

// 챌린지 목록 조회(GET /challenges) 쿼리스트링 검증
export const getChallengesQuerySchema = z.object({
  // 현재 페이지 번호
  // 쿼리스트링은 문자열로 들어오기 때문에 숫자로 변환
  page: z.coerce.number().int().min(1).default(1),

  // 한 페이지당 개수
  // 최대 10으로 제한 (한 번에 너무 많이 못 가져가게)
  pageSize: z.coerce.number().int().min(1).max(10).default(5),

  // 제목 검색
  // 값이 없으면 검색 조건에서 제외
  search: z.string().trim().min(1).optional(),

  // 분야 필터 - 실제 Prisma Field enum 값 그대로 사용
  field: z
    .enum(['NEXTJS', 'REACT', 'MODERNJS', 'TYPESCRIPT', 'API', 'WEB', 'CAREER'])
    .optional(),

  // 문서타입 필터 - 실제 Prisma DocType enum 값 그대로 사용
  docType: z.enum(['OFFICIAL', 'BLOG', 'BOOK', 'ETC']).optional(),

  // 상태 필터
  // 공개 목록에서는 승인됨(APPROVED), 마감됨(CLOSED)만 조회 가능
  // 승인대기(PENDING), 거절(REJECTED), 삭제(DELETED)는 조회 대상에서 제외
  status: z.enum(['APPROVED', 'CLOSED']).optional(),
});
