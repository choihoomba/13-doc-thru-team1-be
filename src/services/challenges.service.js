import * as challengesRepository from '../repositories/challenges.repository.js';

/**
 * 챌린지 목록 조회 Service
 *
 * Controller에서 전달받은 query를 이용해서
 * 조회 조건(where)과 페이지네이션을 만든 뒤
 * Repository에 DB 조회를 요청
 * 프론트에서 사용할 응답 형태로 데이터를 반환
 */

export async function getChallenges(query) {
  const { page, pageSize, search, field, docType, status } = query;

  // 1. Prisma where 조건 조립
  const where = {
    // soft delete된 챌린지는 항상 제외
    deletedAt: null,

    /** 상태(status) 조건:
     *
     * 상태 필터 진행중, 마감 중 값 한개 선택시 하나만 조회
     * 상태 필터 값 선택 없을시 사용자에게 공개 가능한 값 조회 (APPROVED/CLOSED만 허용)
     * (PENDING/REJECTED는 기본적으로 제외됨)
     */
    status: status ? status : { in: ['APPROVED', 'CLOSED'] },

    // 제목 검색 (대소문자 구분 없이 검색)
    ...(search && {
      title: {
        contains: search,
        mode: 'insensitive',
      },
    }),
    // 분야 필터
    ...(field && { field }),
    // 문서 타입 필터
    ...(docType && { docType }),
  };

  //페이지네이션 계산
  //page = 현재 페이지
  //pageSize = 한 페이지에 보여줄 개수

  const skip = (page - 1) * pageSize;
  const take = pageSize;

  // 3. Repository 호출
  const { data, totalCount } = await challengesRepository.findAndCount(
    where,
    skip,
    take
  );

  // 4. 정원 마감 여부 계산
  // 현재 참여 인원과 최대 참여 인원을 비교해서
  // 정원이 모두 찼는지(isFull) 여부를 추가
  const challengesWithIsFull = data.map((challenge) => ({
    ...challenge,
    isFull: challenge.currentParticipants >= challenge.maxParticipants,
  }));

  /**
   * 프론트에서 사용할 응답 형태로 반환
   */
  return {
    page,
    pageSize,
    totalCount,
    data: challengesWithIsFull,
  };
}
