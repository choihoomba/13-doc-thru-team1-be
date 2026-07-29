import prisma from '../config/prisma.js';
import * as submissionRepository from '../repositories/submission.repository.js';
import { createNotification } from './notification.service.js';
import {
  ForbiddenError,
  NotFoundError,
  ConflictError,
} from '../utils/errors.js';
import { isChallengeClosed } from '../utils/challenge.js';

// 작업물 목록 조회
async function getSubmissionList({
  challengeId,
  orderBy,
  include,
  page,
  limit,
  userId,
}) {
  const { submissions, totalCount } =
    await submissionRepository.getSubmissionList({
      challengeId,
      orderBy,
      include,
      page,
      limit,
      userId,
    });

  return {
    submissions,
    pagination: {
      page,
      limit,
      totalCount,
      hasMore: page * limit < totalCount,
    },
  };
}

// 작업물 상세 조회 (피드백은 GET /submissions/:submissionId/feedbacks로 별도 조회)
async function getSubmissionById(id, userId, userRole) {
  const submission = await submissionRepository.getSubmissionById(
    id,
    userId,
    userRole
  );

  if (!submission) {
    throw new NotFoundError('작업물을 찾을 수 없습니다');
  }

  return submission;
}

// 작업물 수정
// 제출 시 draft 삭제는 FE가 DELETE /draft/:id로 별도 처리 (여기선 draft 안 건드림)
async function updateSubmission(userId, userRole, id, content) {
  const submission = await submissionRepository.findSubmissionById(id);

  if (!submission || submission.deletedAt) {
    throw new NotFoundError('작업물을 찾을 수 없습니다');
  }

  const isOwner = submission.userId === userId;
  const isAdmin = userRole === 'ADMIN';
  if (!isOwner && !isAdmin) {
    throw new ForbiddenError('본인이 작성한 작업물만 수정할 수 있습니다');
  }

  if (isChallengeClosed(submission.challenge)) {
    throw new ConflictError('마감된 챌린지의 작업물은 수정할 수 없습니다');
  }

  const isFirstSubmit = submission.content === '' && content !== '';

  return prisma.$transaction(async (transactionClient) => {
    const updated = await submissionRepository.updateSubmissionContent(
      id,
      content,
      transactionClient
    );

    // 최초 제출 → 챌린지 신청자에게 알림 (어드민 여부와 무관, 제출 자체에 대한 알림)
    if (isFirstSubmit) {
      await createNotification(
        {
          userId: submission.challenge.userId,
          type: 'NEW_SUBMISSION',
          targetType: 'SUBMISSION',
          targetId: submission.id,
          message: `'${submission.challenge.title}' 챌린지에 새로운 작업물이 제출되었습니다.`,
        },
        transactionClient
      );
    }

    // 어드민 수정 → 작성자에게 알림 (본인 소유 여부와 무관하게 어드민 권한 우선)
    if (isAdmin) {
      await createNotification(
        {
          userId: submission.userId,
          type: 'CONTENT_CHANGED',
          targetType: 'SUBMISSION',
          targetId: submission.id,
          message: `'${submission.challenge.title}' 챌린지의 작성하신 작업물이 수정되었습니다.`,
        },
        transactionClient
      );
    }

    return updated;
  });
}

// 작업물 삭제
// - 어드민: soft delete 처리 (deletedAt 세팅) + 작성자에게 알림 (본인 소유 여부와 무관하게 어드민 권한 우선)
// - 일반 유저(본인): content만 빈 값으로 초기화 (soft delete 아님, 참여는 유지되어 재작성 가능), 알림 없음
async function deleteSubmission(userId, userRole, id) {
  const submission = await submissionRepository.findSubmissionById(id);

  if (!submission || submission.deletedAt) {
    throw new NotFoundError('작업물을 찾을 수 없습니다');
  }

  const isOwner = submission.userId === userId;
  const isAdmin = userRole === 'ADMIN';
  if (!isOwner && !isAdmin) {
    throw new ForbiddenError('본인이 작성한 작업물만 삭제할 수 있습니다');
  }

  if (isChallengeClosed(submission.challenge)) {
    throw new ConflictError('마감된 챌린지의 작업물은 삭제할 수 없습니다');
  }

  // 어드민: soft delete + 알림 (우선 처리)
  if (isAdmin) {
    return prisma.$transaction(async (transactionClient) => {
      const deleted = await submissionRepository.softDeleteSubmission(
        id,
        transactionClient
      );

      await createNotification(
        {
          userId: submission.userId,
          type: 'CONTENT_CHANGED',
          targetType: 'SUBMISSION',
          targetId: submission.id,
          message: `'${submission.challenge.title}' 챌린지의 작성하신 작업물이 삭제되었습니다.`,
        },
        transactionClient
      );

      return deleted;
    });
  }

  // 일반 유저(본인): content 초기화만, 알림 없음
  return submissionRepository.updateSubmissionContent(id, '');
}

export default {
  getSubmissionList,
  getSubmissionById,
  updateSubmission,
  deleteSubmission,
};
