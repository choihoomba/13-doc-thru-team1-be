import prisma from '../config/prisma.js';

// 챌린지 목록 + 총 개수 조회 (page, pageSize 적용)
export async function findAndCount(where, skip, take) {
  // 목록과 총 개수를 동시에 요청
  const [data, totalCount] = await Promise.all([
    prisma.challenge.findMany({
      where, // Service에서 만든 검색(keyword), 필터(field, status 등) 조건
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

// ------------------------------------------------------------
// 여기서부터 (나의 챌린지 - 참여중/완료, 무한스크롤)
// ------------------------------------------------------------

// 내가 참여한 챌린지 목록 조회 (cursor, limit 적용 - 무한스크롤)
// Participation 테이블을 바로 조회하는 게 아니라
// Challenge 테이블에서 챌린지를 조회하면서
// 그 챌린지에 내가 참여한 기록이 있는지를 같이 확인하는 방식
export async function findParticipatedList({
  userId,
  status,
  keyword,
  field,
  docType,
  cursor,
  limit,
}) {
  return prisma.challenge.findMany({
    where: {
      status, // 챌린지 상태를 기준으로
      // 참여중인 챌린지와 완료된 챌린지를 구분한다.
      //
      // Service에서 화면에서 받은 값을
      // 실제 Challenge 상태값으로 바꿔서 넘겨준다.
      //
      // 예)
      // ACTIVE → APPROVED
      // CLOSED → CLOSED
      deletedAt: null, // soft delete된 챌린지 제외
      participations: {
        some: {
          userId, // 이 챌린지의 참여자 중에 나(userId)가 있는지
          status: 'ACTIVE', // 포기(DROPPED)/삭제(REMOVED)된 참여 이력은 제외
        },
      },
      // 검색어/필터는 값이 있을 때만 조건에 포함
      ...(keyword && {
        title: { contains: keyword, mode: 'insensitive' },
      }),
      // field와 docType은 필터로 사용하지 않으므로
      // where 조건에는 넣지 않는다.
    },

    // limit보다 1개 더 가져오는 이유: "다음 페이지가 더 있는지" 판단하기 위해서
    take: limit + 1,

    // 커서가 있을 때만 적용 (첫 요청은 cursor 없이 처음부터 조회)
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1, // 커서로 지정한 항목 자기 자신은 건너뛰고 그 다음부터
    }),

    // 커서 기준(id)과 정렬 기준이 반드시 일치해야 커서 페이지네이션이 정확히 동작함
    orderBy: { id: 'asc' },

    select: {
      id: true,
      title: true,
      field: true,
      docType: true,
      deadline: true,
      status: true,
      currentParticipants: true,
      maxParticipants: true,

      // 상세 페이지 링크 연결
      submissions: {
        where: { userId, deletedAt: null },
        select: { id: true },
      },
    },
  });
}

// ------------------------------------------------------------
// 여기서부터 (어드민 - 신청 관리, 페이지네이션)
// ------------------------------------------------------------

// 관리자 - 신청 목록 조회 (검색/필터/정렬/페이지네이션)
export async function findApplicationsAndCount(where, skip, take, orderBy) {
  const [data, totalCount] = await Promise.all([
    prisma.challenge.findMany({
      where,
      skip,
      take,
      orderBy,
      select: {
        id: true,
        field: true,
        docType: true,
        title: true,
        maxParticipants: true,
        createdAt: true,
        deadline: true,
        status: true,
      },
    }),
    prisma.challenge.count({ where }),
  ]);

  return { data, totalCount };
}
