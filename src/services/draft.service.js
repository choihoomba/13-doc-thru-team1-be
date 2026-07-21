import * as draftRepository from '../repositories/draft.repository.js';
import { ForbiddenError, NotFoundError } from '../utils/errors.js';

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
}

// 임시저장 (upsert)
export async function upsertDraft(userId, submissionId, { title, content }) {
  await assertOwnsSubmission(userId, submissionId);

  return draftRepository.createDraft({
    submissionId,
    userId,
    title,
    content,
  });
}

// 임시저장 삭제
export async function deleteDraft(userId, submissionId) {
  await assertOwnsSubmission(userId, submissionId);

  await draftRepository.deleteDraft(submissionId);
}
