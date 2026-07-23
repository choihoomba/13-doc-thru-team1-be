import { z } from 'zod';

/**
 * 챌린지 분야
 *
 * Prisma의 Field enum과 동일한 값을 사용합니다.
 * 화면에 표시할 한글 이름 변환은 프론트엔드에서 처리합니다.
 */
const FIELD_VALUES = [
  'NEXTJS',
  'REACT',
  'MODERNJS',
  'TYPESCRIPT',
  'API',
  'WEB',
  'CAREER',
];

/**
 * 번역할 문서 유형
 *
 * Prisma의 DocType enum과 동일한 값을 사용합니다.
 */
const DOC_TYPE_VALUES = ['OFFICIAL', 'BLOG', 'BOOK', 'ETC'];

/**
 * 챌린지 상태
 *
 * public과 admin 화면에서 status 필터로 사용할 수 있습니다.
 * participating과 completed는 Service가 상태 조건을 직접 결정하므로
 * status 쿼리를 함께 받을 수 없습니다.
 */
const CHALLENGE_STATUS_VALUES = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'DELETED',
  'CLOSED',
];

/**
 * 이번 담당 범위에 포함되는 목록 화면
 *
 * public:
 *   전체 공개 챌린지 목록
 *
 * participating:
 *   로그인 사용자가 현재 참여 중인 챌린지 목록
 *
 * completed:
 *   로그인 사용자가 참여했던 완료 챌린지 목록
 *
 * admin:
 *   관리자의 신규 챌린지 신청 관리 목록
 *
 * 내가 신청한 챌린지 목록인 applied는
 * 다른 담당자가 처리
 */
const VIEW_VALUES = ['public', 'participating', 'completed', 'admin'];

/**
 * 목록 정렬 방법
 *
 * latest:
 *   최신 신청·생성 순
 *
 * oldest:
 *   오래된 신청·생성 순
 *
 * deadlineAsc:
 *   마감일이 빠른 순
 *
 * deadlineDesc:
 *   마감일이 늦은 순
 */
const SORT_VALUES = ['latest', 'oldest', 'deadlineAsc', 'deadlineDesc'];

/**
 * GET /challenges 목록 조회 Query Validation
 *
 * 사용 예시:
 *
 * GET /challenges?view=public
 * GET /challenges?view=public&search=router
 * GET /challenges?view=participating&field=WEB
 * GET /challenges?view=completed&page=2&limit=10
 * GET /challenges?view=admin&status=PENDING&sort=oldest
 */
const challengeListQuerySchema = z
  .object({
    /**
     * 조회할 목록 화면입니다.
     *
     * view를 전달하지 않으면 public으로 처리하여
     * GET /challenges 요청도 공개 목록으로 동작하게 합니다.
     */
    view: z.enum(VIEW_VALUES).default('public'),

    /**
     * 챌린지 제목 검색어입니다.
     *
     * trim()을 사용하여 검색어 앞뒤의 공백을 제거합니다.
     * DB 조회 시 Service/Repository에서 title contains 조건으로 사용합니다.
     */
    search: z
      .string()
      .trim()
      .max(100, '검색어는 100자 이하이어야 합니다.')
      .optional(),

    /**
     * 챌린지 분야 필터입니다.
     *
     * Prisma Field enum에 존재하는 값만 허용합니다.
     */
    field: z
      .enum(FIELD_VALUES, {
        message: '지원하지 않는 챌린지 분야입니다.',
      })
      .optional(),

    /**
     * 번역할 문서 유형 필터입니다.
     *
     * Prisma DocType enum에 존재하는 값만 허용합니다.
     */
    docType: z
      .enum(DOC_TYPE_VALUES, {
        message: '지원하지 않는 문서 유형입니다.',
      })
      .optional(),

    /**
     * 챌린지 상태 필터입니다.
     *
     * public:
     *   APPROVED 또는 CLOSED만 사용할 수 있습니다.
     *
     * admin:
     *   PENDING, APPROVED, REJECTED, DELETED, CLOSED를
     *   사용할 수 있습니다.
     *
     * participating/completed:
     *   Service가 상태와 마감 조건을 직접 결정하므로
     *   status를 함께 전달할 수 없습니다.
     */
    status: z
      .enum(CHALLENGE_STATUS_VALUES, {
        message: '지원하지 않는 챌린지 상태입니다.',
      })
      .optional(),

    /**
     * 목록 정렬 방법입니다.
     *
     * sort를 전달하지 않으면 최신순으로 조회합니다.
     */
    sort: z.enum(SORT_VALUES).default('latest'),

    /**
     * 현재 페이지 번호입니다.
     *
     * 쿼리스트링은 문자열로 들어오므로 coerce를 사용해
     * 숫자로 변환합니다.
     *
     * 예:
     * "2" → 2
     */
    page: z.coerce
      .number('page는 숫자여야 합니다.')
      .int('page는 정수여야 합니다.')
      .positive('page는 1 이상이어야 합니다.')
      .default(1),

    /**
     * 한 페이지에 조회할 챌린지 개수입니다.
     *
     * 최소 1개, 최대 100개까지 조회할 수 있으며
     * 전달하지 않으면 10개를 조회합니다.
     */
    limit: z.coerce
      .number('limit은 숫자여야 합니다.')
      .int('limit은 정수여야 합니다.')
      .positive('limit은 1 이상이어야 합니다.')
      .max(100, 'limit은 100 이하이어야 합니다.')
      .default(10),
  })
  .superRefine(({ view, status }, context) => {
    /**
     * 공개 목록에는 사용자에게 노출할 수 있는
     * APPROVED와 CLOSED 상태만 허용합니다.
     *
     * PENDING, REJECTED, DELETED 상태가 공개 목록에
     * 노출되는 것을 요청 검증 단계에서 차단합니다.
     */
    if (
      view === 'public' &&
      status &&
      !['APPROVED', 'CLOSED'].includes(status)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['status'],
        message:
          '공개 목록의 status는 APPROVED 또는 CLOSED만 사용할 수 있습니다.',
      });
    }

    /**
     * 참여 중 목록과 완료 목록은 status 쿼리를 받지 않습니다.
     *
     * participating 조회 조건:
     * - 로그인 사용자의 ACTIVE 참여
     * - Challenge 상태가 APPROVED
     * - 마감일이 지나지 않음
     *
     * completed 조회 조건:
     * - 로그인 사용자의 ACTIVE 참여
     * - Challenge 상태가 CLOSED이거나 마감일이 지남
     *
     * 이 조건들은 Service가 결정하므로 클라이언트가 별도의
     * status를 보내면 조건이 서로 충돌할 수 있습니다.
     */
    if (['participating', 'completed'].includes(view) && status) {
      context.addIssue({
        code: 'custom',
        path: ['status'],
        message: '참여 중/완료 목록에서는 status를 함께 사용할 수 없습니다.',
      });
    }
  });

export {
  FIELD_VALUES,
  DOC_TYPE_VALUES,
  CHALLENGE_STATUS_VALUES,
  VIEW_VALUES,
  SORT_VALUES,
  challengeListQuerySchema,
};
