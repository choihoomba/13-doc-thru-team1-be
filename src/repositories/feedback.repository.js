// DB 접근만 담당 — 비즈니스 판단(권한/상태)은 하지 않는다.
import prisma from '../config/prisma.js';

// 작업물 존재 + 소속 챌린지 상태/마감일 (마감 판단에 필요)
// soft delete된 작업물(deletedAt != null)은 없는 것으로 취급
export function findSubmissionWithChallenge(submissionId) {
  return prisma.submission.findFirst({
    where: { id: submissionId, deletedAt: null },
    include: {
      challenge: { select: { status: true, deadline: true } },
    },
  });
}

// 커서 기반 피드백 목록 (더 보기)
export function findManyBySubmission(submissionId, { cursor, take }) {
  return prisma.feedback.findMany({
    where: { submissionId },
    take: take + 1, // 다음 페이지 존재 여부 판단용으로 1개 더
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, nickname: true, grade: true } },
    },
  });
}

// 피드백 1건 + 소속 챌린지 상태 (권한/마감 판단용)
export function findByIdWithChallenge(feedbackId) {
  return prisma.feedback.findFirst({
    where: {
      id: feedbackId,
      submission: { deletedAt: null }, // 삭제된 작업물의 피드백은 조회 안 됨
    },
    include: {
      submission: {
        include: { challenge: { select: { status: true, deadline: true } } },
      },
    },
  });
}

export function create(submissionId, userId, content) {
  return prisma.feedback.create({
    data: { content, submissionId, userId },
  });
}

export function update(feedbackId, content) {
  return prisma.feedback.update({
    where: { id: feedbackId },
    data: { content },
  });
}

export function remove(feedbackId) {
  return prisma.feedback.delete({
    where: { id: feedbackId },
  });
}
