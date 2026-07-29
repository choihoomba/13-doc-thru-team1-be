// DB 접근만 담당 — 비즈니스 판단(마감/중복)은 하지 않는다.
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

// 이미 누른 좋아요가 있는지 조회
// 스키마의 @@unique([userId, submissionId]) 덕분에 복합 키로 한 번에 찾을 수 있다
// (Prisma가 필드명을 밑줄로 이어 userId_submissionId 라는 키를 자동 생성)
export function findByUserAndSubmission(userId, submissionId) {
  return prisma.like.findUnique({
    where: { userId_submissionId: { userId, submissionId } },
  });
}

export function create(userId, submissionId) {
  return prisma.like.create({
    data: { userId, submissionId },
  });
}

export function remove(likeId) {
  return prisma.like.delete({
    where: { id: likeId },
  });
}

// 작업물이 받은 총 좋아요 수
// Submission에 likeCount 캐시 필드가 없으므로 필요할 때 집계한다
export function countBySubmission(submissionId) {
  return prisma.like.count({
    where: { submissionId },
  });
}
