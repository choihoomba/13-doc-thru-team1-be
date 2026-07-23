import prisma from '../config/prisma.js';

// Repository는 비즈니스 판단 없이 Prisma 쿼리만 담당합니다.
// 생성과 수정 응답에서 반환 필드가 달라지지 않도록 select를 한 곳에서 재사용하고,
// 필요한 필드만 조회해 API가 내부 관계 데이터를 불필요하게 노출하지 않게 합니다.
const challengeSelect = {
  id: true,
  title: true,
  field: true,
  docType: true,
  content: true,
  originalUrl: true,
  deadline: true,
  maxParticipants: true,
  currentParticipants: true,
  status: true,
  reason: true,
  deletedAt: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
};

async function create(data) {
  // 신규 신청은 이 단계에서 함께 저장할 알림이 없으므로 기본 Prisma Client를 사용합니다.
  return prisma.challenge.create({
    data,
    select: challengeSelect,
  });
}

async function findById(id) {
  // 고유 ID 조회는 findUnique를 사용합니다. 데이터가 없으면 null을 반환하고,
  // 이를 어떤 HTTP 오류로 바꿀지는 비즈니스 계층인 Service가 결정합니다.
  return prisma.challenge.findUnique({
    where: { id },
    select: challengeSelect,
  });
}

// databaseClient가 전달되면 호출한 Service의 트랜잭션 안에서 수정합니다.
// 알림 Repository에도 같은 transactionClient를 전달해야 두 쿼리가 같은 작업 단위가 됩니다.
// 전달되지 않으면 기본 Prisma Client를 사용하므로 단독 수정 호출에도 재사용할 수 있습니다.
async function update(id, data, databaseClient = prisma) {
  return databaseClient.challenge.update({
    where: { id },
    data,
    select: challengeSelect,
  });
}

export { create, findById, update };
