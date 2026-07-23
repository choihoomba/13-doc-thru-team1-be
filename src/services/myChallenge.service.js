import * as challengesRepository from '../repositories/challenges.repository.js';

/**
 * 나의 챌린지 목록 조회 (참여중 / 완료 탭, 검색+필터+무한스크롤)
 */
export async function getList({
  userId,
  status,
  keyword,
  field,
  docType,
  cursor,
  limit,
}) {
  // 화면 전용 상태값 -> 실제 Prisma enum 값으로 변환
  const challengeStatus = status === 'ACTIVE' ? 'APPROVED' : 'CLOSED';

  const rows = await challengesRepository.findParticipatedList({
    userId,
    status: challengeStatus,
    keyword,
    field,
    docType,
    cursor,
    limit, // limit+1개 요청(다음 페이지가 있는지 확인 용)
  });

  // 무한 스크롤 : limit+1개를 요청하여, 그 이상 왔으면 다음 페이지가 더 있다는 뜻
  const hasMore = rows.length > limit;
  const sliced = hasMore ? rows.slice(0, limit) : rows;

  // submissions 배열(0~1개)을 mySubmission 단일 값으로 평탄화
  // -> 프론트에서 매번 배열 첫 번째 요소를 꺼낼 필요 없이 바로 쓸 수 있게
  const data = sliced.map(({ submissions, ...challenge }) => ({
    ...challenge,
    mySubmissionID: submissions[0]?.id ?? null,
  }));

  // 다음 요청 때 프론트가 그대로 돌려보낼 cursor (더 없으면 null)
  const nextCursor = hasMore ? sliced[sliced.length - 1].id : null;

  return { data, nextCursor, hasMore };
}
