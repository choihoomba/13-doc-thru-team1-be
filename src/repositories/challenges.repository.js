import prisma from '../config/prisma.js';

async function create({
  userId,
  title,
  field,
  docType,
  content,
  originalUrl,
  deadline,
  maxParticipants,
}) {
  return prisma.challenge.create({
    data: {
      userId,
      title,
      field,
      docType,
      content,
      originalUrl,
      deadline,
      maxParticipants,
    },
  });
}

/*공개: 승인된(APPROVED) 챌린지 목록 조회 (soft delete 제외)*/
async function findApprovedList({
  field,
  docType,
  search,
  page = 1,
  limit = 10,
}) {
  const where = {
    status: 'APPROVED',
    deletedAt: null,
    ...(field ? { field } : {}),
    ...(docType ? { docType } : {}),
    ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.challenge.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.challenge.count({ where }),
  ]);

  return { items, total };
}

/*공개: 승인된(APPROVED) 챌린지 단건 조회 (참여 전 상세보기)*/
async function findApprovedById(id) {
  return prisma.challenge.findFirst({
    where: { id, status: 'APPROVED', deletedAt: null },
  });
}

/*유저: 내가 신청한 챌린지 목록 조회 (검색/필터/정렬)*/
async function findMyChallenges({ userId, status, search, orderBy }) {
  const where = {
    userId,
    ...(status ? { status } : {}),
    ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
  };

  return prisma.challenge.findMany({
    where,
    orderBy,
  });
}

/*유저: 내가 신청한 챌린지 상세 조회*/
async function findMyChallengeById(id, userId, statusOptions) {
  return prisma.challenge.findFirst({
    where: {
      id,
      userId,
      ...(statusOptions ? { status: statusOptions } : {}),
    },
  });
}

/*유저: 승인 대기(PENDING) 신청 취소 (참여자가 없으므로 Hard Delete)*/
async function deletePendingChallenge(id) {
  return prisma.challenge.delete({
    where: { id },
  });
}

/*공통: PK 기준 단건 챌린지 조회 */
async function findById(id) {
  return prisma.challenge.findUnique({
    where: { id },
  });
}

/*관리자: 전체 챌린지 목록 조회 (검색/필터/페이지네이션)*/
async function findAllChallenges({ status, search, page = 1, limit = 10 }) {
  const where = {
    ...(status ? { status } : {}),
    ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.challenge.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { nickname: true, email: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.challenge.count({ where }),
  ]);

  return { items, total };
}

/*관리자: 챌린지 상태 변경 (승인/거절)*/
async function updateStatus(id, { status, reason }) {
  return prisma.challenge.update({
    where: { id },
    data: {
      status,
      reason: reason ?? null,
    },
  });
}

/*관리자: 챌린지 삭제 (Soft Delete)*/
async function softDelete(id, reason) {
  return prisma.challenge.update({
    where: { id },
    data: {
      status: 'DELETED',
      reason,
      deletedAt: new Date(),
    },
  });
}

export default {
  create,
  findApprovedList,
  findApprovedById,
  findMyChallenges,
  findMyChallengeById,
  deletePendingChallenge,
  findById,
  findAllChallenges,
  updateStatus,
  softDelete,
};
