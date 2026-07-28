import * as draftRepository from '../repositories/draft.repository.js';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../utils/errors.js';
import { isChallengeClosed } from '../utils/challenge.js';

// Draft는 Submission과 1:1 관계라, 어드민이 사용해도 유저의 임시저장을 그대로
// 덮어써버리는 문제가 생김. 그래서 어드민 여부와 무관하게 본인 소유만 허용함.
// 어드민이 작업물을 고칠 땐 즉시 반영되는 PATCH /submissions/:id를 사용함.
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
