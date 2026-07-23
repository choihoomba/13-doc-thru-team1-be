import * as challengeQueryRepository from '../repositories/challenge-query.repository.js';
import { ForbiddenError } from '../utils/errors.js';

/**
 * 클라이언트가 전달한 sort 값을
 * Prisma에서 사용할 orderBy 조건으로 변환합니다.
 *
 * 정렬 대상 값이 같은 챌린지가 여러 개 있을 수 있으므로
 * 두 번째 정렬 기준으로 id를 사용합니다.
 *
 * 예를 들어 createdAt이 같은 데이터가 여러 개 있어도
 * id를 함께 정렬하면 페이지를 이동할 때 목록 순서가
 * 불규칙하게 바뀌는 것을 방지할 수 있습니다.
 */
const ORDER_BY_MAP = {
  /**
   * 최신 등록 순
   */
  latest: [{ createdAt: 'desc' }, { id: 'desc' }],

  /**
   * 오래된 등록 순
   */
  oldest: [{ createdAt: 'asc' }, { id: 'asc' }],

  /**
   * 마감일이 빠른 순
   */
  deadlineAsc: [{ deadline: 'asc' }, { id: 'desc' }],

  /**
   * 마감일이 늦은 순
   */
  deadlineDesc: [{ deadline: 'desc' }, { id: 'desc' }],
};

/**
 * 모든 view에서 공통으로 사용할 검색·필터 조건을 만듭니다.
 *
 * public, participating, completed, admin 목록 모두
 * 같은 검색어와 필터 규칙을 사용하도록 공통 함수로 분리합니다.
 *
 * 값이 전달된 조건만 Prisma where 객체에 추가합니다.
 *
 * @param {object} query
 * @param {string|undefined} query.search
 * @param {string|undefined} query.field
 * @param {string|undefined} query.docType
 *
 * @returns {object} Prisma 공통 where 조건
 */
function buildCommonWhere({ search, field, docType }) {
  return {
    /**
     * 제목 검색
     *
     * contains:
     * 제목에 검색어가 포함되어 있는지 확인합니다.
     *
     * mode: 'insensitive':
     * 영문 대소문자를 구분하지 않고 검색합니다.
     *
     * 예:
     * search=router
     * → "Express Router", "ROUTER 사용법" 모두 검색 가능
     */
    ...(search && {
      title: {
        contains: search,
        mode: 'insensitive',
      },
    }),

    /**
     * 분야 필터
     *
     * field가 전달된 경우에만 조건에 포함합니다.
     */
    ...(field && { field }),

    /**
     * 문서 유형 필터
     *
     * docType이 전달된 경우에만 조건에 포함합니다.
     */
    ...(docType && { docType }),
  };
}

/**
 * view에 따라 서로 다른 챌린지 조회 조건을 만듭니다.
 *
 * Repository가 화면별 비즈니스 규칙을 알 필요가 없도록
 * 모든 목록 조건은 Service에서 결정합니다.
 *
 * @param {object} options
 * @param {'public'|'participating'|'completed'|'admin'} options.view
 * @param {string|undefined} options.status
 * @param {number} options.userId
 * @param {object} options.commonWhere
 *
 * @returns {object} Prisma where 조건
 */
function buildViewWhere({ view, status, userId, commonWhere }) {
  /**
   * 참여 중·완료 여부를 판단하기 위한 현재 시각입니다.
   *
   * 요청을 처리하는 시점에 한 번만 생성하여
   * 같은 요청 안에서 동일한 현재 시각을 사용합니다.
   */
  const now = new Date();

  switch (view) {
    /**
     * 내가 참여 중인 챌린지 목록
     *
     * 다음 조건을 모두 만족해야 합니다.
     *
     * 1. 챌린지 상태가 APPROVED
     * 2. 마감일이 아직 지나지 않음
     * 3. 삭제되지 않은 챌린지
     * 4. 로그인 사용자의 ACTIVE 참여 기록이 존재함
     */
    case 'participating':
      return {
        ...commonWhere,

        status: 'APPROVED',

        /**
         * gt는 greater than의 의미입니다.
         *
         * deadline > now
         * 즉, 마감일이 현재 시각보다 이후인 챌린지만 조회합니다.
         */
        deadline: {
          gt: now,
        },

        /**
         * soft delete된 챌린지는 목록에서 제외합니다.
         */
        deletedAt: null,

        /**
         * Challenge와 연결된 Participation 중에서
         * 현재 사용자의 ACTIVE 참여 기록이 하나 이상 있는지 확인합니다.
         *
         * some은 조건을 만족하는 관계 데이터가
         * 하나 이상 존재해야 한다는 의미입니다.
         */
        participations: {
          some: {
            userId,
            status: 'ACTIVE',
          },
        },
      };

    /**
     * 내가 완료한 챌린지 목록
     *
     * 다음 조건을 만족해야 합니다.
     *
     * 1. 로그인 사용자의 ACTIVE 참여 기록이 존재함
     * 2. 삭제되지 않은 챌린지
     * 3. 챌린지 상태가 CLOSED이거나 마감일이 지남
     *
     * DB 상태가 아직 APPROVED이더라도 마감일이 지났다면
     * 완료 목록에서 조회할 수 있도록 OR 조건을 사용합니다.
     */
    case 'completed':
      return {
        ...commonWhere,

        deletedAt: null,

        /**
         * 다음 두 조건 중 하나만 만족하면 됩니다.
         *
         * - status가 CLOSED
         * - deadline이 현재 시각 이하
         *
         * lte는 less than or equal의 의미입니다.
         */
        OR: [
          {
            status: 'CLOSED',
          },
          {
            deadline: {
              lte: now,
            },
          },
        ],

        participations: {
          some: {
            userId,
            status: 'ACTIVE',
          },
        },
      };

    /**
     * 관리자 챌린지 신청 관리 목록
     *
     * status가 전달되지 않으면 PENDING을 기본값으로 사용합니다.
     * 따라서 다음 요청은 승인 대기 목록을 조회합니다.
     *
     * GET /challenges?view=admin
     *
     * 특정 상태를 전달하면 해당 상태의 신청 목록을 조회합니다.
     *
     * GET /challenges?view=admin&status=REJECTED
     */
    case 'admin':
      return {
        ...commonWhere,
        // status 필터가 지정된 경우에만 조건에 포함 (미지정 시 모든 상태 조회)
        ...(status && { status }),
      };

    /**
     * 전체 공개 챌린지 목록
     *
     * Validation에서 view 기본값이 public이므로
     * GET /challenges 요청도 이 조건을 사용합니다.
     *
     * status가 없으면 APPROVED와 CLOSED를 모두 조회합니다.
     * status가 있으면 Validation을 통과한
     * APPROVED 또는 CLOSED 중 하나를 조회합니다.
     */
    case 'public':
    default:
      return {
        ...commonWhere,

        status: status ?? {
          in: ['APPROVED', 'CLOSED'],
        },

        /**
         * 공개 목록에는 삭제된 챌린지를 노출하지 않습니다.
         */
        deletedAt: null,
      };
  }
}

/**
 * 챌린지 목록 조회 Service
 *
 * 다음 네 가지 목록을 공통으로 처리합니다.
 *
 * - public
 * - participating
 * - completed
 * - admin
 *
 * @param {object} options
 * @param {number} options.userId
 *   현재 로그인한 사용자의 ID입니다.
 *
 * @param {'USER'|'ADMIN'} options.userRole
 *   현재 로그인한 사용자의 역할입니다.
 *
 * @param {object} options.query
 *   challengeListQuerySchema 검증을 통과한 쿼리입니다.
 *
 * @returns {Promise<object>}
 *   challenges와 pagination을 포함한 목록 결과를 반환합니다.
 */
async function getChallenges({ userId, userRole, query }) {
  /**
   * 관리자 신청 관리 목록 권한 검사
   *
   * public, participating, completed는 로그인한 USER와 ADMIN이
   * 모두 조회할 수 있습니다.
   *
   * admin 목록은 ADMIN만 조회할 수 있습니다.
   *
   * 일반 사용자와 전문가 등급은 모두 role이 USER이므로
   * 관리자 목록을 조회하면 403 FORBIDDEN 에러가 발생합니다.
   */
  if (query.view === 'admin' && userRole !== 'ADMIN') {
    throw new ForbiddenError(
      '관리자 챌린지 신청 목록은 관리자만 조회할 수 있습니다.'
    );
  }

  /**
   * 제목 검색, 분야, 문서 유형에 대한 공통 조건을 만듭니다.
   */
  const commonWhere = buildCommonWhere({
    search: query.search,
    field: query.field,
    docType: query.docType,
  });

  /**
   * view에 맞는 상태, 마감일, 참여 기록 조건을 추가합니다.
   */
  const where = buildViewWhere({
    view: query.view,
    status: query.status,
    userId,
    commonWhere,
  });

  /**
   * Validation을 통과한 sort 값을
   * Prisma orderBy 조건으로 변환합니다.
   *
   * sort의 기본값은 latest이므로
   * orderBy가 undefined가 되는 경우는 없습니다.
   */
  const orderBy = ORDER_BY_MAP[query.sort];

  /**
   * 참여 중·완료 목록에서만 로그인 사용자의
   * Participation과 Submission 정보를 조회합니다.
   *
   * public과 admin 목록에는 필요하지 않으므로 undefined를 전달합니다.
   */
  const participantUserId = ['participating', 'completed'].includes(query.view)
    ? userId
    : undefined;

  /**
   * Repository에 최종 조회 조건을 전달합니다.
   *
   * Repository는 view를 직접 판단하지 않고 다음 작업만 담당합니다.
   *
   * - Challenge 목록 조회
   * - 동일 조건의 전체 개수 조회
   * - 관리자 신청자 정보 추가
   * - 참여·완료 목록의 Participation/Submission 정보 추가
   */
  const { challenges, total } = await challengeQueryRepository.findMany({
    where,
    orderBy,
    page: query.page,
    limit: query.limit,
    participantUserId,
  });

  /**
   * 모든 view가 동일한 목록 응답 구조를 사용합니다.
   *
   * totalPages는 전체 데이터 개수를 한 페이지 크기로 나눈 뒤
   * Math.ceil()로 올림하여 계산합니다.
   *
   * 예:
   * total=21, limit=10
   * → totalPages=3
   */
  return {
    challenges,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export { getChallenges };
