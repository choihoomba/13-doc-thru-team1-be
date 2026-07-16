# 독스루 (Doc-thru) - Backend

개발 문서 번역 챌린지 서비스의 백엔드 레포지토리입니다.

## 기술 스택

- Node.js / Express 5
- Prisma 6 / PostgreSQL
- JWT (httpOnly 쿠키, 슬라이딩 세션)
- zod (유효성 검사)
- Swagger (API 문서)

## 로컬 개발 환경 세팅

### 1. 레포 클론 및 패키지 설치

```bash
git clone https://github.com/choihoomba/13-doc-thru-team1-be.git
cd 13-doc-thru-team1-be
npm install
```

### 2. 환경변수 설정

`.env.example`을 복사해서 `.env`를 만들고 값을 채웁니다.

```bash
cp .env.example .env
```

- `DATABASE_URL` — `postgresql://postgres:비밀번호@localhost:5432/생성한_db_이름?schema=public`
- `JWT_SECRET` — 아무 문자열이나 가능 (로컬 전용)
- 나머지는 `.env.example` 값 그대로 사용

### 3. 마이그레이션

```bash
npx prisma migrate dev
```

DB에 테이블이 생성됩니다.

### 4. 서버 실행

```bash
npm run dev
```

`서버가 4000에서 작동하고 있어요!` 가 뜨면 정상입니다.

### 확인

```bash
npx prisma studio
```

브라우저에서 테이블 목록이 보이면 DB 연결이 정상입니다.

API 문서는 서버 실행 후 http://localhost:4000/api-docs 에서 확인할 수 있습니다.

## 스크립트

| 명령어                 | 설명                     |
| ---------------------- | ------------------------ |
| `npm run dev`          | 개발 서버 실행 (nodemon) |
| `npm start`            | 프로덕션 서버 실행       |
| `npm run format`       | Prettier 포맷 적용       |
| `npm run format:check` | 포맷 검사만 실행         |

## 폴더 구조

```
13-doc-thru-team1-be/
├── .github/
│ ├── ISSUE_TEMPLATE/ # 이슈 템플릿
│ └── pull_request_template.md
├── http/
│ └── auth.http # REST Client 요청 테스트 파일
├── prisma/
│ ├── migrations/ # 마이그레이션 이력 (커밋 필수)
│ └── schema.prisma # DB 스키마
├── src/
│ ├── config/
│ │ ├── env.js # zod로 환경변수 검증 후 export
│ │ ├── prisma.js # Prisma 클라이언트 인스턴스 (앱 전체에서 하나만 공유)
│ │ └── swagger.js # swagger-jsdoc 설정, 공통 스키마 정의
│ ├── routes/
│ │ └── auth.route.js # 엔드포인트 정의, 미들웨어 연결
│ ├── controllers/
│ │ └── auth.controller.js # req/res 처리, zod 검증, 서비스 호출
│ ├── services/
│ │ └── auth.service.js # 비즈니스 로직, 트랜잭션
│ ├── repositories/
│ │ └── auth.repository.js # Prisma 쿼리
│ ├── validations/
│ │ └── auth.validation.js # zod 스키마
│ ├── middlewares/
│ │ ├── auth.middleware.js # 인증(JWT 검증 후 req.user 주입) + 인가(권한 체크)
│ │ └── error.middleware.js # 전역 에러 핸들러 (라우터 뒤 마지막에 등록)
│ ├── jobs/
│ │ └── deadline.job.js # node-cron - 챌린지 마감 처리, 최다 추천작 계산, 등급 갱신, 마감 알림
│ ├── utils/
│ │ ├── errors.js # 커스텀 에러 클래스
│ │ ├── token.js # JWT 발급/검증
│ │ └── password.js # bcrypt 해싱/비교
│ ├── app.js # Express 앱 설정 (미들웨어, 라우터 연결)
│ └── server.js # 서버 실행
├── .env # 개인 환경변수 (커밋 안 됨)
├── .env.example # 환경변수 템플릿
├── .prettierrc
├── .prettierignore
└── package.json
```

## 레이어 구조

Layered Architecture를 적용해 `Router → Controller → Service → Repository` 흐름으로 작성합니다.

| 레이어     | 역할                                         |
| ---------- | -------------------------------------------- |
| Router     | 엔드포인트 정의, 미들웨어 연결               |
| Controller | 요청/응답 처리, zod 유효성 검사, 서비스 호출 |
| Service    | 비즈니스 로직, 트랜잭션                      |
| Repository | Prisma 쿼리                                  |

## 네이밍 컨벤션

파일명은 `{도메인}.{레이어}.js` 형식입니다. (예: `auth.route.js`, `auth.controller.js`)

현재 `auth` 도메인만 예시로 만들어져 있으니, 각자 담당 도메인 파일은 같은 네이밍으로 생성해 주세요.

## 작업 시 참고사항

- **Express 5는 async 함수의 에러를 자동으로 에러 핸들러로 넘겨줍니다.** `asyncHandler` 래퍼나 `try-catch { next(err) }`가 필요 없습니다. Express 4 기준 자료를 참고하실 때 주의해 주세요.
- 에러는 `utils/errors.js`의 커스텀 에러 클래스를 서비스 레이어에서 throw하면, 전역 에러 핸들러가 상태 코드와 응답을 만듭니다. 컨트롤러마다 try-catch로 응답을 만들 필요 없습니다.
- 라우터는 `routes/index.js` 없이 `app.js`에서 직접 연결합니다.
- 환경변수는 `config/env.js`에서 검증 후 export하므로, `process.env`를 직접 읽지 않고 `env` 객체를 import해서 사용합니다.
- 스키마를 수정하면 `npx prisma migrate dev` 실행 후 생성된 마이그레이션 파일도 함께 커밋해야 합니다. 안 그러면 팀원들의 로컬 DB가 어긋납니다.
- Prettier 확장을 설치하고 저장 시 자동 포맷을 켜주세요. 프로젝트에 Prettier가 설치되어 있어 `.prettierrc` 설정을 자동으로 따릅니다.
