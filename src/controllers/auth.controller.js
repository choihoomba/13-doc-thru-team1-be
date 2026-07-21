import * as authService from '../services/auth.service.js';
import env from '../config/env.js';
import { signinSchema, signupSchema } from '../validations/auth.validation.js';
import ms from 'ms';

const isProd = env.NODE_ENV === 'production';

const accessCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  maxAge: ms(env.JWT_ACCESS_EXPIRES_IN), // 토큰 만료와 동일 (env 기준)
};

const refreshCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  maxAge: ms(env.JWT_REFRESH_EXPIRES_IN), // 토큰 만료와 동일 (env 기준)
};

// 쿠키 심을 때 옵션을 줬기 때문에 동일한 쿠키로 인식시키기 위해 지울 때도 넣음
const clearCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  // maxAge는 쿠키 식별에 사용 되지 않음 오히려 방해됨
};

export async function signup(req, res) {
  const data = signupSchema.parse(req.body); // 검증 실패 시 에러핸들러로
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
