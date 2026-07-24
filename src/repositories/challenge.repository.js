import prisma from '../config/prisma.js';

/**
 * Challenge Repository의 공통 반환 필드입니다.
 *
 * 기존 목록 조회 Repository와 신청·수정 Repository를 이 파일로 통합했습니다.
 * 조회와 변경 함수가 같은 select 계약과 Prisma client 전달 규칙을 공유하므로
 * 병합 후 화면마다 반환 필드가 달라지거나 트랜잭션이 끊기는 문제를 막습니다.
 *
 * 목록, 상세, 생성, 수정이 서로 다른 필드명을 반환하면 프론트 타입과 응답
 * 처리가 화면마다 달라집니다. 그래서 Challenge 자체 필드는 이 select를
 * 재사용하고, 화면별로 필요한 relation만 조건부로 더합니다.
 *
 * Prisma의 select를 사용해 password 같은 User 민감 정보나 불필요한 relation이
 * 우연히 응답에 포함되지 않게 합니다.
 */
const challengeSelect = {
  id: true,
  title: true,
  field: true,
  docType: true,
  content: true,
  originalUrl: true,
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
 * 목록 view에 따라 필요한 relation만 추가합니다.
 *
 * @param {object} options
 * @param {number|undefined} options.participantUserId 내 참여/완료 목록의 사용자 ID
 * @returns {object} Prisma ChallengeSelect
 *
 * - participating/completed view: 현재 사용자의 ACTIVE 참여와 연결 작업물 포함
 * - public/applied/admin view: 관계 조회 없이 공통 Challenge 필드만 반환
 *
 * participantUserId를 로그인 사용자에게서만 전달하므로 다른 사용자의 참여
 * 기록을 query string으로 임의 조회할 수 없습니다.
 */
function buildListSelect({ participantUserId }) {
  return {
    ...challengeSelect,
    // 내 챌린지 화면의 "계속 도전하기/내 번역문 보기" 이동에 필요한 ID입니다.
    ...(participantUserId && {
      participations: {
        where: {
          userId: participantUserId,
          status: 'ACTIVE',
        },
        select: {
          id: true,
          status: true,
          submission: {
            select: {
              id: true,
              isTopSubmission: true,
              updatedAt: true,
            },
          },
        },
      },
    }),
  };
}

/**
 * 통합 목록과 같은 조건의 전체 개수를 함께 조회합니다.
 *
 * @param {object} options
 * @param {object} options.where Service가 완성한 view별 조건
 * @param {object|Array} options.orderBy 허용된 sort를 변환한 Prisma 정렬
 * @param {number} options.page 1부터 시작하는 페이지
 * @param {number} options.limit 페이지당 개수
 * @param {number|undefined} options.participantUserId 참여 relation 대상 사용자
 * @returns {Promise<{challenges: Array, total: number}>}
 *
 * findMany와 count에 반드시 같은 where를 사용해 검색/필터 결과 수와 실제 목록이
 * 어긋나지 않게 합니다. 두 read를 Prisma 배열 트랜잭션으로 묶어 한 요청의
 * 목록과 total을 같은 DB 작업 단위에서 가져옵니다.
 *
 * skip 계산은 `(page - 1) * limit`, take는 limit로 모든 view가 동일합니다.
 */
async function findMany({ where, orderBy, page, limit, participantUserId }) {
  const [challenges, total] = await prisma.$transaction([
    prisma.challenge.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: buildListSelect({ participantUserId }),
    }),
    prisma.challenge.count({ where }),
  ]);

  // pagination 계산은 HTTP 응답 구조를 아는 Service가 담당하고 Repository는 원본 값만 반환합니다.
  return { challenges, total };
}

/**
 * 챌린지 상세 화면에 필요한 관계를 한 번에 조회합니다.
 *
 * @param {number} id 챌린지 ID
 * @param {number} viewerId 현재 로그인 사용자 ID
 *
 * 조회 relation:
 * - participations: 현재 사용자의 ACTIVE 참여 한정
 * - submissions: 마감 처리에서 지정한 최다 추천 작업물 한정
 *
 * Service가 공개/신청자/관리자 권한을 최종 판단합니다. Repository는 DB 조회만
 * 담당하므로 여기서 ForbiddenError 같은 HTTP 의미의 오류를 만들지 않습니다.
 */
async function findDetailById(id, viewerId) {
  return prisma.challenge.findUnique({
    where: { id },
    select: {
      ...challengeSelect,
      participations: {
        // viewer 본인의 참여만 포함해 상세 버튼 상태와 작업물 이동에 사용합니다.
        where: {
          userId: viewerId,
          status: 'ACTIVE',
        },
        select: {
          id: true,
          status: true,
          submission: {
            select: {
              id: true,
              updatedAt: true,
            },
          },
        },
      },
      submissions: {
        // CLOSED가 아닐 때는 Service가 빈 배열로 바꾸며, CLOSED일 때만 화면에 노출합니다.
        where: {
          deletedAt: null,
          isTopSubmission: true,
        },
        select: {
          id: true,
          content: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              nickname: true,
              grade: true,
            },
          },
          _count: {
            select: {
              likes: true,
            },
          },
        },
        // 추천 수 동률인 작업물이 여러 개일 수 있으므로 결정적인 순서를 보장합니다.
        orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
      },
    },
  });
}

/**
 * 상태 전이·수정·삭제 전에 현재 Challenge 원본 상태를 확인합니다.
 *
 * Service가 status, deadline, currentParticipants, userId를 이용해 비즈니스
 * 규칙을 판단하므로 relation 없이 공통 필드만 조회합니다.
 */
async function findById(id) {
  return prisma.challenge.findUnique({
    where: { id },
    select: challengeSelect,
  });
}

/**
 * 검증과 서버 기본값 조합이 끝난 신규 신청을 저장합니다.
 * 반환 select를 공통 필드로 고정해 POST 응답도 다른 Challenge 응답과 맞춥니다.
 */
async function create(data) {
  return prisma.challenge.create({
    data,
    select: challengeSelect,
  });
}

/**
 * Challenge 정보를 수정합니다.
 *
 * `databaseClient = prisma` 기본값 덕분에 단독 수정에도 사용할 수 있고,
 * Service의 `$transaction` callback에서 transactionClient를 넘기면 알림 저장과
 * 같은 트랜잭션에 참여합니다. 이 인자를 받지 않고 항상 전역 prisma를 사용하면
 * 원본 변경과 알림 중 하나만 commit될 수 있습니다.
 */
async function update(id, data, databaseClient = prisma) {
  return databaseClient.challenge.update({
    where: { id },
    data,
    select: challengeSelect,
  });
}

/**
 * 신청자 취소 전용 hard delete입니다.
 *
 * 관리자 삭제는 상태와 사유 이력이 필요하므로 이 함수를 사용하지 않고 update로
 * soft delete합니다. Service가 본인 소유와 PENDING 상태를 확인한 뒤에만 호출합니다.
 */
async function remove(id) {
  return prisma.challenge.delete({
    where: { id },
    select: { id: true },
  });
}

export { findMany, findDetailById, findById, create, update, remove };
