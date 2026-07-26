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
    // 작업물 도전하기 페이지(include=draft)는 좋아요/피드백 수가 필요 없어서 제외
    ...(include !== 'draft' && {
      _count: { select: { likes: true, feedbacks: true } },
    }),
  };
  // 챌린지 상세 페이지
  if (include === 'user') {
    select.user = { select: { id: true, nickname: true, grade: true } };
  }
  // 작업물 도전하기 페이지
  if (include === 'draft') {
    select.draft = {
      select: { id: true, title: true, content: true, updatedAt: true },
    };
  }

  return select;
}

// 챌린지 상세 페이지: 작업물 목록 조회 (?challengeId=, ?include=user|draft, ?orderBy=likeDesc, ?page=&limit=)
export async function getSubmissionList({
  challengeId,
  orderBy,
  include,
  page,
  limit,
}) {
  const where = {
    // 작업물 도전하기 페이지(include=draft)는 삭제된 챌린지/작업물이어도 제목은 보여줘야 해서 소프트 삭제 필터 제외
    ...(include !== 'draft' && { deletedAt: null }),
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

// 작업물 상세 페이지: 작업물 상세 조회 (?include=feedback 일 때만 피드백 포함, page/limit으로 더보기)
export async function getSubmissionById(
  id,
  userId,
  include,
  { page, limit } = {}
) {
  const submission = await prisma.submission.findFirst({
    where: { id, deletedAt: null },
    include: {
      user: { select: { id: true, nickname: true } },
      challenge: { select: { title: true } },
      draft: { select: { title: true } },
      likes: { where: { userId }, select: { id: true }, take: 1 },
      _count: {
        select: {
          likes: true,
          ...(include === 'feedback' && { feedbacks: true }),
        },
      },
      ...(include === 'feedback' && {
        feedbacks: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            user: { select: { id: true, nickname: true } },
          },
          orderBy: { createdAt: 'asc' },
          skip: (page - 1) * limit,
          take: limit,
        },
      }),
    },
  });

  if (submission) {
    submission.isLiked = submission.likes.length > 0;
    delete submission.likes;
  }

  if (submission && include === 'feedback') {
    const totalCount = submission._count.feedbacks;
    submission.feedbackPagination = {
      page,
      limit,
      totalCount,
      hasMore: page * limit < totalCount,
    };
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
