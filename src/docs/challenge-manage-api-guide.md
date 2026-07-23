# Challenge 생성·수정 API 작업 가이드

Challenge API를 세 명이 나누어 작업하고 병합하는 전체 규칙은
`src/docs/challenge-api-collaboration-guide.md`를 참고합니다.

Challenge, Submission, Feedback 및 마감 처리에서 알림을 생성하는 공통 규칙은
`src/docs/notification-integration-guide.md`를 참고합니다.

## 담당 범위

이 모듈은 Challenge 리소스 중 다음 두 엔드포인트만 담당합니다.

```http
POST /challenges
PATCH /challenges/:id
```

- `POST /challenges`: 인증된 USER 또는 ADMIN의 신규 챌린지 신청
- `PATCH /challenges/:id`: ADMIN의 진행 중인 챌린지 정보 수정

Challenge 조회, 상세 조회, 삭제는 다른 담당자의 모듈에서 구현합니다.

## 파일 구조

같은 Challenge 리소스를 여러 명이 동시에 작업하므로 담당 기능을 구분하기 위해 파일명에 `manage`를 사용합니다.

```text
src/
├─ routes/challenge-manage.route.js
├─ controllers/challenge-manage.controller.js
├─ services/challenge-manage.service.js
├─ repositories/challenge-manage.repository.js
├─ validations/challenge-manage.validation.js
└─ docs/challenge-manage.swagger.js

http/
└─ challenge-manage.http
```

외부 API 경로에는 `manage`를 추가하지 않습니다. 파일의 담당 범위만 구분하고 기존 API 명세를 유지합니다.

## 요청 처리 구조

교안과 팀 컨벤션의 Layered Architecture를 따릅니다.

```text
Route
→ Controller
→ Service
→ Repository
→ Prisma
→ PostgreSQL
```

- Route: URL, HTTP 메서드, 인증 및 권한 미들웨어 연결
- Controller: params와 body 검증, Service 호출, HTTP 응답 반환
- Service: 상태 확인, 참여 인원 규칙, 트랜잭션 및 알림 처리
- Repository: Prisma를 사용한 DB 접근
- Validation: Zod 요청값 검증
- Swagger: 요청, 응답, 인증 및 오류 명세

## 신규 챌린지 신청

프론트는 신청 정보를 request body로 전달합니다.

```http
POST /challenges
```

서버에서 다음 값을 결정하므로 프론트 입력으로 받지 않습니다.

```text
status: PENDING
currentParticipants: 0
userId: 로그인 사용자 ID
```

신규 신청 시에는 알림을 생성하지 않습니다. 프로젝트 요구사항의 Challenge 알림은 승인, 거절, 삭제, 수정 및 마감과 같은 상태 변화에 대해 생성합니다.

## 관리자 챌린지 수정과 알림

수정 가능한 대상은 `APPROVED` 상태이면서 마감 전인 챌린지입니다.

```http
PATCH /challenges/:id
```

관리자는 수정할 필드와 신청자에게 전달할 수정 사유를 함께 보냅니다.

```json
{
  "maxParticipants": 6,
  "reason": "현재 참여 인원을 확인하고 모집 정원을 유지했습니다."
}
```

`reason`은 수정 알림 문구에 사용합니다. `Challenge.reason`은 거절 사유 용도이므로 수정 사유를 해당 DB 필드에 저장하지 않습니다.

Service는 다음 작업을 하나의 Prisma 트랜잭션으로 처리합니다.

```text
Challenge 정보 수정
→ 신청자에게 CONTENT_CHANGED 알림 생성
→ 둘 다 성공하면 commit
→ 하나라도 실패하면 둘 다 rollback
```

생성되는 알림 값은 다음과 같습니다.

```text
userId: 챌린지를 신청한 사용자 ID
type: CONTENT_CHANGED
targetType: CHALLENGE
targetId: 수정된 챌린지 ID
message: 수정된 챌린지 제목과 관리자 수정 사유
```

Notification Service의 공통 `createNotification()` 함수를 사용하므로 별도의 알림 생성 엔드포인트를 호출하지 않습니다.

## GET API와 프론트 연동

관리자 챌린지 목록 화면에서는 조회 담당자의 API를 사용합니다.

```http
GET /challenges
```

수정 화면에서 특정 챌린지의 현재 입력값을 불러올 때는 목록 API보다 상세 조회 API가 적합합니다.

```http
GET /challenges/:id
```

프론트 수정 흐름은 다음과 같습니다.

```text
GET /challenges/:id
→ 수정 폼의 초기값 표시
→ 관리자가 정보와 수정 사유 입력
→ PATCH /challenges/:id
→ 성공 응답 반영
```

GET 엔드포인트는 이번 생성·수정 모듈에서 중복 구현하지 않습니다. 조회 담당자의 PR이 병합된 뒤 같은 `/challenges` 경로에서 함께 사용합니다.

## 여러 Challenge Router 연결 방법

Express는 서로 다른 Router를 같은 기본 경로에 연결할 수 있습니다.

```js
app.use('/challenges', challengeQueryRouter);
app.use('/challenges', challengeManageRouter);
```

예를 들어 조회 담당 Router는 GET을 등록하고 생성·수정 Router는 POST와 PATCH를 등록합니다.

```text
challengeQueryRouter
├─ GET /
└─ GET /:id

challengeManageRouter
├─ POST /
└─ PATCH /:id
```

HTTP 메서드가 다르므로 같은 `/challenges` 경로를 사용해도 충돌하지 않습니다. 다른 담당자의 Router를 병합할 때 한쪽 Router를 삭제하지 말고 둘 다 `app.js`에 연결해야 합니다.

## 쿼리스트링 사용 여부

POST와 PATCH에는 쿼리스트링이 필요하지 않습니다.

- POST: 생성할 정보를 request body로 전달
- PATCH: 수정할 ID를 path parameter로, 수정 정보를 request body로 전달

목록 조회의 검색, 필터, 탭 구분은 GET 담당자가 query string으로 처리합니다.

```http
GET /challenges?view=participating
GET /challenges?view=completed
GET /challenges?view=applied
```

## 병합 시 확인 사항

1. 최신 `origin/dev`를 반영합니다.
2. `app.js`에 조회 Router와 생성·수정 Router가 모두 등록됐는지 확인합니다.
3. 같은 메서드와 경로가 중복 등록되지 않았는지 확인합니다.
4. Swagger의 `Challenges` 태그 아래 모든 담당 엔드포인트가 표시되는지 확인합니다.
5. 관리자 수정 후 신청자의 `GET /notifications`에 알림이 생성되는지 확인합니다.
6. Prisma 스키마는 담당자 합의 없이 수정하지 않습니다.

## 테스트

VS Code REST Client에서는 `http/challenge-manage.http`를 순서대로 실행합니다.

확인 항목은 다음과 같습니다.

- USER와 ADMIN의 신규 신청 성공
- 과거 마감일 요청 거부
- 일반 사용자의 PATCH 요청 거부
- ADMIN의 진행 중 챌린지 수정 성공
- 수정 사유 누락 거부
- 수정 필드 없이 사유만 전달한 요청 거부
- 존재하지 않는 챌린지 수정 거부
- 수정 후 신청자 알림 생성 확인
