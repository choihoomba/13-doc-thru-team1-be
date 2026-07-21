// ============================================================
// Participation Repository
// ============================================================

import prisma from '../config/prisma.js';
import {
  ForbiddenError,
  NotFoundError,
  ConflictError,
} from '../utils/errors.js';

/** 작업 도전하기 등록 */
async function create({ userId, challengeId }) {
  return await prisma.$transaction(async (tx) => {
    // 챌린지 존재 여부 확인
    const challenge = await tx.challenge.findUnique({
      where: { id: challengeId },
    });

    // 승인된 챌린지 인지 확인
    if (!challenge || challenge.status !== 'APPROVED') {
      throw new ConflictError('참여할 수 없는 챌린지입니다.');
    }

    // 챌린지 신청자 본인은 참여할 수 없는지 확인
    if (challenge.userId === userId) {
      throw new ForbiddenError('본인이 등록한 챌린지에는 참여할 수 없습니다.');
    }

    // 챌린지 데드라인 확인
    if (challenge.deadline < new Date()) {
      throw new ConflictError('마감된 챌린지입니다.');
    }

    // 해당 챌린지의 정원이 비어 있는지 확인 후, 참가자 +1
    const { count } = await tx.challenge.updateMany({
      where: {
        id: challengeId,
        currentParticipants: { lt: challenge.maxParticipants },
      },
      data: { currentParticipants: { increment: 1 } },
    });

    // 챌린지 정원 마감 확인
    if (count === 0) throw new ConflictError('참여 정원이 마감되었습니다.');

    // 작업물 도전하기 등록
    const participation = await tx.participation.create({
      data: { userId, challengeId, status: 'ACTIVE' },
    });

    // 작업물 생성
    const submission = await tx.submission.create({
      data: {
        userId,
        challengeId,
        participationId: participation.id,
        content: '',
      },
    });

    return { participation, submission };
  });
}

/** 작업 도전 포기하기 */
async function cancel({ userId, participationId }) {
  return await prisma.$transaction(async (tx) => {
    // 참여 존재 여부 확인 (연결된 챌린지도 함께 조회)
    const participation = await tx.participation.findUnique({
      where: { id: participationId },
      include: { challenge: true },
    });

    if (!participation) {
      throw new NotFoundError('존재하지 않는 참여입니다.');
    }

    // 본인 참여인지 확인
    if (participation.userId !== userId) {
      throw new ForbiddenError('본인의 참여만 포기할 수 있습니다.');
    }

    // 이미 포기했거나 유효하지 않은 참여인지 확인
    if (participation.status !== 'ACTIVE') {
      throw new ConflictError('이미 포기했거나 유효하지 않은 참여입니다.');
    }

    // 챌린지 데드라인 확인
    if (participation.challenge.deadline < new Date()) {
      throw new ConflictError('이미 마감된 챌린지입니다.');
    }

    // 참여 상태 'DROPPED'으로 변경 (동시 요청 시 이중 처리 방지를 위해 조건부 업데이트)
    const { count } = await tx.participation.updateMany({
      where: { id: participationId, status: 'ACTIVE' },
      data: { status: 'DROPPED' },
    });

    if (count === 0) {
      throw new ConflictError('이미 포기했거나 유효하지 않은 참여입니다.');
    }

    // 제출물 soft delete
    const submission = await tx.submission.update({
      where: { participationId },
      data: { deletedAt: new Date() },
    });

    // 챌린지 정원 -1
    await tx.challenge.update({
      where: { id: participation.challengeId },
      data: { currentParticipants: { decrement: 1 } },
    });

    const { challenge, ...participationData } = participation;
    return {
      participation: { ...participationData, status: 'DROPPED' },
      submission,
    };
  });
}

export default {
  create,
  cancel,
};
