import { verifyToken } from '../utils/token.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';

export function authenticate(req, res, next) {
  const token = req.cookies.accessToken;

  if (!token) {
    return next(new UnauthorizedError('로그인이 필요합니다.'));
  }

  try {
    const payload = verifyToken(token, 'access');
    req.user = { userId: payload.userId, role: payload.role };
    next();
  } catch (err) {
    // verifyToken raw 에러(TokenExpiredError/JsonWebTokenError/type 불일치)를
    // UnauthorizedError로 변환
    // - 만료는 프론트의 refresh 트리거 신호로 써야 하므로 TOKEN_EXPIRED code로 구분
    if (err.name === 'TokenExpiredError') {
      return next(
        new UnauthorizedError('토큰이 만료되었습니다.', 'TOKEN_EXPIRED')
      );
    }
    next(new UnauthorizedError('유효하지 않은 인증 정보입니다.'));
  }
}

// authenticate 없이 잘못 연결된 경우 방어 (정상 흐름에선 req.user 항상 존재)
export function authorize(req, res, next) {
  if (!req.user) {
    return next(new Error('authorize는 authenticate 뒤에 연결되어야 합니다.'));
  }

  if (req.user.role !== 'ADMIN') {
    return next(new ForbiddenError('접근 권한이 없습니다.'));
  }

  next();
}
