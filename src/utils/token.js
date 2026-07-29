import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';

export function signAccessToken(payload) {
  return jwt.sign({ ...payload, type: 'access' }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });
}

export function signRefreshToken(payload) {
  return jwt.sign({ ...payload, type: 'refresh' }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });
}

// type에 따라 알맞은 시크릿으로 검증하고, payload의 type이 기대값과 일치하는지 확인
// 시크릿이 이미 분리돼 있어 서명 단계에서도 걸리지만, type 확인으로 한 번 더 방어
export function verifyToken(token, type) {
  const secret =
    type === 'access' ? env.JWT_ACCESS_SECRET : env.JWT_REFRESH_SECRET;

  const payload = jwt.verify(token, secret); // 실패 시 jwt 자체 에러 throw

  if (payload.type !== type) {
    throw new Error('토큰 용도가 일치하지 않습니다.');
    // 나중에 verifyToken 자체를 try catch 로 감싸서 커스텀에러로 변환처리
    // 위의 jwt 자체에러도 한 번에 처리
  }
  return payload;
}

// refresh token을 DB 저장/비교용으로 해싱
// bcrypt 대신 SHA-256을 쓰는 이유:
//  - bcrypt는 입력 72바이트 제한이 있어 긴 JWT에 부적합
//  - refresh token은 이미 랜덤성이 높아 salt/느린 해시가 불필요
//  - 검증 시 hashRefreshToken(받은토큰) === 저장값 으로 단순 비교 가능
export function hashRefreshToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}
