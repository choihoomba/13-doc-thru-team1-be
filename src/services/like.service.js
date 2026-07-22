// 비즈니스 규칙만 담당 — DB 접근은 repository에 위임한다.
import * as likeRepository from '../repositories/like.repository.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';
import { isChallengeClosed } from '../utils/challenge.js';

// 등록/취소가 공통으로 거치는 관문: 작업물 존재 + 마감 여부
async function ensureLikeable(submissionId) {
  const submission =
    await likeRepository.findSubmissionWithChallenge(submissionId);

  if (!submission) {
    throw new NotFoundError('작업물을 찾을 수 없습니다.');
  }

  // 마감 시점에 크론이 최다 추천작(isTopSubmission)을 확정하므로,
  // 마감 후 좋아요가 바뀌면 이미 계산된 순위와 어긋난다 → 상태 충돌(409)
  if (isChallengeClosed(submission.challenge)) {
    throw new ConflictError(
      '마감된 챌린지의 작업물에는 좋아요를 변경할 수 없습니다.'
    );
  }

  return submission;
}

// ── 좋아요 등록 ──
export async function addLike(submissionId, userId) {
  await ensureLikeable(submissionId);

  // 중복 확인 — DB 제약(P2002)에 맡길 수도 있지만,
  // 미리 확인하면 "이미 좋아요를 누른 작업물입니다" 같은 정확한 메시지를 줄 수 있다
  const existing = await likeRepository.findByUserAndSubmission(
    userId,
    submissionId
  );
  if (existing) {
    throw new ConflictError('이미 좋아요를 누른 작업물입니다.');
  }

  await likeRepository.create(userId, submissionId);

  // 프론트가 바로 하트 숫자를 갱신할 수 있도록 현재 개수와 상태를 함께 반환
  const likeCount = await likeRepository.countBySubmission(submissionId);
  return { liked: true, likeCount };
}

// ── 좋아요 취소 ──
export async function removeLike(submissionId, userId) {
  await ensureLikeable(submissionId);

  const existing = await likeRepository.findByUserAndSubmission(
    userId,
    submissionId
  );
  if (!existing) {
    throw new NotFoundError('좋아요를 누르지 않은 작업물입니다.');
  }

  // 소유권 검사가 따로 없는 이유:
  // 조회 자체를 (userId, submissionId)로 했으므로 남의 좋아요가 나올 수 없다
  await likeRepository.remove(existing.id);

  const likeCount = await likeRepository.countBySubmission(submissionId);
  return { liked: false, likeCount };
}
