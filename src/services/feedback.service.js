// 비즈니스 규칙만 담당 — DB 접근은 repository에 위임한다.
import * as feedbackRepository from '../repositories/feedback.repository.js';
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from '../utils/errors.js';
import { isChallengeClosed } from '../utils/challenge.js';

// 한 번에 몇 개씩 내려줄지 기본값 — "더 보기" 한 번당 5개
const DEFAULT_TAKE = 5;

// ────────────────────────────────────────────
// 조회 (R) : 작업물 상세 페이지의 피드백 목록
// ────────────────────────────────────────────
export async function getFeedbacks(
  submissionId,
  { cursor, take = DEFAULT_TAKE } = {}
) {
  // 작업물이 실제로 있는지(soft delete 제외) 먼저 확인
  const submission =
    await feedbackRepository.findSubmissionWithChallenge(submissionId);
  if (!submission) {
    throw new NotFoundError('작업물을 찾을 수 없습니다.');
  }

  const rows = await feedbackRepository.findManyBySubmission(submissionId, {
    cursor,
    take,
  });

  const hasNext = rows.length > take; // take보다 많이 왔으면 뒤에 더 있음
  const list = hasNext ? rows.slice(0, take) : rows; // 넘치게 받은 +1개는 잘라냄
  const nextCursor = hasNext ? list[list.length - 1].id : null; // 다음 요청용 커서

  return { feedbacks: list, nextCursor, hasNext };
}

// ────────────────────────────────────────────
// 공유 헬퍼 : 수정/삭제의 앞부분(존재·마감·권한 검사)이 동일
//            → 규칙이 바뀌어도 여기 한 군데만 고치면 됨
// ────────────────────────────────────────────
async function ensureCanMutateFeedback(feedbackId, userId, userRole) {
  const feedback = await feedbackRepository.findByIdWithChallenge(feedbackId);

  // 1) 존재 확인 — 없으면 뒤 검사가 무의미하니 여기서 끊음
  if (!feedback) {
    throw new NotFoundError('피드백을 찾을 수 없습니다.');
  }

  // 2) 마감 차단 — 권한 문제가 아니라 '챌린지가 마감된 상태'라서 불가하므로 409
  //    (어드민이라도 마감된 챌린지는 수정할 수 없다)
  if (isChallengeClosed(feedback.submission.challenge)) {
    throw new ConflictError(
      '마감된 챌린지의 피드백은 수정하거나 삭제할 수 없습니다.'
    );
  }

  // 3) 권한 확인 — "본인이거나(OR) 어드민이면" 통과
  //    그래서 '둘 다 아닐 때'(!isOwner && !isAdmin)만 막음
  const isOwner = feedback.userId === userId;
  const isAdmin = userRole === 'ADMIN';
  if (!isOwner && !isAdmin) {
    throw new ForbiddenError('피드백을 수정하거나 삭제할 권한이 없습니다.');
  }

  return feedback;
}

// ────────────────────────────────────────────
// 생성 (C)
// ────────────────────────────────────────────
export async function createFeedback(submissionId, userId, content) {
  const submission =
    await feedbackRepository.findSubmissionWithChallenge(submissionId);

  // 존재 확인 — 없는 작업물에 피드백을 매달 순 없음
  if (!submission) {
    throw new NotFoundError('작업물을 찾을 수 없습니다.');
  }

  // 마감된 챌린지엔 새 피드백도 막음 (팀 규칙에 따라 이 블록만 빼면 됨)
  if (isChallengeClosed(submission.challenge)) {
    throw new ConflictError('마감된 챌린지에는 피드백을 작성할 수 없습니다.');
  }

  return feedbackRepository.create(submissionId, userId, content);
}

// ────────────────────────────────────────────
// 수정 (U)
// ────────────────────────────────────────────
export async function updateFeedback(feedbackId, userId, userRole, content) {
  await ensureCanMutateFeedback(feedbackId, userId, userRole);
  return feedbackRepository.update(feedbackId, content);
}

// ────────────────────────────────────────────
// 삭제 (D)
// ────────────────────────────────────────────
export async function deleteFeedback(feedbackId, userId, userRole) {
  await ensureCanMutateFeedback(feedbackId, userId, userRole);
  return feedbackRepository.remove(feedbackId);
}
