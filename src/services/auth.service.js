import * as userRepository from '../repositories/user.repository.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} from '../utils/errors.js';
import {
  hashRefreshToken,
  signAccessToken,
  signRefreshToken,
  verifyToken,
} from '../utils/token.js';

// 본인 정보 응답용 — 민감 필드(password, refreshToken) 제외
// 타인에게 노출되는 유저 정보(닉네임/등급만)와 공개 범위가 다르므로(여기엔 email 포함)
// 공용 util로 빼지 않고 auth 전용으로 둠
function toAuthUser(user) {
  return {
    id: user.id,
    role: user.role,
    email: user.email,
    nickname: user.nickname,
    grade: user.grade,
  };
}

export async function signup({ email, password, nickname }) {
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    throw new ConflictError('이미 사용 중인 이메일입니다.');
  }
  const hashedPassword = await hashPassword(password);

  const user = await userRepository.create({
    email,
    password: hashedPassword,
    nickname,
  });

  return toAuthUser(user);
}

export async function signin({ email, password }) {
  // 유저 없음과 비밀번호 불일치를 같은 메시지/상태코드로 처리
  // 구분하면 "이 이메일은 가입돼 있다"는 계정 존재 여부가 노출됨
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new UnauthorizedError('이메일 또는 비밀번호가 일치하지 않습니다.');
  }

  const isMatch = await verifyPassword(password, user.password);
  if (!isMatch) {
    throw new UnauthorizedError('이메일 또는 비밀번호가 일치하지 않습니다.');
  }

  const payload = { userId: user.id, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await userRepository.updateRefreshToken(
    user.id,
    hashRefreshToken(refreshToken)
  );

  return { user: toAuthUser(user), accessToken, refreshToken };
}

export async function getMe(userId) {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new NotFoundError('사용자를 찾을 수 없습니다.');
  }
  return toAuthUser(user);
}

export async function signout(userId) {
  // DB의 refreshToken 제거
  await userRepository.updateRefreshToken(userId, null);
}

export async function refresh(refreshToken) {
  if (!refreshToken) {
    throw new UnauthorizedError('로그인이 필요합니다.');
  }

  let payload;
  try {
    payload = verifyToken(refreshToken, 'refresh');
  } catch (err) {
    // 만료만 REFRESH_EXPIRED로 구분(프론트 재로그인 안내용)
    // 그 외(위조/type 불일치)는 일반 인증 실패
    if (err.name === 'TokenExpiredError') {
      throw new UnauthorizedError(
        '세션이 만료되었습니다. 다시 로그인해주세요.',
        'REFRESH_EXPIRED'
      );
    }
    throw new UnauthorizedError('유효하지 않은 인증 정보입니다.');
  }

  const user = await userRepository.findById(payload.userId);
  if (!user) {
    throw new UnauthorizedError('유효하지 않은 인증 정보입니다.');
  }

  // 저장된 해시와 대조 — 불일치면 회전됐거나 탈취 의심(단순 401)
  const incomingHash = hashRefreshToken(refreshToken);
  if (user.refreshToken !== incomingHash) {
    throw new UnauthorizedError('유효하지 않은 인증 정보입니다.');
  }

  // 새 토큰 발급 (role은 DB 기준으로 최신화)
  const payloadForToken = { userId: user.id, role: user.role };
  const newAccessToken = signAccessToken(payloadForToken);
  const newRefreshToken = signRefreshToken(payloadForToken);

  await userRepository.updateRefreshToken(
    user.id,
    hashRefreshToken(newRefreshToken)
  );

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}
