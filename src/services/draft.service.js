import * as draftRepository from '../repositories/draft.repository.js';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../utils/errors.js';
import { isChallengeClosed } from '../utils/challenge.js';

async function assertOwnsSubmission(userId, submissionId) {
  const submission = await draftRepository.findSubmissionOwner(submissionId);

  if (!submission) {
    throw new NotFoundError('작업물을 찾을 수 없습니다');
  }
  if (submission.userId !== userId) {
    throw new ForbiddenError(
      '본인의 작업물만 임시저장하거나 삭제할 수 있습니다'
    );
  }
  if (isChallengeClosed(submission.challenge)) {
    throw new ConflictError('마감된 챌린지의 작업물은 임시저장할 수 없습니다');
  }
}

// 임시저장 (upsert)
async function upsertDraft(userId, submissionId, { title, content }) {
  await assertOwnsSubmission(userId, submissionId);

  return draftRepository.createDraft({
    submissionId,
    userId,
    title,
    content,
  });
}

// 임시저장 삭제
async function deleteDraft(userId, submissionId) {
  await assertOwnsSubmission(userId, submissionId);

  await draftRepository.deleteDraft(submissionId);
}

export default {
  upsertDraft,
  deleteDraft,
};
