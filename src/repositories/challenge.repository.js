import prisma from '../config/prisma.js';

// 여러 Challenge 엔드포인트가 같은 응답 필드를 사용하도록 조회 필드를 한 곳에서 관리합니다.
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
  return prisma.challenge.create({
    data,
    select: challengeSelect,
  });
}

// 상세 조회, 수정, 삭제에서 공통으로 사용할 수 있는 기본 조회 함수입니다.
async function findById(id) {
  return prisma.challenge.findUnique({
    where: { id },
    select: challengeSelect,
  });
}

async function update(id, data) {
  return prisma.challenge.update({
    where: { id },
    data,
    select: challengeSelect,
  });
}

// 목록 담당자는 query 조건을 Prisma where/orderBy로 변환한 findMany 함수를 이 파일에 추가합니다.
// Repository에는 권한이나 상태 판단을 넣지 않고 데이터 접근 코드만 작성합니다.

export { create, findById, update };
