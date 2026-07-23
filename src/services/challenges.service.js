import challengeRepository from '../repositories/challenges.repository.js';
import { toChallengeResponse } from '../utils/challenge.formatter.js';
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  BadRequestError,
} from '../utils/errors.js';

const orderByMap = {
  appliedAt_asc: { createdAt: 'asc' },
  appliedAt_desc: { createdAt: 'desc' },
  deadline_asc: { deadline: 'asc' },
  deadline_desc: { deadline: 'desc' },
};

async function getChallengeList({ field, docType, search, page, limit }) {
  const { items, total } = await challengeRepository.findApprovedList({
    field,
    docType,
    search,
    page,
    limit,
  });

  return {
    challenges: items.map(toChallengeResponse),
    total,
    page,
    limit,
  };
}

async function getChallengeDetail(id) {
  const challenge = await challengeRepository.findApprovedById(id);

  if (!challenge) {
    throw new NotFoundError('요청한 챌린지를 찾을 수 없습니다.');
  }

  return toChallengeResponse(challenge);
}

async function createChallenge(userId, data) {
  const challenge = await challengeRepository.create({ userId, ...data });
  return toChallengeResponse(challenge);
}

async function getMyChallenges(userId, { status, sort, search }) {
  const orderBy = orderByMap[sort] || { createdAt: 'desc' };
  const queryStatus = status || { not: 'CLOSED' };

  const challenges = await challengeRepository.findMyChallenges({
    userId,
    status: queryStatus,
    search,
    orderBy,
  });

  return challenges.map(toChallengeResponse);
}

async function getMyChallengeDetail(id, userId) {
  const challenge = await challengeRepository.findMyChallengeById(id, userId, {
    not: 'CLOSED',
  });

  if (!challenge) {
    throw new NotFoundError(
      '요청한 챌린지를 찾을 수 없거나 접근 권한이 없습니다.'
    );
  }

  return toChallengeResponse(challenge);
}

async function cancelMyChallenge(id, userId) {
  const challenge = await challengeRepository.findById(id);

  if (!challenge) {
    throw new NotFoundError('챌린지를 찾을 수 없습니다.');
  }
  if (challenge.userId !== userId) {
    throw new ForbiddenError('본인이 신청한 챌린지만 취소할 수 있습니다.');
  }
  if (challenge.status !== 'PENDING') {
    throw new ConflictError('승인 대기 상태인 신청만 취소할 수 있습니다.');
  }

  await challengeRepository.deletePendingChallenge(id);
  return { id };
}

async function getAdminChallenges({ status, search, page, limit }) {
  const currentPage = page ?? 1;
  const currentLimit = limit ?? 10;

  const { items, total } = await challengeRepository.findAllChallenges({
    status,
    search,
    page: currentPage,
    limit: currentLimit,
  });

  return {
    challenges: items.map((ch) => toChallengeResponse(ch)),
    total,
    page: currentPage,
    limit: currentLimit,
  };
}

async function updateChallengeStatus(id, { status, reason }) {
  const challenge = await challengeRepository.findById(id);

  if (!challenge) {
    throw new NotFoundError('챌린지를 찾을 수 없습니다.');
  }
  if (challenge.status !== 'PENDING') {
    throw new ConflictError(
      '승인 대기 상태인 챌린지만 상태를 변경할 수 있습니다.'
    );
  }
  if (status === 'REJECTED' && !reason) {
    throw new BadRequestError('거절 시 사유(reason)를 입력해야 합니다.');
  }

  const updated = await challengeRepository.updateStatus(id, {
    status,
    reason,
  });
  return toChallengeResponse(updated);
}

async function softDeleteChallenge(id, reason) {
  const challenge = await challengeRepository.findById(id);

  if (!challenge) {
    throw new NotFoundError('챌린지를 찾을 수 없습니다.');
  }
  if (!reason) {
    throw new BadRequestError('삭제 시 사유(reason)를 입력해야 합니다.');
  }

  const deleted = await challengeRepository.softDelete(id, reason);
  return toChallengeResponse(deleted);
}

export default {
  getChallengeList,
  getChallengeDetail,
  createChallenge,
  getMyChallenges,
  getMyChallengeDetail,
  cancelMyChallenge,
  getAdminChallenges,
  updateChallengeStatus,
  softDeleteChallenge,
};
