<div align="center">

# 📚 독스루 (Doc-thru) — Backend

### 개발 문서 번역 챌린지 서비스 · 백엔드 저장소

코드잇 스프린트 중급 프로젝트 1팀

[📎 팀 협업 문서 바로가기](https://app.notion.com/p/ee2ff2372bbe834e851981e19d3a36f7?v=867ff2372bbe82f0a94408ae3e00529b)

</div>

<br>

개발 문서를 함께 번역하고, 작업물에 피드백과 추천을 주고받을 수 있는 **개발 문서 번역 챌린지 서비스 독스루(Doc-thru)의 백엔드 저장소**입니다.

사용자 인증부터 챌린지 신청 · 승인 · 참여, 작업물과 임시저장, 피드백 · 추천, 알림 및 챌린지 마감 자동화까지 서비스에 필요한 API와 비즈니스 로직을 제공합니다.

<br>

## 📑 목차

- [Dev](#-dev)
- [주요 기능](#-주요-기능)
- [기술 스택](#-기술-스택)
- [사용 라이브러리](#-사용-라이브러리)
- [아키텍처](#-아키텍처)
- [ER Diagram](#-er-diagram)
- [로컬 개발 환경 세팅](#-로컬-개발-환경-세팅)
- [API 문서](#-api-문서)
- [공통 응답 형식](#-공통-응답-형식)
- [스크립트](#-스크립트)
- [폴더 구조](#-폴더-구조)
- [레이어 구조](#-레이어-구조)
- [네이밍 컨벤션](#-네이밍-컨벤션)
- [작업 시 참고사항](#-작업-시-참고사항)
- [배포](#-배포)

<br>

## 👥 Dev

백엔드 README이므로 팀 직책과 백엔드 담당 업무를 중심으로 정리했습니다.

| 팀원         | 역할                  | 백엔드 담당 및 주요 구현                                                                    |
| ------------ | --------------------- | ------------------------------------------------------------------------------------------- |
| 🦖 최훈민 👑 | 팀장 · Backend Master | 초기 설정 · 공통 인프라, Auth API, JWT 쿠키 · 슬라이딩 세션, 마감 cron job, 배포 · 헬스체크 |
| 🐧 김지훈    | 부팀장                | Seed 데이터 · 검증 로직, Challenge 신청 · 수정 API, Challenge API 통합, Notification API    |
| 💨 한효주    | Frontend Master       | Participation API, 도전 · 포기 · 재도전 처리, 참여 인원 변경 트랜잭션                       |
| 🙈 곽서현    | 노션 서기             | Submission API, 작업물 목록 · 상세 · 수정 · 삭제, Draft API 임시저장 Upsert                 |
| 🐯 하성휘    | Developer             | Custom Error · 전역 Error Handler, Feedback API 커서 페이지네이션, Like API 중복 방지       |
| 🦴 전현선    | Developer             | Challenge 목록 조회 API, 검색 · 필터 · 정렬 Query String, Swagger 문서 · README 작성        |
| 🪴 채지훈    | Developer             | Challenge API 공동 개발, 내가 신청한 챌린지 조회, 상세 · 신청 관리 협업                     |

> 📌 Prisma 스키마 · ER Diagram은 전원이 공동 설계했습니다.

<br>

## ✨ 주요 기능

| 도메인            | 주요 기능                                                                                       |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| **Auth**          | 회원가입, 로그인, 로그아웃, 내 정보 조회, Access/Refresh Token 갱신                             |
| **Challenge**     | 공개 · 참여 중 · 완료 · 내 신청 · 관리자 목록, 상세 조회, 신청, 수정, 승인 · 거절 · 취소 · 삭제 |
| **Participation** | 챌린지 도전, 참여 포기, 재도전, 참여 인원 동시성 처리                                           |
| **Submission**    | 작업물 목록 · 상세 조회, 제출 · 수정, 사용자 초기화, 관리자 삭제                                |
| **Draft**         | 작업물 임시저장 생성 · 수정(Upsert), 임시저장 삭제                                              |
| **Feedback**      | 피드백 목록, 작성, 수정, 삭제, 커서 기반 페이지네이션                                           |
| **Like**          | 작업물 추천 및 추천 취소, 중복 추천 방지                                                        |
| **Notification**  | 사용자별 알림 조회, 읽음 처리, 도메인 이벤트 기반 내부 알림 생성                                |
| **Scheduler**     | 매일 KST 자정 챌린지 마감, 최다 추천 작업물 · 사용자 등급 계산, 마감 알림 생성                  |

<br>

## 🛠 기술 스택

| 분류              | 기술                  | 선택 이유                                                                                                                                                                                                                                                |
| ----------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime / Server  | Node.js / Express 5   | 프론트와 백엔드의 JavaScript 스택을 통일하고 팀의 러닝 커브를 낮추기 위해 선택했습니다. Express 5의 비동기 오류 전달 기능을 활용합니다.                                                                                                                  |
| ORM / Database    | Prisma 6 / PostgreSQL | 타입 안정성과 마이그레이션 관리 편의성을 확보하고, Challenge · Participation · Submission 중심의 관계형 데이터 구조를 표현하기 위해 사용합니다. 현재 프로젝트는 JavaScript 환경이며 Prisma 7 업그레이드 안정성 검증 범위를 고려해 Prisma 6을 사용합니다. |
| Authentication    | JWT / HttpOnly Cookie | 토큰을 `localStorage`에 저장할 때 발생할 수 있는 XSS 노출 위험을 줄이기 위해 HttpOnly 쿠키를 사용합니다. Access/Refresh Token을 분리하고 Refresh Token을 회전하는 슬라이딩 세션 방식을 적용했습니다.                                                     |
| Validation        | Zod 4                 | TypeScript를 사용하지 않는 환경에서도 요청값과 환경변수를 런타임에 검증할 수 있고, 프론트 · 백엔드가 익숙한 동일한 스키마 문법을 사용할 수 있어 선택했습니다.                                                                                            |
| API Documentation | Swagger / OpenAPI 3.0 | 7명의 팀원이 API 요청 · 응답 형식과 인증 조건을 일관되게 공유할 수 있도록 사용합니다.                                                                                                                                                                    |
| Scheduler         | node-cron             | Redis나 외부 스케줄러 없이 단일 서버 내부에서 챌린지 마감 배치를 실행하기 위해 사용합니다.                                                                                                                                                               |
| Password Security | bcrypt                | 비밀번호 원문을 저장하지 않고 검증된 단방향 해시 알고리즘으로 저장하기 위해 사용합니다.                                                                                                                                                                  |

<br>

## 📦 사용 라이브러리

현재 `package.json`을 기준으로 작성했습니다.

<details>
<summary>Dependencies</summary>

| 라이브러리           |      버전 | 용도                                    |
| -------------------- | --------: | --------------------------------------- |
| `express`            |  `^5.2.1` | HTTP 서버 및 REST API 라우팅            |
| `@prisma/client`     | `^6.19.3` | PostgreSQL ORM Client                   |
| `zod`                |  `^4.4.3` | 요청값 및 환경변수 검증                 |
| `jsonwebtoken`       |  `^9.0.3` | Access/Refresh JWT 발급 및 검증         |
| `bcrypt`             |  `^6.0.0` | 사용자 비밀번호 해싱 및 비교            |
| `cookie-parser`      |  `^1.4.7` | HttpOnly 인증 쿠키 파싱                 |
| `cors`               |  `^2.8.6` | 프론트 · 백엔드 간 Credential 요청 허용 |
| `dotenv`             | `^17.4.2` | `.env` 환경변수 로드                    |
| `morgan`             | `^1.11.0` | 개발 환경 HTTP 요청 로그                |
| `ms`                 |  `^2.1.3` | JWT 만료 문자열을 쿠키 `maxAge`로 변환  |
| `node-cron`          |  `^4.6.0` | KST 기준 챌린지 마감 스케줄 실행        |
| `swagger-jsdoc`      |  `^6.3.0` | OpenAPI 명세 생성                       |
| `swagger-ui-express` |  `^5.0.1` | Swagger UI 제공                         |

</details>

<details>
<summary>Dev Dependencies</summary>

| 라이브러리 |      버전 | 용도                                    |
| ---------- | --------: | --------------------------------------- |
| `prisma`   | `^6.19.3` | Prisma Schema, Migration 및 Client 생성 |
| `nodemon`  | `^3.1.14` | 개발 중 파일 변경 감지 및 서버 재시작   |
| `prettier` |  `^3.9.5` | 코드 포맷 통일                          |

</details>

> 테스트는 별도 테스트 프레임워크 대신 Node.js 기본 `node:test`와 `node:assert`를 사용합니다.

<br>

## 🏗 아키텍처

Layered Architecture를 적용해 다음 흐름으로 요청을 처리합니다.

```text
Client
  ↓
Express Middleware
  ├── CORS
  ├── JSON / Cookie Parser
  ├── JWT Authentication
  └── Morgan
  ↓
Router
  ↓
Controller
  ├── Params / Query / Body 추출
  └── Zod Validation
  ↓
Service
  ├── 비즈니스 규칙
  ├── 권한 및 상태 검사
  └── Prisma Transaction
  ↓
Repository
  ↓
Prisma Client
  ↓
PostgreSQL
```

예외는 각 Controller에서 직접 응답하지 않고 전역 오류 처리 흐름으로 전달합니다.

```text
Service / Repository Error
  ↓
Custom Error 또는 Prisma Error
  ↓
Global Error Middleware
  ↓
공통 Error Response
```

챌린지 마감 작업은 일반 HTTP 요청과 별도로 동작합니다.

```text
node-cron(KST 매일 00:00)
  ↓
Deadline Job
  ↓
Prisma Transaction
  ├── Challenge CLOSED 처리
  ├── 최다 추천 작업물 계산
  ├── 사용자 등급 재계산
  └── 마감 알림 생성
```

<br>

## 🗂 ER Diagram

주요 관계는 다음과 같습니다.

```text
User (1) ──< Challenge

User (1) ──< Participation >── (1) Challenge
                    │
                    └── (0..1) Submission
                                  ├── (0..1) Draft
                                  ├── (0..N) Feedback
                                  └── (0..N) Like

User (1) ──< Notification
```

<br>

## 🚀 로컬 개발 환경 세팅

### 1. 사전 준비

- Node.js
- npm
- PostgreSQL

### 2. Repository Clone 및 패키지 설치

```bash
git clone https://github.com/choihoomba/13-doc-thru-team1-be.git
cd 13-doc-thru-team1-be
npm install
```

### 3. 환경변수 설정

`.env.example`을 복사해 `.env` 파일을 생성합니다.

```bash
cp .env.example .env
```

```env
PORT=4000
DATABASE_URL=postgresql://postgres:비밀번호@localhost:5432/DB이름?schema=public
NODE_ENV=development

JWT_ACCESS_SECRET=Access_Token_Secret
JWT_REFRESH_SECRET=Refresh_Token_Secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

CLIENT_URL=http://localhost:3000
SERVER_URL=http://localhost:4000
```

| 환경변수                 | 설명                                 |
| ------------------------ | ------------------------------------ |
| `PORT`                   | 백엔드 서버 포트, 기본값 `4000`      |
| `DATABASE_URL`           | PostgreSQL 연결 URL                  |
| `NODE_ENV`               | `development` 또는 `production`      |
| `JWT_ACCESS_SECRET`      | Access Token 서명 키                 |
| `JWT_REFRESH_SECRET`     | Refresh Token 서명 키                |
| `JWT_ACCESS_EXPIRES_IN`  | Access Token 만료 시간, 기본값 `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh Token 만료 시간, 기본값 `7d` |
| `CLIENT_URL`             | CORS에서 허용할 프론트엔드 URL       |
| `SERVER_URL`             | Swagger 등 백엔드 자체 접근 URL      |

> 환경변수는 [src/config/env.js](src/config/env.js)에서 Zod로 검증합니다. 다른 파일에서 `process.env`를 직접 사용하지 않고 검증된 `env` 객체를 사용합니다.

### 4. 데이터베이스 마이그레이션

```bash
npx prisma migrate dev
```

### 5. Seed 데이터 생성

```bash
npm run seed
```

> ⚠️ `npm run seed`는 기존 User, Challenge, Participation, Submission, Draft, Feedback, Like, Notification 데이터를 삭제한 다음 고정 데이터를 다시 생성합니다. 개인 개발용 DB에서만 실행해주세요.

테스트 계정의 공통 비밀번호는 다음과 같습니다.

```text
test1234!
```

> 자세한 Seed 데이터 구성은 [prisma/data/README.md](prisma/data/README.md)에서 확인할 수 있습니다.

### 6. 개발 서버 실행

```bash
npm run dev
```

```text
서버가 정상적으로 작동하고 있어요! http://localhost:4000
Swagger: http://localhost:4000/api-docs
```

### 7. 연결 확인

**Health Check**

```http
GET http://localhost:4000/health
```

```json
{
  "success": true,
  "status": "ok"
}
```

**Prisma Studio**

```bash
npx prisma studio
```

<br>

## 📘 API 문서

서버 실행 후 다음 주소에서 Swagger 문서를 확인할 수 있습니다.

- Swagger UI: [http://localhost:4000/api-docs](http://localhost:4000/api-docs)
- Health Check: [http://localhost:4000/health](http://localhost:4000/health)

> Challenge API의 화면별 조회 조건, Query String, 상태 전이 및 알림 연동은 [src/docs/challenge-api-guide.md](src/docs/challenge-api-guide.md)에서 자세히 확인할 수 있습니다.

<details>
<summary>주요 Endpoint 전체 보기</summary>

| 도메인        | Method   | Endpoint                               | 설명                                  |
| ------------- | -------- | -------------------------------------- | ------------------------------------- |
| Health        | `GET`    | `/health`                              | 서버 상태 확인                        |
| Auth          | `POST`   | `/auth/signup`                         | 회원가입                              |
| Auth          | `POST`   | `/auth/signin`                         | 로그인                                |
| Auth          | `GET`    | `/auth/me`                             | 로그인 사용자 정보                    |
| Auth          | `POST`   | `/auth/signout`                        | 로그아웃                              |
| Auth          | `POST`   | `/auth/refresh`                        | Access/Refresh Token 갱신             |
| Challenge     | `GET`    | `/challenges`                          | 화면별 챌린지 목록 조회               |
| Challenge     | `POST`   | `/challenges`                          | 챌린지 신청                           |
| Challenge     | `GET`    | `/challenges/:id`                      | 챌린지 상세 조회                      |
| Challenge     | `PATCH`  | `/challenges/:id`                      | 신청 취소, 승인 · 거절 또는 정보 수정 |
| Challenge     | `DELETE` | `/challenges/:id`                      | 관리자 챌린지 삭제                    |
| Participation | `POST`   | `/participations`                      | 챌린지 도전                           |
| Participation | `PATCH`  | `/participations/:id`                  | 챌린지 참여 포기                      |
| Submission    | `GET`    | `/submissions`                         | 작업물 목록 조회                      |
| Submission    | `GET`    | `/submissions/:id`                     | 작업물 상세 조회                      |
| Submission    | `PATCH`  | `/submissions/:id`                     | 작업물 제출 · 수정                    |
| Submission    | `DELETE` | `/submissions/:id`                     | 작업물 삭제 또는 내용 초기화          |
| Draft         | `PUT`    | `/drafts/:id`                          | 작업물 임시저장 Upsert                |
| Draft         | `DELETE` | `/drafts/:id`                          | 임시저장 삭제                         |
| Feedback      | `GET`    | `/submissions/:submissionId/feedbacks` | 피드백 목록 조회                      |
| Feedback      | `POST`   | `/submissions/:submissionId/feedbacks` | 피드백 작성                           |
| Feedback      | `PATCH`  | `/feedbacks/:feedbackId`               | 피드백 수정                           |
| Feedback      | `DELETE` | `/feedbacks/:feedbackId`               | 피드백 삭제                           |
| Like          | `POST`   | `/submissions/:submissionId/likes`     | 작업물 추천                           |
| Like          | `DELETE` | `/submissions/:submissionId/likes`     | 작업물 추천 취소                      |
| Notification  | `GET`    | `/notifications`                       | 내 알림 목록 조회                     |
| Notification  | `PATCH`  | `/notifications/:id/read`              | 알림 읽음 처리                        |

</details>

> 회원가입, 로그인, 토큰 갱신 및 Health Check를 제외한 주요 API는 HttpOnly Cookie의 `accessToken` 인증이 필요합니다.

<br>

## 📤 공통 응답 형식

**성공 응답**

```json
{
  "success": true,
  "data": {}
}
```

**실패 응답**

```json
{
  "success": false,
  "message": "오류 메시지",
  "code": "ERROR_CODE"
}
```

<details>
<summary>대표 오류 코드 전체 보기</summary>

| HTTP Status | Code                    | 의미                                   |
| ----------: | ----------------------- | -------------------------------------- |
|       `400` | `VALIDATION_ERROR`      | Zod 요청값 검증 실패                   |
|       `400` | `BAD_REQUEST`           | 잘못된 요청 또는 참조값                |
|       `401` | `UNAUTHORIZED`          | 인증 정보 없음 또는 유효하지 않은 토큰 |
|       `401` | `TOKEN_EXPIRED`         | Access Token 만료                      |
|       `401` | `REFRESH_EXPIRED`       | Refresh Token 만료                     |
|       `403` | `FORBIDDEN`             | 접근 권한 또는 소유권 부족             |
|       `404` | `NOT_FOUND`             | 리소스를 찾을 수 없음                  |
|       `409` | `CONFLICT`              | 현재 상태와 요청이 충돌                |
|       `500` | `INTERNAL_SERVER_ERROR` | 예상하지 못한 서버 오류                |

</details>

<br>

## 📜 스크립트

| 명령어                   | 설명                            |
| ------------------------ | ------------------------------- |
| `npm run dev`            | nodemon으로 개발 서버 실행      |
| `npm start`              | 프로덕션 서버 실행              |
| `npm run seed:validate`  | Seed JSON 데이터와 관계 검증    |
| `npm run seed`           | Seed 검증 후 개발 데이터 재생성 |
| `npm run test:challenge` | Challenge 통합 API 테스트       |
| `npm run format`         | Prettier 포맷 적용              |
| `npm run format:check`   | 파일을 변경하지 않고 포맷 검사  |

<br>

## 📁 폴더 구조

<details>
<summary>전체 폴더 구조 보기</summary>

```text
13-doc-thru-team1-be/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   └── issue-template.md
│   └── PULL_REQUEST_TEMPLATE.md
├── http/
│   ├── auth.http
│   ├── challenge.http
│   ├── draft.http
│   ├── feedback.http
│   ├── like.http
│   ├── notification.http
│   ├── participation.http
│   ├── submission.http
│   └── total.http
├── prisma/
│   ├── data/
│   │   ├── README.md
│   │   ├── users.json
│   │   ├── challenges.json
│   │   ├── participations.json
│   │   ├── submissions.json
│   │   ├── drafts.json
│   │   ├── feedbacks.json
│   │   ├── likes.json
│   │   └── notifications.json
│   ├── migrations/
│   ├── schema.prisma
│   ├── seed.js
│   └── validate-seed.mjs
├── src/
│   ├── config/
│   │   ├── env.js
│   │   ├── prisma.js
│   │   └── swagger.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── challenge.controller.js
│   │   ├── draft.controller.js
│   │   ├── feedback.controller.js
│   │   ├── like.controller.js
│   │   ├── notification.controller.js
│   │   ├── participations.controller.js
│   │   └── submission.controller.js
│   ├── docs/
│   │   ├── challenge-api-guide.md
│   │   └── *.swagger.js
│   ├── jobs/
│   │   ├── deadline.job.js
│   │   └── scheduler.js
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   └── error.middleware.js
│   ├── repositories/
│   │   ├── challenge.repository.js
│   │   ├── draft.repository.js
│   │   ├── feedback.repository.js
│   │   ├── like.repository.js
│   │   ├── notification.repository.js
│   │   ├── participations.repository.js
│   │   ├── submission.repository.js
│   │   └── user.repository.js
│   ├── routes/
│   │   ├── auth.route.js
│   │   ├── challenge.route.js
│   │   ├── draft.route.js
│   │   ├── feedback.route.js
│   │   ├── like.route.js
│   │   ├── notification.route.js
│   │   ├── participations.route.js
│   │   └── submission.route.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── challenge.service.js
│   │   ├── draft.service.js
│   │   ├── feedback.service.js
│   │   ├── like.service.js
│   │   ├── notification.service.js
│   │   ├── participations.service.js
│   │   └── submission.service.js
│   ├── utils/
│   │   ├── challenge.js
│   │   ├── errors.js
│   │   ├── password.js
│   │   └── token.js
│   ├── validations/
│   │   ├── auth.validation.js
│   │   ├── challenge.validation.js
│   │   ├── draft.validation.js
│   │   ├── feedback.validation.js
│   │   ├── like.validation.js
│   │   ├── notification.validation.js
│   │   ├── participations.validation.js
│   │   └── submission.validation.js
│   ├── app.js
│   └── server.js
├── tests/
│   └── challenge.api.test.js
├── .env
├── .env.example
├── .gitignore
├── .prettierignore
├── .prettierrc
├── package-lock.json
├── package.json
└── README.md
```

</details>

### 디렉터리별 역할

| 디렉터리            | 역할                                        |
| ------------------- | ------------------------------------------- |
| `http`              | VS Code REST Client 기반 API 수동 테스트    |
| `prisma/data`       | 개발 · 테스트용 고정 Seed JSON              |
| `prisma/migrations` | PostgreSQL Schema 변경 이력                 |
| `src/config`        | 환경변수, Prisma Client, Swagger 설정       |
| `src/controllers`   | HTTP 요청 · 응답 처리와 Zod 검증            |
| `src/docs`          | Swagger 명세 및 도메인별 개발 가이드        |
| `src/jobs`          | node-cron 등록 및 챌린지 마감 배치          |
| `src/middlewares`   | 인증 · 인가 및 전역 오류 처리               |
| `src/repositories`  | Prisma 데이터 접근                          |
| `src/routes`        | Endpoint와 Middleware 연결                  |
| `src/services`      | 비즈니스 규칙 및 트랜잭션                   |
| `src/utils`         | 공통 오류, 토큰, 비밀번호, 챌린지 상태 유틸 |
| `src/validations`   | Params, Query, Body Zod Schema              |
| `tests`             | Node.js 기반 API 통합 테스트                |

<br>

## 🧱 레이어 구조

| 레이어     | 역할                                                               |
| ---------- | ------------------------------------------------------------------ |
| Router     | HTTP Method와 Endpoint 정의, 인증 · 인가 Middleware 연결           |
| Controller | Params · Query · Body 추출, Zod 검증, Service 호출, 성공 응답 생성 |
| Service    | 권한 · 소유권 · 상태 전이 등 비즈니스 규칙과 Transaction 처리      |
| Repository | Prisma Query와 데이터 접근                                         |
| Validation | 외부 입력값과 내부 공통 데이터 Schema 검증                         |
| Middleware | JWT 인증 · 관리자 인가 · 전역 오류 응답                            |
| Job        | HTTP 요청과 독립된 예약 작업 처리                                  |

<br>

## 🏷 네이밍 컨벤션

도메인 파일은 기본적으로 `{도메인}.{레이어}.js` 형식을 사용합니다.

```text
challenge.route.js
challenge.controller.js
challenge.service.js
challenge.repository.js
challenge.validation.js
challenge.swagger.js
```

일부 기존 파일은 복수형 이름을 사용합니다.

```text
participations.route.js
participations.controller.js
participations.service.js
participations.repository.js
participations.validation.js
```

> 기존 도메인의 파일명은 불필요하게 변경하지 않고, 신규 도메인은 팀 협의 후 일관된 이름을 사용합니다.

<br>

## 📝 작업 시 참고사항

- Express 5는 비동기 Handler에서 발생한 오류를 전역 오류 Middleware로 자동 전달합니다. 불필요한 `asyncHandler` 또는 반복적인 `try-catch`를 작성하지 않습니다.
- 요청의 Params, Query, Body는 Controller에서 Zod Schema로 검증합니다.
- 비즈니스 규칙과 권한 · 소유권 검사는 Service에서 처리합니다.
- DB 접근은 Repository로 분리하며, 여러 변경이 함께 성공해야 할 때는 Prisma Transaction을 사용합니다.
- 원본 데이터 변경과 Notification 생성은 가능한 한 같은 Transaction에서 처리합니다.
- 인증된 사용자 ID와 역할은 요청 Body가 아니라 `authenticate`가 생성한 `req.user`를 사용합니다.
- 환경변수는 `src/config/env.js`에서 검증하며 다른 파일에서 `process.env`를 직접 읽지 않습니다.
- Prisma Schema를 수정하면 `npx prisma migrate dev`를 실행하고 생성된 Migration 파일을 함께 커밋합니다.
- `npm run seed`는 기존 데이터를 삭제하므로 개인 개발용 DB에서만 실행합니다.
- Challenge의 마감 여부는 cron 반영 전에도 `status`와 실제 `deadline`을 함께 확인합니다.
- `node-cron`은 현재 단일 서버 실행을 기준으로 합니다. 서버를 여러 인스턴스로 확장하면 동일 작업의 중복 실행 방지 전략이 추가로 필요합니다.
- 저장 전 Prettier를 적용하고 PR 전 `npm run format:check`를 실행합니다.

<br>

## 🚢 배포

| 항목               | 주소                                                   |
| ------------------ | ------------------------------------------------------ |
| Production API     | `https://one3-doc-thru-team1-be.onrender.com`          |
| Production Swagger | `https://one3-doc-thru-team1-be.onrender.com/api-docs` |
| Health Check       | `https://one3-doc-thru-team1-be.onrender.com/health`   |

배포 환경에서는 다음 설정을 확인해야 합니다.

- `NODE_ENV=production`
- 프론트 배포 주소를 `CLIENT_URL`에 설정
- 백엔드 배포 주소를 `SERVER_URL`에 설정
- HTTPS 환경에서 인증 쿠키의 `secure: true`, `sameSite: none` 적용
- PostgreSQL 운영 Database URL 설정
- JWT Access/Refresh Secret 분리
