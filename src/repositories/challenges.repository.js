import prisma from '../config/prisma.js';

// 챌린지 목록 + 총 개수 조회 (page, pageSize 적용)
export async function findAndCount(where, skip, take) {
  // 목록과 총 개수를 동시에 요청
  const [data, totalCount] = await Promise.all([
    prisma.challenge.findMany({
      where, // Service에서 만든 검색(search), 필터(field, status 등) 조건
      skip, // 시작 위치 / 몇 개를 건너뛸지 (페이지네이션)
      take, // 한 페이지에 가져올 데이터 개수(페이지네이션)
      orderBy: { createdAt: 'desc' }, // 최신 챌린지가 먼저 보이도록
      select: {
        id: true,
        title: true,
        field: true,
        docType: true,
        deadline: true,
        status: true,
        currentParticipants: true,
        maxParticipants: true,
      },
    }),
    prisma.challenge.count({ where }), // 조건에 맞는 챌린지의 전체 개수 카운트
  ]);
  //{ 목록, 총 개수 } 형태로 반환
  return { data, totalCount };
}
