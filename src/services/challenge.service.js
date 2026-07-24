import prisma from '../config/prisma.js';
import * as challengeRepository from '../repositories/challenge.repository.js';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../utils/errors.js';
import { isChallengeClosed } from '../utils/challenge.js';
import { createNotification } from './notification.service.js';

/**
 * Challenge Service는 화면 요구사항을 실제 비즈니스 규칙으로 바꾸는 레이어입니다.
 *
 * Controller는 검증된 값만 전달하고 Repository는 Prisma 실행만 담당합니다.
 * 따라서 다음 판단은 모두 이 파일에서 수행합니다.
 * - view별 공개 상태, 사용자 관계, 마감 조건
 * - 관리자 역할과 신청자 소유권
 * - PENDING → APPROVED/REJECTED 상태 전이
 * - 진행 중 챌린지의 수정/삭제 가능 여부
 * - 현재 참여 인원보다 작은 정원으로 변경 방지
 * - 데이터 변경과 알림 생성의 원자적 트랜잭션
 *
 * 목록·상세·신청·관리 기능을 한 Service로 통합했기 때문에 여러 담당자가 만든
 * 규칙이 서로 다른 파일에서 중복되거나 엇갈리지 않습니다.
 */

/**
 * 공개 query 값과 Prisma orderBy의 매핑입니다.
 *
 * 클라이언트가 Prisma 객체를 직접 만들 수 없도록 허용된 문자열만 Validation에서
 * 받고 여기에서 안전한 객체로 변환합니다. 모든 정렬에 id를 두 번째 기준으로
 * 넣어 createdAt/deadline이 같은 레코드도 페이지 사이에서 순서가 흔들리지 않게
 * 합니다.
 */
const ORDER_BY_MAP = {
  latest: [{ createdAt: 'desc' }, { id: 'desc' }],
  oldest: [{ createdAt: 'asc' }, { id: 'asc' }],
  deadlineAsc: [{ deadline: 'asc' }, { id: 'desc' }],
  deadlineDesc: [{ deadline: 'desc' }, { id: 'desc' }],
};

/**
 * 모든 view가 공통으로 사용하는 제목·분야·문서유형 조건을 만듭니다.
 *
 * @param {object} query 검증된 목록 query
 * @returns {object} Prisma ChallengeWhereInput 일부
 *
 * 객체 spread를 사용해 값이 존재하는 조건만 추가합니다. 제목 검색은 영문
 * 대소문자를 구분하지 않으며, 필터 값은 Prisma enum 원본을 그대로 사용합니다.
 */
function buildCommonWhere({ search, field, docType }) {
  return {
    ...(search && {
      title: {
        contains: search,
        mode: 'insensitive',
      },
    }),
    ...(field && { field }),
    ...(docType && { docType }),
  };
}

/**
 * `view`를 실제 Prisma 관계/상태 조건으로 변환합니다.
 *
 * @param {object} options
 * @param {'public'|'participating'|'completed'|'applied'|'admin'} options.view
 * @param {string|undefined} options.status
 * @param {number} options.userId 로그인 사용자 ID
 * @param {object} options.commonWhere 공통 검색/필터 조건
 * @returns {object} 완성된 Prisma ChallengeWhereInput
 *
 * view별 의미:
 * - participating: APPROVED + 마감 전 + 내 ACTIVE 참여
 * - completed: CLOSED 또는 마감일 경과 + 내 ACTIVE 참여
 * - applied: 내가 신청한 모든 상태, 선택적으로 status 필터
 * - admin: 전체 신청 상태, 선택적으로 status 필터
 * - public: APPROVED/CLOSED 공개 목록
 */
function buildViewWhere({ view, status, userId, commonWhere }) {
  const now = new Date();

  switch (view) {
    case 'participating':
      // 현재 진행 중이고 사용자가 포기하지 않은 챌린지만 노출합니다.
      return {
        ...commonWhere,
        status: 'APPROVED',
        deadline: { gt: now },
        deletedAt: null,
        participations: {
          some: {
            userId,
            status: 'ACTIVE',
          },
        },
      };

    case 'completed':
      // 자정 Cron 반영 전에도 마감일이 지난 챌린지를 완료 목록에서 확인할 수 있게 합니다.
      return {
        ...commonWhere,
        deletedAt: null,
        OR: [{ status: 'CLOSED' }, { deadline: { lte: now } }],
        participations: {
          some: {
            userId,
            status: 'ACTIVE',
          },
        },
      };

    case 'applied':
      // 삭제 상태도 남겨야 신청자가 삭제 사유를 확인할 수 있어 deletedAt을 제외하지 않습니다.
      return {
        ...commonWhere,
        userId,
        ...(status && { status }),
      };

    case 'admin':
      // status를 생략하면 전체 신청을, 전달하면 해당 상태만 조회합니다.
      return {
        ...commonWhere,
        ...(status && { status }),
      };

    case 'public':
    default:
      // 신청 중/거절/삭제 상태가 일반 챌린지 목록에 노출되지 않게 제한합니다.
      return {
        ...commonWhere,
        status: status ?? { in: ['APPROVED', 'CLOSED'] },
        deletedAt: null,
      };
  }
}

/**
 * GET /challenges의 화면별 통합 목록을 반환합니다.
 *
 * 처리 순서:
 * 1. admin view 권한 확인
 * 2. 공통 검색/필터와 view별 조건 조합
 * 3. 같은 where로 목록과 total 조회
 * 4. 모든 화면이 동일한 pagination 응답 사용
 *
 * 참여 중/완료 화면에서만 현재 사용자의 Participation과 Submission ID를
 * 추가 조회합니다. 다른 화면에 불필요한 관계 데이터를 싣지 않으면서
 * "계속 도전하기"와 "내 번역문 보기" 이동에 필요한 ID를 제공합니다.
 *
 * @returns {{
 *   challenges: Array,
 *   pagination: {
 *     page: number,
 *     limit: number,
 *     total: number,
 *     totalPages: number,
 *     hasNext: boolean
 *   }
 * }}
 */
async function getChallenges({ userId, userRole, query }) {
  if (query.view === 'admin' && userRole !== 'ADMIN') {
    throw new ForbiddenError(
      '관리자 챌린지 신청 목록은 관리자만 조회할 수 있습니다.'
    );
  }

  const commonWhere = buildCommonWhere(query);
  const where = buildViewWhere({
    view: query.view,
    status: query.status,
    userId,
    commonWhere,
  });

  // 내 챌린지 두 화면에서만 Repository의 조건부 relation select를 활성화합니다.
  const participantUserId = ['participating', 'completed'].includes(query.view)
    ? userId
    : undefined;

  const { challenges, total } = await challengeRepository.findMany({
    where,
    orderBy: ORDER_BY_MAP[query.sort],
    page: query.page,
    limit: query.limit,
    participantUserId,
  });

  // 프론트는 hasNext가 true인 동안 page를 증가시켜 페이지/무한 스크롤에 공통 사용합니다.
  return {
    challenges,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
      hasNext: query.page * query.limit < total,
    },
  };
}

/**
 * GET /challenges/:id 상세 응답을 조합합니다.
 *
 * 공개 조회:
 * - APPROVED, CLOSED는 모든 로그인 사용자에게 공개
 *
 * 제한 조회:
 * - PENDING, REJECTED, DELETED는 신청자 본인과 ADMIN만 조회
 * - 권한이 없는 경우 존재 여부를 노출하지 않기 위해 403 대신 404
 *
 * 상세 응답의 `viewer`는 프론트가 동일한 상세 컴포넌트에서 버튼 상태를
 * 판단하도록 현재 로그인 사용자 기준 데이터를 제공합니다.
 * - isApplicant: 신청자 본인 여부
 * - participation: ACTIVE 참여와 연결 작업물 ID, 없으면 null
 * - canParticipate: 진행 중, 마감 전, 정원 여유, 신청자 아님, 미참여 조건
 *
 * CLOSED 상태에서만 topSubmissions를 반환합니다. Repository는 관계 데이터를
 * 조회하지만 Service가 상태에 맞는 공개 여부를 최종 결정합니다.
 */
async function getChallenge({ challengeId, userId, userRole }) {
  const challenge = await challengeRepository.findDetailById(
    challengeId,
    userId
  );

  if (!challenge) {
    throw new NotFoundError('챌린지를 찾을 수 없습니다.');
  }

  const isApplicant = challenge.userId === userId;
  const isAdmin = userRole === 'ADMIN';
  const isPublic = ['APPROVED', 'CLOSED'].includes(challenge.status);

  // 비공개 신청 상세의 존재 여부 자체가 다른 사용자에게 노출되지 않게 404를 사용합니다.
  if (!isPublic && !isApplicant && !isAdmin) {
    throw new NotFoundError('챌린지를 찾을 수 없습니다.');
  }

  const [participation = null] = challenge.participations;

  // 내부 조회용 relation 이름을 그대로 노출하지 않고 화면 계약에 맞게 재구성합니다.
  const { participations, submissions, ...data } = challenge;

  return {
    ...data,
    topSubmissions: challenge.status === 'CLOSED' ? submissions : [],
    viewer: {
      isApplicant,
      participation,
      canParticipate:
        challenge.status === 'APPROVED' &&
        challenge.deadline > new Date() &&
        challenge.currentParticipants < challenge.maxParticipants &&
        !isApplicant &&
        !participation,
    },
  };
}

/**
 * POST /challenges 신규 신청을 생성합니다.
 *
 * 클라이언트가 보낸 body에 서버 관리 필드를 덮어씁니다.
 * - userId: 로그인 사용자
 * - status: PENDING
 * - currentParticipants: 0
 *
 * 이렇게 해야 사용자가 곧바로 APPROVED 상태를 만들거나 참여 인원을 임의로
 * 조작할 수 없습니다.
 */
async function createChallenge({ userId, body }) {
  return challengeRepository.create({
    ...body,
    userId,
    status: 'PENDING',
    currentParticipants: 0,
  });
}

/**
 * PATCH /challenges/:id 중 관리자 정보 수정을 처리합니다.
 *
 * 허용 조건:
 * - ADMIN
 * - 존재하며 삭제되지 않음
 * - APPROVED이면서 실제 마감 시간이 지나지 않은 진행 중 상태
 * - maxParticipants 변경 시 현재 참여 인원 이상
 *
 * `reason`은 Challenge.reason에 저장하지 않습니다. reason 필드는 거절/삭제처럼
 * 신청 상세에서 지속적으로 보여줄 처리 사유용이고, 수정 사유는 해당 시점의
 * 알림 메시지에 기록합니다.
 *
 * 수정과 알림 생성을 같은 transactionClient로 실행하므로 알림 저장이 실패하면
 * 챌린지 수정도 rollback됩니다.
 */
async function updateChallenge({ challengeId, userRole, body }) {
  if (userRole !== 'ADMIN') {
    throw new ForbiddenError('챌린지 정보는 관리자만 수정할 수 있습니다.');
  }

  const challenge = await challengeRepository.findById(challengeId);

  if (!challenge || challenge.status === 'DELETED' || challenge.deletedAt) {
    throw new NotFoundError('챌린지를 찾을 수 없습니다.');
  }

  if (challenge.status !== 'APPROVED' || isChallengeClosed(challenge)) {
    throw new ConflictError('진행 중인 챌린지만 수정할 수 있습니다.');
  }

  if (
    body.maxParticipants !== undefined &&
    body.maxParticipants < challenge.currentParticipants
  ) {
    throw new ConflictError(
      '최대 참여 인원은 현재 참여 인원보다 작을 수 없습니다.'
    );
  }

  const { reason, ...challengeData } = body;

  return prisma.$transaction(async (transactionClient) => {
    // Repository에도 동일 client를 전달해야 아래 알림과 같은 트랜잭션이 됩니다.
    const updatedChallenge = await challengeRepository.update(
      challengeId,
      challengeData,
      transactionClient
    );

    // 수신자는 request body가 아니라 DB에서 조회한 실제 챌린지 신청자입니다.
    await createNotification(
      {
        userId: challenge.userId,
        type: 'CONTENT_CHANGED',
        targetType: 'CHALLENGE',
        targetId: challenge.id,
        message: `'${updatedChallenge.title}' 챌린지가 수정되었습니다. 사유: ${reason}`,
      },
      transactionClient
    );

    return updatedChallenge;
  });
}

/**
 * PATCH /challenges/:id 중 관리자 승인/거절을 처리합니다.
 *
 * 상태 전이는 PENDING → APPROVED 또는 PENDING → REJECTED만 허용합니다.
 * 이미 승인/거절/삭제/마감된 레코드를 다시 처리하면 409를 반환하여 반복
 * 요청으로 상태와 사유가 덮어써지는 것을 막습니다.
 *
 * 승인 시:
 * - 마감일이 아직 남아 있어야 함
 * - 기존 거절 사유를 남기지 않도록 reason=null
 *
 * 거절 시:
 * - Validation에서 필수로 받은 reason 저장
 * - 신청자 알림에 같은 사유 포함
 */
async function updateChallengeStatus({ challengeId, userRole, body }) {
  if (userRole !== 'ADMIN') {
    throw new ForbiddenError(
      '챌린지 승인과 거절은 관리자만 처리할 수 있습니다.'
    );
  }

  const challenge = await challengeRepository.findById(challengeId);

  if (!challenge || challenge.status === 'DELETED' || challenge.deletedAt) {
    throw new NotFoundError('챌린지를 찾을 수 없습니다.');
  }

  if (challenge.status !== 'PENDING') {
    throw new ConflictError(
      '승인 대기 중인 챌린지만 승인하거나 거절할 수 있습니다.'
    );
  }

  if (body.status === 'APPROVED' && challenge.deadline <= new Date()) {
    throw new ConflictError('마감일이 지난 챌린지는 승인할 수 없습니다.');
  }

  return prisma.$transaction(async (transactionClient) => {
    // 상태 저장과 알림 저장은 둘 중 하나만 남지 않도록 원자적으로 처리합니다.
    const updatedChallenge = await challengeRepository.update(
      challengeId,
      {
        status: body.status,
        reason: body.status === 'REJECTED' ? body.reason : null,
      },
      transactionClient
    );

    const message =
      body.status === 'APPROVED'
        ? `'${updatedChallenge.title}' 챌린지가 승인되었습니다.`
        : `'${updatedChallenge.title}' 챌린지가 거절되었습니다. 사유: ${body.reason}`;

    await createNotification(
      {
        userId: challenge.userId,
        type: 'STATUS_CHANGED',
        targetType: 'CHALLENGE',
        targetId: challenge.id,
        message,
      },
      transactionClient
    );

    return updatedChallenge;
  });
}

/**
 * PATCH /challenges/:id `{ action: 'CANCEL' }` 신청 취소를 처리합니다.
 *
 * 신청자 본인의 PENDING 레코드만 취소할 수 있습니다. 요구사항에서 취소된
 * 신청은 어드민 신청 목록에서 제외되어야 하므로 이 경우에는 soft delete가
 * 아니라 실제 레코드를 제거합니다.
 *
 * 승인/거절 후에는 상태 이력이 화면에 필요하므로 취소할 수 없습니다.
 */
async function cancelChallenge({ challengeId, userId }) {
  const challenge = await challengeRepository.findById(challengeId);

  if (!challenge) {
    throw new NotFoundError('챌린지를 찾을 수 없습니다.');
  }

  if (challenge.userId !== userId) {
    throw new ForbiddenError('본인이 신청한 챌린지만 취소할 수 있습니다.');
  }

  if (challenge.status !== 'PENDING') {
    throw new ConflictError(
      '승인 대기 중인 챌린지만 신청을 취소할 수 있습니다.'
    );
  }

  return challengeRepository.remove(challengeId);
}

/**
 * DELETE /challenges/:id 관리자 삭제를 처리합니다.
 *
 * 신청 취소와 달리 삭제된 챌린지는 신청자의 "내가 신청한 챌린지" 상세에서
 * DELETED 상태와 사유를 보여줘야 합니다. 따라서 레코드를 제거하지 않고
 * status=DELETED, reason, deletedAt을 저장합니다.
 *
 * 진행 중인 APPROVED/마감 전 챌린지만 삭제할 수 있으며, 변경과 신청자 알림은
 * 동일한 Prisma 트랜잭션으로 처리합니다.
 */
async function deleteChallenge({ challengeId, userRole, reason }) {
  if (userRole !== 'ADMIN') {
    throw new ForbiddenError('챌린지는 관리자만 삭제할 수 있습니다.');
  }

  const challenge = await challengeRepository.findById(challengeId);

  if (!challenge || challenge.status === 'DELETED' || challenge.deletedAt) {
    throw new NotFoundError('챌린지를 찾을 수 없습니다.');
  }

  if (challenge.status !== 'APPROVED' || isChallengeClosed(challenge)) {
    throw new ConflictError('진행 중인 챌린지만 삭제할 수 있습니다.');
  }

  return prisma.$transaction(async (transactionClient) => {
    // soft delete 필드를 명시적으로 남겨 공개 목록에서는 숨기고 신청 상세에는 보존합니다.
    const deletedChallenge = await challengeRepository.update(
      challengeId,
      {
        status: 'DELETED',
        reason,
        deletedAt: new Date(),
      },
      transactionClient
    );

    await createNotification(
      {
        userId: challenge.userId,
        type: 'STATUS_CHANGED',
        targetType: 'CHALLENGE',
        targetId: challenge.id,
        message: `'${deletedChallenge.title}' 챌린지가 삭제되었습니다. 사유: ${reason}`,
      },
      transactionClient
    );

    return deletedChallenge;
  });
}

export {
  getChallenges,
  getChallenge,
  createChallenge,
  updateChallenge,
  updateChallengeStatus,
  cancelChallenge,
  deleteChallenge,
};
