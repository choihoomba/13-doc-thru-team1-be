import { z } from 'zod';

/**
 * Prisma enum과 API에서 허용하는 문자열을 한 곳에서 관리합니다.
 *
 * 기존 조회 query Validation과 신청·수정 body Validation을 이 파일로 합쳐
 * Challenge API의 enum, path parameter, query, body 계약을 한 곳에서 확인할 수
 * 있게 했습니다. 특히 PATCH union도 여기서 관리해 담당자별 Schema 충돌을
 * 방지합니다.
 *
 * 프론트가 화면 표시용 한글 값을 보내는 대신 아래 원본 enum 값을 보내도록
 * 통일합니다. 목록 필터, 생성, 수정이 같은 배열을 재사용하므로 화면마다 다른
 * 철자나 지원 범위를 갖는 문제를 막을 수 있습니다.
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
const DOC_TYPE_VALUES = ['OFFICIAL', 'BLOG', 'BOOK', 'ETC'];

/**
 * ChallengeStatus 전체 값입니다.
 *
 * 목록의 `status` 필터는 전체 값을 검증한 뒤, 아래 superRefine에서 view별로
 * 사용할 수 있는 상태를 한 번 더 제한합니다.
 */
const CHALLENGE_STATUS_VALUES = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'DELETED',
  'CLOSED',
];

/**
 * 하나의 GET /challenges를 화면별 목록으로 재사용하기 위한 view 값입니다.
 *
 * - public: 공개 챌린지 목록
 * - participating: 로그인 사용자가 참여 중인 목록
 * - completed: 로그인 사용자가 완료한 목록
 * - applied: 로그인 사용자가 어드민에게 신청한 목록
 * - admin: 관리자의 신청 관리 목록
 */
const VIEW_VALUES = [
  'public',
  'participating',
  'completed',
  'applied',
  'admin',
];

/**
 * URL마다 다른 정렬 query를 만들지 않고 sort 하나로 통일합니다.
 * 실제 Prisma orderBy 객체는 Service의 ORDER_BY_MAP에서 결정합니다.
 */
const SORT_VALUES = ['latest', 'oldest', 'deadlineAsc', 'deadlineDesc'];
const MIN_CHALLENGE_DEADLINE_DAYS = 7;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * 생성과 수정에서 공통으로 사용하는 미래 마감일 검증입니다.
 *
 * HTML date/datetime input은 문자열을 전송하므로 z.coerce.date()로 Date 객체로
 * 변환합니다. 과거 마감일은 진행 중 챌린지 수정에서도 허용하지 않습니다.
 * 승인 시점에도 시간이 지났을 수 있으므로 Service가 다시 검사합니다.
 */
const deadlineSchema = z.coerce
  .date('deadline은 올바른 날짜 형식이어야 합니다.')
  .refine((deadline) => deadline > new Date(), {
    message: '마감일은 현재 시간보다 이후여야 합니다.',
  });

/**
 * 신규 신청은 신청 시점으로부터 최소 7일 뒤를 마감일로 선택해야 합니다.
 *
 * 프론트 date input의 min 속성은 직접 API 요청으로 우회할 수 있으므로 서버에서도
 * 같은 규칙을 검증합니다. 관리자 수정은 이미 진행 중인 챌린지의 일정 조정이므로
 * 이 7일 제한을 재적용하지 않고 위 deadlineSchema의 미래 날짜 조건만 사용합니다.
 */
const createDeadlineSchema = deadlineSchema.refine(
  (deadline) =>
    deadline.getTime() >=
    Date.now() + MIN_CHALLENGE_DEADLINE_DAYS * MILLISECONDS_PER_DAY,
  {
    message: `신규 챌린지 마감일은 신청일 기준 최소 ${MIN_CHALLENGE_DEADLINE_DAYS}일 이후여야 합니다.`,
  }
);

/**
 * 신규 신청과 정보 수정이 공유하는 Challenge 입력 필드입니다.
 *
 * 서버가 결정하는 값은 의도적으로 포함하지 않습니다.
 * - userId: authenticate의 로그인 사용자
 * - status: 신규 신청은 PENDING
 * - currentParticipants: 신규 신청은 0
 * - reason/deletedAt: 관리자 처리에서만 설정
 */
const challengeFieldsSchema = z.object({
  title: z
    .string('title은 필수 값입니다.')
    .trim()
    .min(1, '제목을 입력해주세요.')
    .max(100, '제목은 100자 이하이어야 합니다.'),
  field: z
    .union([z.enum(FIELD_VALUES), z.array(z.enum(FIELD_VALUES))])
    .optional()
    .transform((value) => (value === undefined ? undefined : [].concat(value))),
  docType: z.enum(DOC_TYPE_VALUES, {
    message: '지원하지 않는 문서 유형입니다.',
  }),
  content: z
    .string('content는 필수 값입니다.')
    .trim()
    .min(1, '챌린지 내용을 입력해주세요.')
    .max(5000, '챌린지 내용은 5000자 이하이어야 합니다.'),
  originalUrl: z
    .string('originalUrl은 필수 값입니다.')
    .trim()
    .max(2048, '원문 URL은 2048자 이하이어야 합니다.')
    .url('올바른 원문 URL을 입력해주세요.'),
  deadline: deadlineSchema,
  maxParticipants: z.coerce
    .number('maxParticipants는 숫자여야 합니다.')
    .int('최대 참여 인원은 정수여야 합니다.')
    .positive('최대 참여 인원은 1명 이상이어야 합니다.'),
});

/**
 * POST /challenges
 *
 * strict()를 사용하여 status, userId 같은 서버 관리 필드를 클라이언트가
 * 추가로 보내는 것을 거부합니다.
 */
const createChallengeSchema = challengeFieldsSchema
  .extend({
    deadline: createDeadlineSchema,
  })
  .strict();

/**
 * PATCH /challenges/:id - 관리자 정보 수정 body
 *
 * 공통 챌린지 필드는 partial()이라 필요한 값만 수정할 수 있지만, 변경 사유는
 * 신청자 알림에 포함되어야 하므로 항상 필수입니다. reason만 보내고 실제로
 * 아무 필드도 수정하지 않는 요청은 refine으로 차단합니다.
 */
const updateChallengeSchema = challengeFieldsSchema
  .partial()
  .extend({
    reason: z
      .string('reason은 필수 값입니다.')
      .trim()
      .min(1, '수정 사유를 입력해주세요.')
      .max(100, '수정 사유는 100자 이하이어야 합니다.'),
  })
  .strict()
  .refine((data) => Object.keys(data).some((key) => key !== 'reason'), {
    message: '수정할 챌린지 정보를 한 개 이상 입력해주세요.',
  });

/**
 * PATCH /challenges/:id - 관리자 승인/거절 body
 *
 * 프로젝트 상태 전이상 PENDING에서 가능한 외부 입력은 APPROVED와 REJECTED뿐입니다.
 * CLOSED/DELETED는 각각 마감 동기화와 삭제 Service가 결정합니다.
 * 승인에는 사유가 없어도 되지만 거절 모달의 사유는 반드시 입력해야 합니다.
 */
const updateChallengeStatusSchema = z
  .object({
    status: z.enum(['APPROVED', 'REJECTED']),
    reason: z
      .string()
      .trim()
      .min(1, '사유를 입력해주세요.')
      .max(100, '사유는 100자 이하이어야 합니다.')
      .optional(),
  })
  .strict()
  .refine(({ status, reason }) => status !== 'REJECTED' || Boolean(reason), {
    path: ['reason'],
    message: '챌린지를 거절할 때는 사유를 입력해야 합니다.',
  });

/**
 * PATCH /challenges/:id - 신청자 취소 body
 *
 * DELETE는 어드민의 진행 중 챌린지 삭제에 이미 사용되므로, 기존 PATCH 명세에서
 * `action=CANCEL`이라는 명시적 식별자를 사용해 신청 취소와 구분합니다.
 */
const cancelChallengeSchema = z
  .object({
    action: z.literal('CANCEL'),
  })
  .strict();

/**
 * PATCH /challenges/:id 단일 Handler의 body union입니다.
 *
 * 세 Schema가 모두 strict라서 서로 다른 기능의 필드를 섞은 요청은 어느
 * Schema에도 맞지 않아 400으로 처리됩니다. 이 구조가 동일 method/path의
 * Handler 충돌을 막으면서도 기존 API 엔드포인트를 변경하지 않는 핵심입니다.
 */
const patchChallengeSchema = z.union([
  updateChallengeStatusSchema,
  cancelChallengeSchema,
  updateChallengeSchema,
]);

/**
 * DELETE /challenges/:id
 *
 * 어드민 삭제 모달에서 받은 사유를 필수로 검증합니다. Service는 이 값을
 * Challenge.reason과 신청자 알림 메시지에 함께 사용합니다.
 */
const deleteChallengeSchema = z
  .object({
    reason: z
      .string('reason은 필수 값입니다.')
      .trim()
      .min(1, '삭제 사유를 입력해주세요.')
      .max(100, '삭제 사유는 100자 이하이어야 합니다.'),
  })
  .strict();

/**
 * GET/PATCH/DELETE /challenges/:id 공통 path parameter입니다.
 * Express의 문자열 값을 양의 정수로 변환해 Repository에는 검증된 ID만 전달합니다.
 */
const challengeIdParamsSchema = z.object({
  id: z.coerce
    .number('챌린지 ID는 숫자여야 합니다.')
    .int('챌린지 ID는 정수여야 합니다.')
    .positive('챌린지 ID는 1 이상이어야 합니다.'),
});

/**
 * GET /challenges의 통합 query contract입니다.
 *
 * query 이름을 화면마다 새로 만들지 않고 다음 이름으로 통일했습니다.
 * - view: 어떤 화면의 목록인지 결정
 * - search: 제목 부분 검색
 * - field/docType/status: enum 필터
 * - sort: 정렬 기준
 * - page/limit: 페이지네이션 및 무한 스크롤
 *
 * query string은 모두 문자열로 전달되므로 page/limit은 숫자로 coerce합니다.
 */
const challengeListQuerySchema = z
  .object({
    // 생략하면 일반 챌린지 보기 화면과 동일한 public 목록입니다.
    view: z.enum(VIEW_VALUES).default('public'),
    // 빈 문자열은 Service의 조건 조합에서 falsy로 취급되어 검색 조건을 만들지 않습니다.
    search: z.string().trim().max(100).optional(),
    field: z.enum(FIELD_VALUES).optional(),
    docType: z.enum(DOC_TYPE_VALUES).optional(),
    status: z.enum(CHALLENGE_STATUS_VALUES).optional(),
    // 생략하면 최신 신청/등록 순으로 정렬합니다.
    sort: z.enum(SORT_VALUES).default('latest'),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
  })
  .superRefine(({ view, status }, context) => {
    /**
     * 공개 목록에서 PENDING/REJECTED/DELETED가 노출되는 것을 Validation 단계에서
     * 차단합니다. Service의 where 조건도 공개 상태를 제한하여 이중으로 보호합니다.
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
     * participating과 completed는 view 자체가 각각 APPROVED/CLOSED 상태 조건을
     * 의미합니다. 서로 모순되는 status query가 함께 들어오지 않도록 거부합니다.
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
  challengeIdParamsSchema,
  challengeListQuerySchema,
  createChallengeSchema,
  patchChallengeSchema,
  deleteChallengeSchema,
};
