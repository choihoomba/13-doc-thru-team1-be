// src/utils/errors.js
// 커스텀 에러 — 서비스 레이어에서 throw하면 error.middleware가 받아 처리한다.
// code 필드로 프론트가 에러 종류를 분기할 수 있게 한다.

class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

class BadRequestError extends AppError {
  constructor(message = '잘못된 요청입니다.') {
    super(message, 400, 'BAD_REQUEST');
  }
}

// code를 선택적으로 받아 토큰 만료(TOKEN_EXPIRED) 등을 구분할 수 있게 함
// 기본값이 있어 기존 사용처(new UnauthorizedError("메시지"))는 그대로 동작
class UnauthorizedError extends AppError {
  constructor(message = '로그인이 필요합니다.', code = 'UNAUTHORIZED') {
    super(message, 401, code);
  }
}

class ForbiddenError extends AppError {
  constructor(message = '권한이 없습니다.') {
    super(message, 403, 'FORBIDDEN');
  }
}

class NotFoundError extends AppError {
  constructor(message = '요청한 리소스를 찾을 수 없습니다.') {
    super(message, 404, 'NOT_FOUND');
  }
}

// 비즈니스 규칙 위반으로 인한 충돌 (마감된 챌린지 참여, 최대 인원 초과, 중복 좋아요 등)
// DB 제약 위반(Prisma P2002)과 달리 서비스 레이어에서 직접 던진다
class ConflictError extends AppError {
  constructor(message = '요청을 처리할 수 없는 상태입니다.') {
    super(message, 409, 'CONFLICT');
  }
}

export {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
};
