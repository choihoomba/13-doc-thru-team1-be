import prisma from '../config/prisma.js';

const notificationSelect = {
  id: true,
  type: true,
  targetType: true,
  targetId: true,
  message: true,
  isRead: true,
  createdAt: true,
  userId: true,
};

// 로그인 사용자에게 전달된 알림만 조회합니다.
// 생성 시간이 같을 때도 순서가 바뀌지 않도록 id를 두 번째 정렬 기준으로 사용합니다.
async function findManyByUserId(userId) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    select: notificationSelect,
  });
}

async function findById(id) {
  return prisma.notification.findUnique({
    where: { id },
    select: notificationSelect,
  });
}

// databaseClient가 전달되면 호출한 Service의 트랜잭션 안에서 알림을 저장합니다.
// 전달되지 않은 경우 기본 Prisma Client로 단독 저장합니다.
async function create(data, databaseClient = prisma) {
  return databaseClient.notification.create({
    data,
    select: notificationSelect,
  });
}

async function updateIsRead(id) {
  return prisma.notification.update({
    where: { id },
    data: { isRead: true },
    select: notificationSelect,
  });
}

export { findManyByUserId, findById, create, updateIsRead };
