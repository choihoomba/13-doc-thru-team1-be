# Challenge API 통합·협업·알림 가이드

## 1. 문서 목적

이 문서는 여러 담당자가 나누어 작업한 Challenge 관련 요구사항을 기존 API
명세를 유지하면서 하나의 도메인 구현으로 통합한 최종 기준입니다.

다음 내용을 이 문서 하나에서 확인할 수 있습니다.

- 담당자별 R&R과 최종 구현 위치
- 파일이 분리되어 있던 이유와 통합 방식
- 교안의 Layered Architecture 적용 기준
- Challenge 엔드포인트와 권한
- 목록 query string과 공통 응답 형식
- 상세·신청·수정·승인·거절·취소·삭제 규칙
- Challenge에서 발생시키는 알림과 트랜잭션
- Cron에서 재사용할 마감 상태·최다 추천 작업물·마감 알림 처리
- 상세 참여 현황에서 기존 Submission API를 사용하는 방법
- Swagger, Prisma Studio, 자동 테스트 검수 결과
- 커밋과 push 전 확인 순서

Swagger 주석 파일은 실행 가능한 API 문서를 만들기 위한 JavaScript 파일이라
이 MD 통합 대상과 별도로 유지합니다.

## 2. 담당자별 R&R과 최종 구현

아래 표의 담당 구분은 프로젝트에서 정한 화면 R&R 기준입니다. Git 작성자
이력을 재분류한 것이 아니라, 어떤 요구사항이 최종 Challenge API의 어느
기능으로 들어갔는지 설명하기 위한 표입니다.

| 담당   | 원래 담당 화면/기능                      | 최종 API 또는 처리                                                                             |
| ------ | ---------------------------------------- | ---------------------------------------------------------------------------------------------- |
| K-지훈 | 알림                                     | `GET /notifications`, `PATCH /notifications/:id/read`, Challenge 변경 Service의 내부 알림 생성 |
| K-지훈 | 회원 신규 챌린지 신청                    | `POST /challenges`                                                                             |
| K-지훈 | 어드민 챌린지 수정                       | `GET /challenges/:id`, `PATCH /challenges/:id` + 수정 필드와 `reason`                          |
| 전현선 | 회원 챌린지 보기                         | `GET /challenges?view=public`                                                                  |
| 전현선 | 참여 중인 챌린지                         | `GET /challenges?view=participating`                                                           |
| 전현선 | 완료한 챌린지                            | `GET /challenges?view=completed`                                                               |
| 전현선 | 어드민 챌린지 보기                       | `GET /challenges?view=public` 후 role에 따라 관리 버튼 노출                                    |
| 전현선 | 어드민 삭제 모달                         | `DELETE /challenges/:id` + `reason`                                                            |
| 전현선 | 어드민 신청 관리                         | `GET /challenges?view=admin`                                                                   |
| 전현선 | 승인 대기·거절 모달·승인/거절            | `GET /challenges?view=admin&status=PENDING`, `PATCH /challenges/:id` + `status`                |
| C-지훈 | 내가 신청한 챌린지                       | `GET /challenges?view=applied`                                                                 |
| C-지훈 | 신청 상세·취소                           | `GET /challenges/:id`, `PATCH /challenges/:id` + `action=CANCEL`                               |
| C-지훈 | 어드민 목록·삭제 모달                    | 공개/어드민 목록과 `DELETE /challenges/:id` 재사용                                             |
| 한효주 | 회원 챌린지 상세                         | `GET /challenges/:id`                                                                          |
| 한효주 | 라이브·마감·정원 마감·인원 없음/5명 이하 | 상세의 `status`, `deadline`, `currentParticipants`, `maxParticipants`, `viewer`로 판단         |

통합 과정에서 공통으로 추가·정리한 부분은 다음과 같습니다.

- 목록 query 이름과 기본값 통일
- 성공 응답과 페이지네이션 응답 통일
- 같은 `PATCH /challenges/:id` Handler 충돌 해결
- 승인·거절·신청 취소를 기존 PATCH 명세 안에서 구분
- 삭제 상태와 사유를 신청자 상세에 보존
- Challenge 변경과 알림을 같은 트랜잭션으로 연결
- GET 요청과 분리된 자정 Cron용 마감 처리 함수 유지
- Swagger와 Challenge 전용 통합 테스트 추가

## 3. 파일 통합 구조

### 3.1 통합 전 문제

목록 조회와 신청·관리 기능을 담당자별 파일로 유지하면 다음 문제가 생길 수
있습니다.

- `app.js`에서 `/challenges` Router를 여러 번 마운트
- 같은 method/path Handler가 먼저 등록된 순서에 따라 가려짐
- PATCH 정보 수정과 PATCH 승인·거절 Handler 충돌
- 조회와 변경 코드가 서로 다른 enum과 응답 필드 사용
- 한쪽 Repository만 transaction client를 받아 알림 트랜잭션이 끊김
- 프론트가 화면마다 다른 query 이름과 응답 형식을 처리

### 3.2 최종 레이어 파일

교안의 Layered Architecture 기준으로 Challenge 도메인은 레이어별 파일을
하나씩 사용합니다.

```text
src/routes/challenge.route.js
src/controllers/challenge.controller.js
src/services/challenge.service.js
src/repositories/challenge.repository.js
src/validations/challenge.validation.js
```

추가로 Challenge의 마감과 알림 연동에는 다음 공통 파일을 사용합니다.

```text
src/jobs/deadline.job.js
src/services/notification.service.js
```

`src/app.js`에는 다음 마운트가 한 번만 존재합니다.

```js
app.use('/challenges', challengeRouter);
```

기존 `challenge-manage.*`, `challenge-query.*` 역할은 위 단일 레이어 파일에
합쳐졌습니다. 외부 API 경로에는 manage/query 같은 내부 담당 이름을 추가하지
않습니다.

### 3.3 Swagger 문서도 단일 파일로 통합

Challenge의 Swagger/OpenAPI 명세는 다음 파일 하나에서 관리합니다.

```text
src/docs/challenge.swagger.js
```

기존에는 조회용 `challenge-query.swagger.js`와 신청·관리용
`challenge-manage.swagger.js`가 따로 있어 같은 `/challenges`와
`/challenges/{id}` path를 두 파일에서 나누어 선언했습니다. 실행 API는 하나인데
문서만 나뉘면 다음 문제가 생길 수 있어 단일 파일로 합쳤습니다.

- 한 endpoint를 변경할 때 두 문서를 함께 확인해야 함
- query 이름, 권한, 성공 응답을 서로 다르게 적을 가능성
- 같은 method/path를 중복 선언하여 나중에 읽힌 문서가 앞 문서를 덮을 가능성
- 담당자 구분용 파일명이 실제 외부 endpoint처럼 오해될 가능성

`src/config/swagger.js`는 `src/docs/*.js`를 자동으로 읽으므로 새 import나 Router
마운트는 필요하지 않습니다. `challenge.swagger.js`는 API를 실행하는 파일이
아니라 Swagger UI가 query, body, response, 권한, 오류 조건을 표시하기 위한
문서 계약입니다. 이 파일을 없애도 실제 API 호출은 동작하지만 `/api-docs`에서
Challenge 사용법이 사라지므로 프론트 협업과 수동 검수에 필요합니다.

파일 안의 문서 순서는 `GET /challenges`, `POST /challenges`,
`GET /challenges/{id}`, `PATCH /challenges/{id}`,
`DELETE /challenges/{id}`입니다. Validation 또는 응답 계약을 바꾸면 실행 코드와
Swagger를 같은 작업에서 함께 갱신해야 합니다.

## 4. 레이어별 책임

```text
Client
  → Router
  → Controller
  → Service
  → Repository
  → Prisma / Database
```

### Router

- URL과 HTTP method 등록
- `authenticate`, `authorize` 미들웨어 연결
- 같은 method/path가 중복되지 않도록 단일 진입점 유지
- query 해석이나 상태 판단은 하지 않음

### Controller

- params/query/body를 Zod로 검증
- 사용자 정보는 body가 아닌 `req.user`에서 취득
- 검증된 값을 Service로 전달
- 성공 응답을 `{ success: true, data }`로 통일
- 비즈니스 규칙과 Prisma 호출은 하지 않음

### Service

- 사용자 역할과 신청자 소유권 검사
- 상태, 마감일, 정원, 참여 관계 판단
- view를 실제 조회 조건으로 변환
- 상태 전이와 수정·삭제 가능 여부 결정
- Challenge 변경과 알림을 같은 트랜잭션으로 처리

### Repository

- Prisma query 실행
- 공통 select로 반환 필드 통일
- 목록과 total을 같은 where로 조회
- Service에서 받은 transaction client 사용
- HTTP 상태 코드와 권한은 판단하지 않음

### Validation

- Prisma enum과 API 허용값 통일
- query string의 숫자 변환과 기본값 설정
- 서버 관리 필드의 외부 입력 차단
- PATCH body 세 종류를 strict union으로 구분

## 5. 최종 Challenge 엔드포인트

새로운 엔드포인트를 임의로 추가하지 않고 기존 명세를 유지합니다.

| Method   | Path              | 기능                                        | 권한                |
| -------- | ----------------- | ------------------------------------------- | ------------------- |
| `GET`    | `/challenges`     | 화면별 목록, 검색, 필터, 정렬, 페이지네이션 | 로그인 사용자       |
| `GET`    | `/challenges/:id` | 공개 상세 또는 신청자/관리자 신청 상세      | 로그인 사용자       |
| `POST`   | `/challenges`     | 신규 Challenge 신청                         | 로그인 사용자       |
| `PATCH`  | `/challenges/:id` | 정보 수정, 승인·거절, 승인 대기 신청 취소   | 기능별 Service 검사 |
| `DELETE` | `/challenges/:id` | 진행 중 Challenge 관리자 soft delete        | ADMIN               |

Swagger에서는 다음 두 path만 보여야 합니다.

```text
/challenges       GET, POST
/challenges/{id}  GET, PATCH, DELETE
```

## 6. 공통 성공·실패 응답

### 성공 응답

모든 Challenge Controller는 같은 wrapper를 사용합니다.

```json
{
  "success": true,
  "data": {}
}
```

목록 응답은 다음 구조로 통일합니다.

```json
{
  "success": true,
  "data": {
    "challenges": [],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 18,
      "totalPages": 2,
      "hasNext": true
    }
  }
}
```

- `total`: 검색과 필터까지 적용한 전체 개수
- `totalPages`: `Math.ceil(total / limit)`
- `hasNext`: 다음 page 요청 가능 여부
- 무한 스크롤도 `hasNext=true`인 동안 page를 증가시키는 방식으로 사용

### 실패 응답

Zod와 공통 오류 클래스는 전역 error middleware를 거쳐 다음 형식으로
응답합니다.

```json
{
  "success": false,
  "message": "오류 설명",
  "code": "VALIDATION_ERROR"
}
```

주요 상태 코드는 다음과 같습니다.

| 상태  | 의미                                         |
| ----- | -------------------------------------------- |
| `400` | params/query/body 검증 실패                  |
| `401` | 로그인 필요                                  |
| `403` | 관리자 역할 또는 소유권 부족                 |
| `404` | 리소스가 없거나 비공개 리소스 조회 권한 없음 |
| `409` | 현재 상태에서 승인·수정·삭제·취소 불가       |

## 7. GET `/challenges` query string

### 전체 query

```http
GET /challenges?view=public&search=router&field=WEB&docType=OFFICIAL&status=APPROVED&sort=deadlineAsc&page=1&limit=10
```

| 이름      | 허용값/형식                                                         | 기본값      | 의미             |
| --------- | ------------------------------------------------------------------- | ----------- | ---------------- |
| `view`    | `public`, `participating`, `completed`, `applied`, `admin`          | `public`    | 화면별 목록 종류 |
| `search`  | 최대 100자 문자열                                                   | 없음        | 제목 부분 검색   |
| `field`   | `NEXTJS`, `REACT`, `MODERNJS`, `TYPESCRIPT`, `API`, `WEB`, `CAREER` | 없음        | 분야 필터        |
| `docType` | `OFFICIAL`, `BLOG`, `BOOK`, `ETC`                                   | 없음        | 문서 유형 필터   |
| `status`  | `PENDING`, `APPROVED`, `REJECTED`, `DELETED`, `CLOSED`              | view별 결정 | 상태 필터        |
| `sort`    | `latest`, `oldest`, `deadlineAsc`, `deadlineDesc`                   | `latest`    | 정렬             |
| `page`    | 1 이상의 정수                                                       | `1`         | 페이지           |
| `limit`   | 1~100 정수                                                          | `10`        | 페이지당 개수    |

### view별 DB 조건

| view            | 실제 조건                                            | 화면                    |
| --------------- | ---------------------------------------------------- | ----------------------- |
| `public`        | `APPROVED` 또는 `CLOSED`, `deletedAt=null`           | 일반/어드민 챌린지 보기 |
| `participating` | `APPROVED`, 마감 전, 내 `ACTIVE` Participation       | 나의 챌린지 - 참여 중   |
| `completed`     | `CLOSED` 또는 마감일 경과, 내 `ACTIVE` Participation | 나의 챌린지 - 완료      |
| `applied`       | `userId=로그인 사용자`, 모든 신청 상태               | 내가 신청한 챌린지      |
| `admin`         | ADMIN, status 생략 시 전체 상태                      | 어드민 신청 관리        |

`public`에서 `PENDING`, `REJECTED`, `DELETED`를 요청하면 400입니다.

`participating`, `completed`는 view 자체가 상태를 의미하므로 status를 함께
보내면 400입니다.

### 정렬이 안정적인 이유

각 정렬에는 `id`를 두 번째 정렬 기준으로 넣습니다.

```js
latest: [{ createdAt: 'desc' }, { id: 'desc' }];
```

같은 createdAt이나 deadline을 가진 데이터가 있어도 페이지 요청마다 순서가
바뀌지 않아 중복/누락 가능성을 줄입니다.

## 8. GET `/challenges/:id` 상세

### 조회 권한

- `APPROVED`, `CLOSED`: 모든 로그인 사용자
- `PENDING`, `REJECTED`, `DELETED`: 신청자 본인 또는 ADMIN
- 권한 없는 비공개 상세: 존재 여부를 숨기기 위해 404

### 기본 정보

- 제목, 분야, 문서 유형, 내용
- 원문 URL
- 마감일
- 현재/최대 참여 인원
- 상태
- 거절 또는 삭제 사유
- 신청자(작성자) 정보: `user.id`, `user.nickname`

원문 보기 전용 API는 추가하지 않습니다. 프론트가 상세 응답의
`originalUrl`을 새 창으로 엽니다.

### viewer

```json
{
  "viewer": {
    "isApplicant": false,
    "participation": null,
    "canParticipate": true
  }
}
```

`canParticipate=true` 조건:

- 상태가 `APPROVED`
- 현재 시간이 deadline 이전
- 현재 참여 인원이 최대 참여 인원보다 적음
- 챌린지 신청자 본인이 아님
- 이미 ACTIVE 참여 중이 아님

따라서 프론트는 같은 상세 응답으로 다음 상태를 구분할 수 있습니다.

- 라이브 챌린지
- 마감된 챌린지
- 모집 정원 마감
- 현재 참여 인원 5명 이하
- 참여 인원 없음
- 이미 참여 중
- 신청자 본인

### 마감 후 최다 추천 작업물

`CLOSED` 상세에서만 `topSubmissions`를 반환합니다. 하트 수가 같은 공동
1등이 있으면 여러 건이 포함될 수 있습니다.

## 9. 상세 참여 현황과 기존 API 사용

기존 명세에 없는 `/challenges/:id/participants`는 추가하지 않습니다.

상세 참여 현황은 기존 Submission API를 사용합니다.

```http
GET /submissions?challengeId=:id&include=user&orderBy=likeDesc
```

프론트 처리 기준:

- 반환 배열 순서로 순위 표시
- `user.nickname`으로 참여자 표시
- `_count.likes`로 하트 수 표시
- `updatedAt`을 최종 제출 시간으로 사용
- 화면 페이지 구분은 배열을 나누어 처리

서버 페이지네이션이 반드시 필요해지면 Challenge 엔드포인트를 새로 만들지
않고 Submission 담당자가 기존 `/submissions`에 `page`, `limit` query를
추가하는 방향으로 팀 합의합니다.

도전하기와 포기하기도 기존 명세를 사용합니다.

```http
POST /participations
PATCH /participations/:id
```

## 10. POST `/challenges` 신규 신청

요청 예:

```json
{
  "title": "Express Router 공식 문서 번역",
  "field": "WEB",
  "docType": "OFFICIAL",
  "content": "Express Router 문서를 함께 번역합니다.",
  "originalUrl": "https://expressjs.com/en/guide/routing.html",
  "deadline": "2027-12-20T23:59:59.000Z",
  "maxParticipants": 8
}
```

서버가 설정하는 값:

```text
userId = 로그인 사용자 ID
status = PENDING
currentParticipants = 0
```

Validation은 strict이므로 클라이언트가 status, userId 같은 서버 필드를 추가로
보내면 거부합니다.

마감일은 신규 신청 시점으로부터 최소 7일 이후여야 합니다. 프론트의 날짜 입력
제한과 별개로 백엔드 Validation에서도 같은 규칙을 검사합니다. 진행 중 챌린지를
관리자가 수정할 때는 최소 7일 규칙을 다시 적용하지 않고 미래 날짜인지만 확인합니다.

## 11. PATCH `/challenges/:id` 단일 Handler

같은 method/path Handler를 여러 파일에 등록하지 않습니다. strict union으로
검증한 body의 식별 필드를 기준으로 세 기능을 나눕니다.

### 관리자 정보 수정

```json
{
  "maxParticipants": 10,
  "reason": "모집 정원을 조정했습니다."
}
```

조건:

- ADMIN
- `APPROVED`
- 마감 전
- 삭제되지 않음
- maxParticipants는 currentParticipants 이상
- 변경 필드가 한 개 이상 존재
- 수정 사유 필수

수정 사유는 Challenge.reason을 덮어쓰지 않고 알림 메시지에 기록합니다.

### 관리자 승인

```json
{
  "status": "APPROVED"
}
```

### 관리자 거절

```json
{
  "status": "REJECTED",
  "reason": "원문 링크를 확인할 수 없습니다."
}
```

조건:

- ADMIN
- 현재 상태가 `PENDING`
- 승인 시 deadline이 지나지 않음
- 거절 시 reason 필수

### 신청자 취소

```json
{
  "action": "CANCEL"
}
```

조건:

- 신청자 본인
- 현재 상태가 `PENDING`

취소되면 어드민 신청 목록에서 완전히 제외되어야 하므로 hard delete합니다.

### 충돌 body 차단

다음처럼 상태 변경과 정보 수정 필드를 섞으면 400입니다.

```json
{
  "status": "REJECTED",
  "title": "동시에 수정할 수 없습니다.",
  "reason": "혼합 요청"
}
```

## 12. DELETE `/challenges/:id`

요청:

```json
{
  "reason": "원문 링크가 더 이상 유효하지 않습니다."
}
```

조건:

- ADMIN
- `APPROVED`
- 마감 전
- 이미 삭제되지 않음

신청자가 이후 삭제 상태와 사유를 확인해야 하므로 hard delete하지 않습니다.

```text
status = DELETED
reason = 관리자 삭제 사유
deletedAt = 삭제 시각
```

공개 목록에서는 제외되지만 신청자의 `view=applied` 목록과 상세에서는 상태와
사유를 확인할 수 있습니다.

## 13. Challenge 알림 연동

### 외부 생성 API를 만들지 않는 이유

알림 생성용 `POST /notifications`는 만들지 않습니다.

프론트가 원본 변경 후 알림 생성 요청을 따로 보내면 다음 문제가 있습니다.

- 두 요청 중 하나만 성공할 수 있음
- 사용자가 수신자와 메시지를 조작할 수 있음
- 알림 요청을 보내지 않아 변경 이력이 누락될 수 있음

이벤트를 처리한 백엔드 Service가 실제 DB 관계에서 수신자를 결정하고 내부
`createNotification()`을 호출합니다.

### 공통 함수

```js
await createNotification(
  {
    userId: challenge.userId,
    type: 'CONTENT_CHANGED',
    targetType: 'CHALLENGE',
    targetId: challenge.id,
    message: `'${challenge.title}' 챌린지가 수정되었습니다.`,
  },
  transactionClient
);
```

| 값                  | 의미                                  |
| ------------------- | ------------------------------------- |
| `userId`            | 실제 DB에서 조회한 알림 수신자        |
| `type`              | 발생 사건 종류                        |
| `targetType`        | `CHALLENGE`, `SUBMISSION`, `FEEDBACK` |
| `targetId`          | 실제 변경된 레코드 ID                 |
| `message`           | 사용자에게 표시할 문구                |
| `transactionClient` | 원본 변경과 같은 Prisma 작업 단위     |

수신자 ID와 target ID를 request body에서 받지 않습니다.

### Challenge에서 현재 생성하는 알림

| 사건             | 수신자        | type              | targetType  | 사유 포함             |
| ---------------- | ------------- | ----------------- | ----------- | --------------------- |
| 관리자 정보 수정 | 챌린지 신청자 | `CONTENT_CHANGED` | `CHALLENGE` | 예                    |
| 승인             | 챌린지 신청자 | `STATUS_CHANGED`  | `CHALLENGE` | 아니오                |
| 거절             | 챌린지 신청자 | `STATUS_CHANGED`  | `CHALLENGE` | 예                    |
| 관리자 삭제      | 챌린지 신청자 | `STATUS_CHANGED`  | `CHALLENGE` | 예                    |
| 마감             | 챌린지 신청자 | `DEADLINE`        | `CHALLENGE` | 마감 시각은 createdAt |

### 트랜잭션

```text
Prisma transaction 시작
→ Challenge 변경
→ Notification 생성
→ 둘 다 성공하면 commit
→ 하나라도 실패하면 전체 rollback
```

Challenge Repository의 update와 Notification Repository 양쪽에 동일한
`transactionClient`를 전달해야 합니다.

### 알림 조회와 읽음 처리

프론트는 다음 두 API만 사용합니다.

```http
GET /notifications
PATCH /notifications/:id/read
```

- 새로고침하거나 알림 패널을 열 때 GET
- 알림 확인 시 PATCH
- 날짜는 Notification.createdAt 표시
- 이동 경로는 targetType과 targetId로 결정
- 다른 사용자의 알림 읽음 요청은 존재 여부를 숨기기 위해 404
- 이미 읽은 알림을 다시 PATCH해도 같은 결과 반환

### 다른 도메인 담당 범위

다음 이벤트는 Notification 공통 함수를 사용할 수 있지만 Challenge 파일에서
구현하지 않습니다.

| 사건                       | 구현 담당 도메인   |
| -------------------------- | ------------------ |
| 작업물 생성·수정·삭제 알림 | Submission Service |
| 피드백 생성·수정·삭제 알림 | Feedback Service   |

Submission/Feedback 담당자는 원본 변경과 알림을 같은 transaction client로
묶어야 합니다. Challenge 통합 작업에서는 해당 코드 파일을 수정하지 않습니다.

## 14. Cron용 마감 처리

`closeExpiredChallenges()`는 일반 GET 요청에서 호출하지 않습니다. 목록·상세·알림을
조회할 때마다 만료 후보 조회와 트랜잭션을 실행하면 불필요한 DB 부하가 발생하기
때문입니다.

이 함수는 매 자정 실행되는 Cron 작업이 호출할 수 있도록
`src/jobs/deadline.job.js`에 유지합니다. 실제 스케줄 등록은 별도 Cron 담당
작업에서 연결합니다.

처리:

1. `APPROVED`, `deletedAt=null`, `deadline<=now` 후보 조회
2. 조건부 updateMany로 `CLOSED` 전환
3. 빈 작업물을 제외하고 하트 수 계산
4. 공동 1등까지 `isTopSubmission=true`
5. 신청자에게 `DEADLINE` 알림 생성

Cron 작업이 중복 실행되더라도 먼저 상태를 바꾼 실행만 updateMany count=1을
얻습니다. 나머지는 count=0으로 종료하여 중복 마감 알림을 만들지 않습니다.

## 15. 관련 파일

### 실행 코드

```text
src/app.js
src/routes/challenge.route.js
src/controllers/challenge.controller.js
src/services/challenge.service.js
src/repositories/challenge.repository.js
src/validations/challenge.validation.js
src/jobs/deadline.job.js
src/services/notification.service.js
```

### API 문서와 수동 테스트

```text
src/docs/challenge.swagger.js
src/docs/challenge-api-guide.md
http/challenge.http
```

### 자동 테스트

```text
tests/challenge.api.test.js
npm run test:challenge
```

## 16. 최종 검수 결과

확인 완료 항목:

- 공개/참여 중/완료/신청/어드민 목록
- 검색, 분야, 문서 유형, 상태, 정렬
- 페이지네이션 응답
- 라이브/마감/정원 마감 상세
- 마감 후 최다 추천 작업물
- 신규 신청
- 신청 취소 후 어드민 목록 제외
- 어드민 상세
- 승인·거절
- 수정·삭제
- 거절/삭제 사유 조회
- Challenge 알림 생성
- 알림 읽음 처리
- 일반 사용자의 어드민 접근 403
- 비로그인 접근 401
- 혼합 PATCH와 잘못된 query 400
- Prisma schema validate
- seed data validate

검수용으로 생성한 Challenge와 Notification은 확인 후 제거합니다.

## 17. Git 커밋·push 전 순서

### 1. 현재 브랜치와 변경 확인

```powershell
git branch --show-current
git status --short
git diff --name-status
```

### 2. 다른 담당 도메인 변경 여부 확인

```powershell
git diff --name-only -- `
  src/controllers/submission.controller.js `
  src/docs/submission.swagger.js `
  src/repositories/submission.repository.js `
  src/services/submission.service.js `
  src/validations/submission.validation.js `
  src/repositories/feedback.repository.js `
  src/services/feedback.service.js
```

출력이 없어야 합니다.

### 3. 테스트

```powershell
npm run test:challenge
npm run seed:validate
npx prisma validate
npx prettier --check `
  src/routes/challenge.route.js `
  src/controllers/challenge.controller.js `
  src/services/challenge.service.js `
  src/repositories/challenge.repository.js `
  src/validations/challenge.validation.js `
  src/jobs/deadline.job.js `
  src/services/notification.service.js `
  src/docs/challenge-api-guide.md `
  tests/challenge.api.test.js
```

### 4. Challenge 관련 파일만 stage

저장소 루트에서 실제 `git status --short` 결과와 대조하면서 추가합니다.

```powershell
git add `
  README.md `
  package.json `
  src/app.js `
  src/config/swagger.js `
  src/routes/challenge.route.js `
  src/controllers/challenge.controller.js `
  src/services/challenge.service.js `
  src/repositories/challenge.repository.js `
  src/validations/challenge.validation.js `
  src/jobs/deadline.job.js `
  src/services/notification.service.js `
  src/docs/challenge.swagger.js `
  src/docs/challenge-api-guide.md `
  http/challenge.http `
  tests/challenge.api.test.js
```

삭제된 예전 Challenge 파일은 다음 명령으로 stage합니다.

```powershell
git add -u -- `
  http/challenge-manage.http `
  src/controllers/challenge-manage.controller.js `
  src/docs/challenge-api-collaboration-guide.md `
  src/docs/challenge-manage-api-guide.md `
  src/docs/challenge-manage.swagger.js `
  src/docs/notification-integration-guide.md `
  src/repositories/challenge-manage.repository.js `
  src/routes/challenge-manage.route.js `
  src/services/challenge-manage.service.js `
  src/validations/challenge-manage.validation.js
```

### 5. staged 내용 재확인

```powershell
git diff --cached --name-status
git diff --cached --check
git diff --cached --stat
git diff --cached --name-only -- `
  src/controllers/submission.controller.js `
  src/docs/submission.swagger.js `
  src/repositories/submission.repository.js `
  src/services/submission.service.js `
  src/validations/submission.validation.js `
  src/repositories/feedback.repository.js `
  src/services/feedback.service.js
```

마지막 명령의 출력이 비어 있어야 하며, Submission/Feedback 파일이 staged
목록에 없어야 합니다.

### 6. 커밋과 push

```powershell
git commit -m "feat: integrate challenge APIs and notifications"
git push origin <현재-브랜치명>
```

push 전에 원격 변경이 있는 팀 브랜치라면 팀의 merge/rebase 규칙에 따라 최신
브랜치를 먼저 반영합니다. 충돌이 생겼을 때 Challenge 단일 Router와 단일 PATCH
Handler를 여러 파일로 되돌리지 않도록 이 문서의 통합 구조를 기준으로 해결합니다.
