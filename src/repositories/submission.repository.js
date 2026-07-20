import prisma from '../config/prisma.js';

const baseSelect = {
  id: true,
  content: true,
  isTopSubmission: true,
  createdAt: true,
  updatedAt: true,
  challengeId: true,
  userId: true,
  _count: { select: { likes: true, feedbacks: true } },
};

function buildListSelect(include) {
  const select = { ...baseSelect };
  // 챌린지 상세 페이지
  if (include === 'user') {
    select.user = { select: { id: true, nickname: true } };
  }
  // 작업물 도전하기 페이지
  if (include === 'draft') {
    select.draft = {
      select: { id: true, title: true, content: true, updatedAt: true },
    };
  }

  return select;
}

// 챌린지 상세 페이지: 작업물 목록 조회 (?challengeId=, ?include=user|draft, ?orderBy=likeDesc)
export function getSubmissionList({ challengeId, orderBy, include }) {
  return prisma.submission.findMany({
    where: {
      deletedAt: null,
      ...(challengeId && { challengeId }),
    },
    orderBy:
      orderBy === 'likeDesc'
        ? { likes: { _count: 'desc' } }
        : { createdAt: 'desc' },
    select: buildListSelect(include),
  });
}

// 작업물 상세 페이지: 작업물 상세 조회 (?include=feedback 일 때만 피드백 포함, page/limit으로 더보기)
export async function getSubmissionById(
  id,
  include,
  { page, limit } = {}
) {
  const submission = await prisma.submission.findFirst({
    where: { id, deletedAt: null },
    include: {
      user: { select: { id: true, nickname: true } },
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

// 작업물 도전하기 페이지: 소유권/상태 확인용 원본 조회 (수정, 삭제, 제출 전 검증)
export function findSubmissionById(id) {
  return prisma.submission.findUnique({ where: { id } });
}

// 작업물 도전하기 페이지: 제출하려는 참여 내역이 본인 것인지, 이미 제출했는지 확인하기 위한 조회
export function findParticipationById(participationId) {
  return prisma.participation.findUnique({
    where: { id: participationId },
    include: { submission: true },
  });
}

// 작업물 생성 (제출하기)
export function createSubmission({
  participationId,
  challengeId,
  userId,
  content,
}) {
  return prisma.submission.create({
    data: { participationId, challengeId, userId, content },
  });
}

// 작업물 수정
export function updateSubmissionContent(id, content) {
  return prisma.submission.update({ where: { id }, data: { content } });
}

// 작업물 삭제 (soft delete)
export function softDeleteSubmission(id) {
  return prisma.submission.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
