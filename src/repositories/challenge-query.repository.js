import prisma from '../config/prisma.js';

/**
 * 모든 챌린지 목록에서 공통으로 조회할 필드입니다.
 *
 * 공개 목록, 참여 중 목록, 완료 목록, 관리자 목록이
 * 서로 다른 필드 구조를 반환하지 않도록 공통 select를 사용합니다.
 *
 * DateTime 값은 Prisma가 Date 객체로 반환하며,
 * Controller에서 res.json()을 호출하면 ISO 문자열로 변환됩니다.
 *
 * field, docType, status도 별도의 한글 변환 없이
 * Prisma enum 원본 값을 그대로 반환합니다.
 */
const challengeSelect = {
  id: true,
  title: true,
  field: true,
  docType: true,
  deadline: true,
  maxParticipants: true,
  currentParticipants: true,
  status: true,
  reason: true,
  deletedAt: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
};

/**
 * view에 따라 목록 조회에 추가할 관계 데이터를 구성합니다.
 *
 * 기본 챌린지 필드는 모든 목록에서 동일하게 조회하고,
 * 관리자 또는 나의 챌린지 목록에 필요한 관계 데이터만
 * 조건에 따라 추가합니다.
 *
 * @param {object} options
 * @param {boolean} options.includeApplicant
 *   관리자 신청 관리 목록인지 나타냅니다.
 *   true이면 챌린지를 신청한 사용자의 정보를 함께 조회합니다.
 *
 * @param {number|undefined} options.participantUserId
 *   참여 중 또는 완료 목록을 조회하는 로그인 사용자의 ID입니다.
 *   값이 있으면 해당 사용자의 참여 기록과 작업물 정보를 함께 조회합니다.
 *
 * @returns {object} Prisma select 객체
 */
function buildListSelect({ includeApplicant, participantUserId }) {
  return {
    /**
     * 모든 view에서 공통으로 반환할 Challenge 필드입니다.
     */
    ...challengeSelect,

    /**
     * 관리자 신청 관리 목록에서만 신청자 정보를 추가합니다.
     *
     * Service에서 view=admin인 경우
     * includeApplicant=true를 전달합니다.
     *
     * 비밀번호, refreshToken 등 목록에 필요하지 않은 개인정보는
     * 조회하지 않고 id, nickname, email만 조회합니다.
     */
    ...(includeApplicant && {
      user: {
        select: {
          id: true,
          nickname: true,
          email: true,
        },
      },
    }),

    /**
     * 참여 중 또는 완료 목록에서만
     * 현재 로그인 사용자의 참여 기록을 추가합니다.
     *
     * participantUserId가 전달된 경우에만 포함됩니다.
     *
     * ACTIVE 참여 기록만 조회하므로 다음 참여 기록은 제외됩니다.
     *
     * - DROPPED: 사용자가 포기한 참여 기록
     * - REMOVED: 관리자에 의해 제거된 참여 기록
     */
    ...(participantUserId && {
      participations: {
        where: {
          userId: participantUserId,
          status: 'ACTIVE',
        },
        select: {
          /**
           * 참여 기록 ID와 현재 상태를 반환합니다.
           */
          id: true,
          status: true,

          /**
           * Participation과 연결된 작업물 정보입니다.
           *
           * 프론트는 submission.id를 이용하여
           * 참여 중인 번역문 수정 화면이나
           * 완료한 번역문 조회 화면으로 이동할 수 있습니다.
           */
          submission: {
            select: {
              id: true,
              isTopSubmission: true,
              createdAt: true,
            },
          },
        },
      },
    }),
  };
}

/**
 * 챌린지 목록과 전체 개수를 조회합니다.
 *
 * 이 함수는 public, participating, completed, admin 목록에서
 * 공통으로 사용됩니다.
 *
 * Repository는 어떤 view인지 직접 판단하지 않습니다.
 * Service가 view에 맞게 만든 where, orderBy 등의 조건을
 * Repository에 전달합니다.
 *
 * @param {object} options
 * @param {object} options.where
 *   Service에서 생성한 Prisma 조회 조건입니다.
 *
 * @param {object|object[]} options.orderBy
 *   Service에서 생성한 Prisma 정렬 조건입니다.
 *
 * @param {number} options.page
 *   현재 페이지 번호입니다.
 *
 * @param {number} options.limit
 *   한 페이지에 조회할 챌린지 개수입니다.
 *
 * @param {boolean} [options.includeApplicant=false]
 *   관리자 목록에서 신청자 정보를 포함할지 나타냅니다.
 *
 * @param {number|undefined} options.participantUserId
 *   참여 중·완료 목록에서 참여 및 작업물 정보를 조회할 사용자 ID입니다.
 *
 * @returns {Promise<{challenges: Array, total: number}>}
 *   challenges: 조회한 챌린지 목록
 *   total: 검색 및 필터 조건에 맞는 전체 개수
 */
async function findMany({
  where,
  orderBy,
  page,
  limit,
  includeApplicant = false,
  participantUserId,
}) {
  /**
   * 현재 페이지의 시작 위치를 계산합니다.
   *
   * 예시:
   *
   * page=1, limit=10
   * → skip=0
   *
   * page=2, limit=10
   * → skip=10
   *
   * page=3, limit=10
   * → skip=20
   */
  const skip = (page - 1) * limit;

  /**
   * 목록과 전체 개수를 하나의 트랜잭션에서 조회합니다.
   *
   * 첫 번째 쿼리:
   * 현재 페이지에 표시할 챌린지 목록 조회
   *
   * 두 번째 쿼리:
   * 동일한 검색·필터 조건에 해당하는 전체 개수 조회
   *
   * 두 쿼리에 같은 where를 사용해야 pagination의 total과
   * 실제 목록 조건이 서로 달라지지 않습니다.
   */
  const [challenges, total] = await prisma.$transaction([
    prisma.challenge.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: buildListSelect({
        includeApplicant,
        participantUserId,
      }),
    }),

    prisma.challenge.count({
      where,
    }),
  ]);

  /**
   * Service에서 공통 pagination 응답을 만들 수 있도록
   * 목록과 전체 개수를 반환합니다.
   */
  return {
    challenges,
    total,
  };
}

export { findMany };
