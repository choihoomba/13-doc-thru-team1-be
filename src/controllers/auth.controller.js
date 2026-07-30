import * as authService from '../services/auth.service.js';
import env from '../config/env.js';
import { signinSchema, signupSchema } from '../validations/auth.validation.js';
import ms from 'ms';

const isProd = env.NODE_ENV === 'production';

const accessCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  // JWT 자체(accessToken)는 짧게(예: 15m) 만료되지만, 쿠키까지 그와 같이
  // 만료되면 JWT가 죽는 순간 쿠키도 사라져서 서버가 "쿠키 없음"으로만
  // 판단(UNAUTHORIZED)하고 "만료된 토큰"(TOKEN_EXPIRED)으로 판단할 기회를
  // 잃음 - refresh 트리거 자체가 불가능해짐.
  // 쿠키는 refreshToken과 같은 기간 살려두고, 실제 인증 유효성은 매 요청마다
  // JWT 자체 검증(verifyToken)에 맡긴다. 활동이 이어지는 한 refresh가 계속
  // 성공하며 세션이 연장되고(슬라이딩 세션), refreshToken까지 만료되면
  // 그때 정상적으로 재로그인이 요구된다.
  maxAge: ms(env.JWT_REFRESH_EXPIRES_IN),
};

const refreshCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  maxAge: ms(env.JWT_REFRESH_EXPIRES_IN),
};

// 쿠키 심을 때 옵션을 줬기 때문에 동일한 쿠키로 인식시키기 위해 지울 때도 넣음
const clearCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  // maxAge는 쿠키 식별에 사용 되지 않음 오히려 방해됨
};

export async function signup(req, res) {
  const data = signupSchema.parse(req.body);
  const user = await authService.signup(data);
  res.status(201).json({ success: true, data: user });
}

export async function signin(req, res) {
  const data = signinSchema.parse(req.body);
  const { user, accessToken, refreshToken } = await authService.signin(data);

  res
    .cookie('accessToken', accessToken, accessCookieOptions)
    .cookie('refreshToken', refreshToken, refreshCookieOptions)
    .status(200)
    .json({ success: true, data: user });
}

export async function getMe(req, res) {
  const user = await authService.getMe(req.user.userId);

  res.status(200).json({ success: true, data: user });
}

export async function signout(req, res) {
  await authService.signout(req.user.userId);

  res
    .clearCookie('accessToken', clearCookieOptions)
    .clearCookie('refreshToken', clearCookieOptions)
    .status(200)
    .json({ success: true });
}

export async function refresh(req, res) {
  const { accessToken, refreshToken } = await authService.refresh(
    req.cookies.refreshToken
  );

  res
    .cookie('accessToken', accessToken, accessCookieOptions)
    .cookie('refreshToken', refreshToken, refreshCookieOptions)
    .status(200)
    .json({ success: true });
}
