import * as submissionRepository from '../repositories/submission.repository.js';
import { ForbiddenError, NotFoundError } from '../utils/errors.js';

// 작업물 목록 조회
export async function getSubmissionList({ challengeId, orderBy, include }) {
  return submissionRepository.getSubmissionList({
    challengeId,
    orderBy,
    include,
  });
}

// 작업물 상세 조회 (?include=feedback 일 때만 피드백 포함, 더보기용 페이지네이션)
export async function getSubmissionById(id, userId, include, pagination) {
  const submission = await submissionRepository.getSubmissionById(
    id,
    userId,
    include,
    pagination
  );

  if (!submission) {
    throw new NotFoundError('작업물을 찾을 수 없습니다');
  }

  return submission;
}

// 작업물 수정
export async function updateSubmission(userId, id, content) {
  const submission = await submissionRepository.findSubmissionById(id);

  if (!submission || submission.deletedAt) {
    throw new NotFoundError('작업물을 찾을 수 없습니다');
  }
  if (submission.userId !== userId) {
    throw new ForbiddenError('본인이 작성한 작업물만 수정할 수 있습니다');
  }

  return submissionRepository.updateSubmissionContent(id, content);
}

// 작업물 삭제
export async function deleteSubmission(userId, id) {
  const submission = await submissionRepository.findSubmissionById(id);

  if (!submission || submission.deletedAt) {
    throw new NotFoundError('작업물을 찾을 수 없습니다');
  }
  if (submission.userId !== userId) {
    throw new ForbiddenError('본인이 작성한 작업물만 삭제할 수 있습니다');
  }

  await submissionRepository.softDeleteSubmission(id);
}
