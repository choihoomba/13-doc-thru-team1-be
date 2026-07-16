Prisma seed 데이터 가이드

이 디렉터리의 JSON 파일은 `prisma/schema.prisma`의 모델에 대응하는 개발·테스트용 고정 데이터입니다.

JSON 표준은 주석을 지원하지 않으므로 JSON 내부에는 `_comment` 같은 설명용 필드를 추가하지 않습니다. Prisma 스키마에 없는 필드가 `createMany()`에 전달되면 seed가 실패할 수 있기 때문에 파일별 역할, 필드 규칙과 관계는 이 문서에서 관리합니다.

## 데이터 구성

| 파일                  | Prisma 모델     | 건수 | 역할                                                  |
| --------------------- | --------------- | ---: | ----------------------------------------------------- |
| `users.json`          | `User`          |   12 | 관리자/일반 사용자, GENERAL/EXPERT 등급과 테스트 계정 |
| `challenges.json`     | `Challenge`     |   18 | 챌린지 검색·필터, 승인 상태, 마감, 정원과 신청자      |
| `participations.json` | `Participation` |   53 | 사용자의 챌린지 참여, 포기 및 참여 이력               |
| `submissions.json`    | `Submission`    |   47 | 작성 중 작업물, 최종 제출과 최다 추천 작업물          |
| `drafts.json`         | `Draft`         |    7 | 최종 제출 전 임시 저장 내용과 제목                    |
| `feedbacks.json`      | `Feedback`      |   50 | 제출 작업물에 작성된 피드백                           |
| `likes.json`          | `Like`          |  102 | 작업물 추천 수와 최다 추천 작업물 계산                |
| `notifications.json`  | `Notification`  |   10 | 사용자별 알림 유형과 읽음/안 읽음 상태                |

총 299건의 데이터를 제공합니다.

## 파일별 역할과 관계

### `users.json`

`User` 모델에 대응하는 계정 데이터입니다.

주요 필드:

- `email`: 로그인 식별자이며 고유 값입니다.
- `nickname`: 화면에 표시되는 사용자 이름입니다.
- `password`: JSON에서는 자리표시자를 사용합니다. 실제 DB 저장 전 `prisma/seed.js`가 테스트 비밀번호를 bcrypt로 해시해 덮어씁니다.
- `role`: `ADMIN`, `USER` 권한을 포함합니다.
- `grade`: `GENERAL`, `EXPERT` 등급을 포함합니다.
- `topLikedCount`: 최다 추천 작업물 선정 횟수 캐시입니다.
- `refreshToken`: 초기 seed에서는 `null`입니다.

User는 Challenge, Participation, Submission, Draft, Feedback, Like, Notification의 사용자 기준 모델입니다.

### `challenges.json`

`Challenge` 모델에 대응하는 챌린지 데이터입니다.

주요 필드:

- `field`: `NEXTJS`, `REACT`, `MODERNJS`, `TYPESCRIPT`, `API`, `WEB`, `CAREER` enum을 사용합니다.
- `docType`: `OFFICIAL`, `BLOG`, `BOOK`, `ETC` enum을 사용합니다.
- `status`: `PENDING`, `APPROVED`, `REJECTED`, `DELETED`, `CLOSED` 상태를 포함합니다.
- `maxParticipants`: 최대 참여 인원입니다.
- `currentParticipants`: `ACTIVE` 상태인 실제 Participation 수와 일치해야 합니다.
- `reason`: 거절 또는 삭제 사유입니다.
- `deletedAt`: 삭제되지 않은 챌린지는 `null`입니다.
- `userId`: 챌린지 신청자이며 `User.id`를 참조합니다.

관계:

```text
Challenge.userId → User.id
```

### `participations.json`

`Participation` 모델에 대응하는 사용자와 챌린지의 참여 관계입니다.

주요 필드:

- `status`: `ACTIVE`, `DROPPED`, `REMOVED` 중 하나입니다.
- `userId`: 참여 사용자이며 `User.id`를 참조합니다.
- `challengeId`: 참여 챌린지이며 `Challenge.id`를 참조합니다.

한 사용자는 같은 챌린지에 한 번만 참여할 수 있습니다.

```text
Participation(userId, challengeId) unique
```

### `submissions.json`

`Submission` 모델에 대응하는 번역 작업물입니다.

주요 필드:

- `content`: 빈 문자열이면 작성 중이며, 값이 있으면 최종 제출 작업물로 사용합니다.
- `deletedAt`: 삭제되지 않은 작업물은 `null`입니다.
- `isTopSubmission`: 챌린지 종료 시 최다 추천 작업물 여부입니다.
- `participationId`: 작업물의 참여 이력이며 `Participation.id`를 참조합니다.
- `challengeId`: 작업물이 속한 챌린지이며 `Challenge.id`를 참조합니다.
- `userId`: 작업물 작성자이며 `User.id`를 참조합니다.

한 Participation에는 Submission이 최대 한 개만 연결됩니다.

```text
Submission.participationId unique
```

`Submission.challengeId`와 `Submission.userId`는 연결된 Participation의 `challengeId`, `userId`와 일치해야 합니다.

### `drafts.json`

`Draft` 모델에 대응하는 임시 저장 데이터입니다.

주요 필드:

- `title`: 임시 저장 제목이며 `null`을 허용합니다.
- `content`: 임시 저장된 작업 내용입니다.
- `submissionId`: 작성 중인 Submission을 참조합니다.
- `userId`: Draft 작성자를 참조합니다.

Draft는 아직 최종 제출하지 않은 빈 `Submission.content`에만 연결됩니다. Draft 작성자는 해당 Submission의 참여 사용자와 같아야 합니다.

한 Submission에는 Draft가 최대 한 개만 연결됩니다.

```text
Draft.submissionId unique
```

### `feedbacks.json`

`Feedback` 모델에 대응하는 피드백 데이터입니다.

관계:

```text
Feedback.submissionId → Submission.id
Feedback.userId → User.id
```

피드백은 내용이 있는 최종 제출 작업물에만 연결합니다.

### `likes.json`

`Like` 모델에 대응하는 작업물 추천 데이터입니다.

관계:

```text
Like.submissionId → Submission.id
Like.userId → User.id
```

동일한 사용자가 서로 다른 작업물에 추천하는 것은 허용합니다. 동일한 사용자가 같은 작업물을 중복 추천하는 것은 허용하지 않습니다.

```text
Like(userId, submissionId) unique
```

Seed 데이터에는 자기 작업물 추천과 중복 추천이 없습니다.

### `notifications.json`

`Notification` 모델에 대응하는 사용자 알림 데이터입니다.

주요 필드:

- `type`: `CONTENT_CHANGED`, `STATUS_CHANGED`, `NEW_SUBMISSION`, `NEW_FEEDBACK`, `DEADLINE` 중 하나입니다.
- `targetType`: `CHALLENGE`, `SUBMISSION`, `FEEDBACK` 중 하나입니다.
- `targetId`: `targetType`에 해당하는 모델의 ID입니다.
- `isRead`: 알림 읽음 여부입니다.
- `userId`: 알림 수신 사용자입니다.

`targetType + targetId`는 DB 외래키가 아닌 다형 참조이므로 `validate-prisma-seed.mjs`에서 대상 존재 여부를 검증합니다.

## 전체 관계 구조

```text
User (1) ──< Challenge

User (1) ──< Participation >── (1) Challenge
                    │
                    └── (0..1) Submission
                                  ├── (0..1) Draft ──> User
                                  ├── (0..N) Feedback ──> User
                                  └── (0..N) Like ──> User

Submission ──> Challenge
Submission ──> User

User (1) ──< Notification
Notification ── targetType + targetId ──> Challenge | Submission | Feedback
```

## 공통 필드 규칙

- 모든 `id` 및 외래키 값은 양의 정수입니다.
- `createdAt`, `updatedAt`, `deadline`, `deletedAt`은 JSON에서 ISO 8601 문자열로 관리합니다.
- nullable 날짜 필드는 `null`을 허용합니다.
- `prisma/seed.js`가 JSON 날짜 문자열을 JavaScript `Date` 객체로 변환한 뒤 Prisma에 전달합니다.
- enum 값은 `prisma/schema.prisma`에 정의된 대문자 값을 사용합니다.

## Seed 처리 방식

`prisma/seed.js`는 모델 관계를 보존하기 위해 부모 데이터부터 다음 순서로 생성합니다.

```text
User
→ Challenge
→ Participation
→ Submission
→ Draft
→ Feedback
→ Like
→ Notification
```

기존 데이터를 초기화할 때는 외래키 충돌을 방지하기 위해 반대 순서로 삭제합니다.

```text
Notification
→ Like
→ Feedback
→ Draft
→ Submission
→ Participation
→ Challenge
→ User
```

삭제와 생성은 하나의 Prisma 트랜잭션에서 실행합니다. 중간에 오류가 발생하면 전체 작업을 롤백하여 일부 데이터만 저장되는 상황을 방지합니다.

Seed 데이터는 테스트 관계를 일정하게 유지하기 위해 명시적인 ID를 사용합니다. 데이터 생성 후 PostgreSQL sequence를 각 테이블의 최대 ID 다음으로 보정하므로 이후 API에서 새로운 레코드를 생성해도 ID가 충돌하지 않습니다.

## 테스트 계정

모든 테스트 계정의 비밀번호는 다음과 같습니다.

```text
test1234!
```

JSON에는 평문 비밀번호를 저장하지 않으며, `prisma/seed.js` 실행 시 bcrypt 해시로 교체해 DB에 저장합니다.

대표 계정:

| 목적                          | 이메일              | 권한/등급       |
| ----------------------------- | ------------------- | --------------- |
| 관리자 기능                   | `admin@docsru.dev`  | ADMIN / GENERAL |
| 일반 사용자 전체 흐름         | `jihoon@docsru.dev` | USER / GENERAL  |
| 참여 횟수 EXPERT 조건         | `react@docsru.dev`  | USER / EXPERT   |
| 참여 및 최다 추천 EXPERT 조건 | `docs@docsru.dev`   | USER / EXPERT   |

## Seed 데이터 검증

프로젝트 루트에서 다음 명령을 실행합니다.

```bash
node validate-prisma-seed.mjs
```

검증기는 DB 연결 없이 다음 내용을 확인합니다.

- JSON 배열 구조
- 필수 필드 누락 및 정의되지 않은 추가 필드
- 문자열, 정수, boolean, nullable 타입
- 날짜와 URL 형식
- enum 값
- ID와 복합 unique 중복
- 모델 간 외래키
- ACTIVE 참여자 수와 `currentParticipants`
- 최대 참여 인원 초과 여부
- Submission, Participation, Challenge, User 관계
- Draft 소유자와 미제출 작업물 관계
- Feedback과 Like 대상의 제출 여부
- 중복 추천 및 자기 작업물 추천
- 최다 추천 작업물과 `isTopSubmission`
- `User.topLikedCount`
- GENERAL/EXPERT 등급 조건
- Notification 수신자와 다형 대상

정상적인 경우 다음 메시지와 모델별 데이터 수가 출력됩니다.

```text
Prisma seed validation passed.
```

## Seed 실행 방법

### 1. Prisma 스키마 검사

```bash
npx prisma validate
```

### 2. Prisma Client 생성

```bash
npx prisma generate
```

### 3. DB 연결 확인

`.env`의 `DATABASE_URL`이 개인 로컬 또는 테스트 PostgreSQL을 가리키는지 확인합니다.

기존 migration 적용 상태는 다음 명령으로 확인할 수 있습니다.

```bash
npx prisma migrate status
```

저장소에 존재하는 migration을 로컬 DB에 적용해야 하는 경우 다음 명령을 사용합니다.

```bash
npx prisma migrate deploy
```

### 4. Seed 실행

```bash
node prisma/seed.js
```

정상 완료 시 다음 메시지가 출력됩니다.

```text
Docsru seed completed.
```

### 5. 데이터 확인

```bash
npx prisma studio
```

Prisma Studio에서 모델별 데이터 수와 관계를 확인합니다.

## 주의사항

- `prisma/seed.js`는 관련 테이블의 기존 데이터를 모두 삭제하고 초기 데이터를 다시 생성합니다.
- 운영 DB에서는 절대로 실행하지 않습니다.
- 공용 개발 DB에서 실행하려면 팀원과 먼저 협의해야 합니다.
- 실행 전에 `.env`의 `DATABASE_URL`이 개인 로컬 또는 테스트 DB인지 반드시 확인합니다.
- API 개발 중 생성한 데이터도 seed를 다시 실행하면 삭제됩니다.
- 평소 API 개발 중에는 seed를 반복 실행하지 않고 `npm run dev`로 서버만 실행합니다.
- Seed 데이터는 개발·테스트 환경의 초기 상태를 제공하며 실제 운영 데이터를 대신하지 않습니다.
