import prisma from '../config/prisma.js';

const baseSelect = {
  id: true,
  content: true,
  isTopSubmission: true,
  createdAt: true,
  updatedAt: true,
  challengeId: true,
  userId: true,
};

function buildListSelect(include) {
  const select = {
    ...baseSelect,
    _count: { select: { likes: true, feedbacks: true } },
  };
  // 챌린지 상세 페이지
  if (include === 'user') {
    select.user = { select: { id: true, nickname: true, grade: true } };
  }

  return select;
}

// 챌린지 상세 페이지: 작업물 목록 조회 (?challengeId=, ?include=user, ?orderBy=likeDesc, ?page=&limit=)
export async function getSubmissionList({
  challengeId,
  orderBy,
  include,
  page,
  limit,
}) {
  const where = {
    deletedAt: null,
    ...(challengeId && { challengeId }),
  };

  const [submissions, totalCount] = await prisma.$transaction([
    prisma.submission.findMany({
      where,
      orderBy:
        orderBy === 'likeDesc'
          ? [{ likes: { _count: 'desc' } }, { createdAt: 'desc' }]
          : { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: buildListSelect(include),
    }),
    prisma.submission.count({ where }),
  ]);

  return { submissions, totalCount };
}

// 작업물 상세 페이지: 작업물 상세 조회 (본인 것일 때만 draft.content 노출)
export async function getSubmissionById(id, userId) {
  const submission = await prisma.submission.findFirst({
    where: { id, deletedAt: null },
    include: {
      user: { select: { id: true, nickname: true } },
      challenge: { select: { title: true } },
      draft: {
        select: { id: true, title: true, content: true, updatedAt: true },
      },
      likes: { where: { userId }, select: { id: true }, take: 1 },
      _count: { select: { likes: true } },
    },
  });

  if (submission) {
    submission.isLiked = submission.likes.length > 0;
    delete submission.likes;

    // 본인 작업물이 아니면 title만 남기고 content 등은 제거
    if (submission.draft && submission.userId !== userId) {
      submission.draft = { title: submission.draft.title };
    }
  }

  return submission;
}

// 작업물 도전하기 페이지: 소유권/상태 확인용 원본 조회 (수정, 삭제, 제출 전 검증)-> 마감 판단을 위해 challenge도 include
export function findSubmissionById(id) {
  return prisma.submission.findUnique({
    where: { id },
    include: { challenge: { select: { status: true, deadline: true } } },
  });
}

// 작업물 수정
export function updateSubmissionContent(id, content) {
  return prisma.submission.update({ where: { id }, data: { content } });
}
