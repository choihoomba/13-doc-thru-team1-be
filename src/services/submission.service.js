import * as submissionRepository from '../repositories/submission.repository.js';
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
}) {
  const { submissions, totalCount } =
    await submissionRepository.getSubmissionList({
      challengeId,
      orderBy,
      include,
      page,
      limit,
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
async function getSubmissionById(id, userId) {
  const submission = await submissionRepository.getSubmissionById(id, userId);

  if (!submission) {
    throw new NotFoundError('작업물을 찾을 수 없습니다');
  }

  return submission;
}

// 작업물 수정
// TODO: 제출 시 draft 삭제는 FE가 DELETE /draft/:id로 별도 처리 (여기선 draft 안 건드림)
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

  return submissionRepository.updateSubmissionContent(id, content);
}

export default {
  getSubmissionList,
  getSubmissionById,
  updateSubmission,
};
