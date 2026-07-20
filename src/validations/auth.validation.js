import { z } from 'zod';

export const signupSchema = z.object(
  {
    email: z
      .email('올바른 이메일 형식이 아닙니다.')
      .max(254, '이메일은 254자 이하여야 합니다.'),
    password: z
      .string('password는 필수 값 입니다.')
      .min(8, '비밀번호는 8자 이상이어야 합니다.')
      .max(64, '비밀번호는 64자 이하여야 합니다.'),
    nickname: z
      .string('nickname은 필수 값 입니다.')
      .min(2, '닉네임은 2자 이상이어야 합니다.')
      .max(12, '닉네임은 12자 이하여야 합니다.'),
  },
  { message: '요청 본문이 올바르지 않습니다.' }
);

export const signinSchema = z.object(
  {
    email: z.email('올바른 이메일 형식이 아닙니다.'),
    password: z
      .string('password는 필수 값 입니다.')
      .min(1, '비밀번호를 입력해주세요.'),
  },
  { message: '요청 본문이 올바르지 않습니다.' }
);
