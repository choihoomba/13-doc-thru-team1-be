// src/config/env.js
// -----------------------------------------------------------
// 환경변수 검증 및 export
//
// 서버가 뜨는 시점에 .env 값을 zod로 검증하고, 하나라도 없거나
// 형식이 틀리면 즉시 프로세스를 종료합니다.
// 검증 없이 두면 process.env.JWT_SECRET이 undefined인 채로 서버가 뜨고,
// 나중에 로그인 요청이 들어왔을 때야 엉뚱한 에러가 나서 원인 추적이 어렵습니다.
//
// 다른 파일에서는 process.env를 직접 읽지 말고 이 파일의 env 객체를
// import해서 사용해야 검증이 의미를 갖습니다.
// -----------------------------------------------------------
import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(4000), // 기본값 3000 -> 4000 (프론트 Next.js와 포트 충돌 방지)
  DATABASE_URL: z.string().min(1, 'DATABASE_URL은 필수입니다'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET은 필수입니다'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CLIENT_URL: z.url('CLIENT_URL은 올바른 URL이어야 합니다'), // cors origin 설정에 사용
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // console.log -> console.error (에러 상황이므로 stderr로 출력)
  console.error('환경변수 검증 실패\n' + z.prettifyError(parsed.error));
  process.exit(1);
}

const env = parsed.data;
export default env;
