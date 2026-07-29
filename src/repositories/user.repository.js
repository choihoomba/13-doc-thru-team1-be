import prisma from '../config/prisma.js';

// email로 유저 조회 — signin(로그인 검증), signup(이메일 중복 체크)에 사용
export function findByEmail(email) {
  return prisma.user.findUnique({ where: { email } });
}

// id로 유저 조회 — /auth/me, refresh 등에서 사용
export function findById(id) {
  return prisma.user.findUnique({ where: { id } });
}

export function create({ email, password, nickname }) {
  return prisma.user.create({ data: { email, password, nickname } });
}

export function updateRefreshToken(id, refreshToken) {
  return prisma.user.update({
    where: { id },
    data: { refreshToken },
  });
}
