# Challenge API 협업 및 병합 가이드

## 문서 목적

Challenge API는 하나의 `/challenges` 리소스를 세 명이 나누어 구현합니다.
이 문서는 작업 파일이 겹치는 문제를 줄이고, 병합 후 하나의 API처럼 동작하게 만드는 기준을 정리합니다.

파일명에 붙는 `query`, `manage`, `status`는 내부 담당 범위를 구분하기 위한 이름입니다.
외부 API 주소에는 해당 단어를 추가하지 않고 팀 API 명세의 경로를 그대로 사용합니다.

## 엔드포인트 분담안

| 담당 모듈          | 메서드와 경로            | 역할                           | 권한               |
| ------------------ | ------------------------ | ------------------------------ | ------------------ |
| `challenge-query`  | `GET /challenges`        | 목록, 검색, 필터, 페이지네이션 | USER, ADMIN        |
| `challenge-query`  | `GET /challenges/:id`    | 상세 및 수정 폼 초기값 조회    | USER, ADMIN        |
| `challenge-manage` | `POST /challenges`       | 신규 챌린지 신청               | 인증된 USER, ADMIN |
| `challenge-manage` | `PATCH /challenges/:id`  | 진행 중인 챌린지 정보 수정     | ADMIN              |
| `challenge-status` | `DELETE /challenges/:id` | 챌린지 삭제 처리               | ADMIN              |

기존 API 표에는 POST 권한이 USER로 적혀 있지만, 현재 코드는 팀 논의 결과에 따라 ADMIN도 신청할 수 있게 구현했습니다.
최종 Notion API 명세와 Swagger의 권한 표기도 같은 내용으로 맞춰야 합니다.

승인과 거절 기능은 프로젝트 요구사항에는 있지만 현재 엔드포인트 표에는 별도 경로가 없습니다.
승인·거절 담당자는 임의로 두 번째 `PATCH /challenges/:id`를 등록하지 말고 다음 항목을 먼저 팀에서 결정해야 합니다.

1. 기존 `PATCH /challenges/:id`가 정보 수정과 상태 변경을 모두 받을지
2. 상태 변경 전용 경로를 API 명세에 추가할지
3. 하나의 PATCH를 사용한다면 Controller, Validation, Service 수정 권한을 누구에게 둘지

같은 메서드와 경로의 Handler를 Router 두 곳에 동시에 등록하면 먼저 실행된 Handler가 응답을 끝내므로 두 번째 Handler는 실행되지 않습니다.
따라서 동일한 `PATCH /:id`를 두 명이 따로 구현해서 병합하는 방식은 사용하지 않습니다.

## 권장 파일 분리

```text
src/
├─ routes/
│  ├─ challenge-query.route.js
│  ├─ challenge-manage.route.js
│  └─ challenge-status.route.js
├─ controllers/
│  ├─ challenge-query.controller.js
│  ├─ challenge-manage.controller.js
│  └─ challenge-status.controller.js
├─ services/
│  ├─ challenge-query.service.js
│  ├─ challenge-manage.service.js
│  └─ challenge-status.service.js
├─ repositories/
│  ├─ challenge-query.repository.js
│  ├─ challenge-manage.repository.js
│  └─ challenge-status.repository.js
├─ validations/
│  ├─ challenge-query.validation.js
│  ├─ challenge-manage.validation.js
│  └─ challenge-status.validation.js
└─ docs/
   ├─ challenge-query.swagger.js
   ├─ challenge-manage.swagger.js
   └─ challenge-status.swagger.js
```

세 모듈은 같은 Prisma `Challenge` 모델을 사용하지만 각 담당자가 필요한 쿼리와 비즈니스 규칙은 자신의 파일에서 관리합니다.
공통 상수나 순수 함수가 실제로 반복될 때만 `utils`로 분리하고, 예상만으로 공통 파일을 먼저 만들지는 않습니다.

## app.js에서 합치는 방법

각 Router는 자체 파일에서 `/`와 `/:id`만 등록하고, `app.js`가 공통 기본 경로를 붙입니다.

```js
import challengeQueryRouter from './routes/challenge-query.route.js';
import challengeManageRouter from './routes/challenge-manage.route.js';
import challengeStatusRouter from './routes/challenge-status.route.js';

app.use('/challenges', challengeQueryRouter);
app.use('/challenges', challengeManageRouter);
app.use('/challenges', challengeStatusRouter);
```

연결 결과는 다음과 같습니다.

```text
challengeQueryRouter.get('/')          → GET /challenges
challengeQueryRouter.get('/:id')       → GET /challenges/:id
challengeManageRouter.post('/')        → POST /challenges
challengeManageRouter.patch('/:id')    → PATCH /challenges/:id
challengeStatusRouter.delete('/:id')   → DELETE /challenges/:id
```

기본 경로가 같아도 HTTP 메서드가 다르면 충돌하지 않습니다.
`app.js` 충돌을 해결할 때 한 사람의 import와 `app.use`만 남기지 말고 세 Router를 모두 유지합니다.

## 계층별 병합 원칙

### Route

- URL, HTTP method, 인증 및 권한 미들웨어만 연결합니다.
- 같은 method와 path가 중복되지 않는지 확인합니다.
- 미들웨어 순서는 `authenticate` 다음에 `authorize`입니다.

### Controller

- `req.params`, `req.query`, `req.body`를 Zod로 검증합니다.
- 인증된 사용자 ID는 request body가 아닌 `req.user.userId`를 사용합니다.
- 챌린지 상태 판단과 알림 생성은 Controller에 넣지 않습니다.

### Service

- 승인 상태, 마감일, 신청자, 참여 인원 같은 비즈니스 규칙을 처리합니다.
- 데이터 변경과 알림 생성은 같은 Prisma 트랜잭션으로 묶습니다.
- Service와 Repository의 오류는 `throw`하고 전역 에러 핸들러가 응답하게 합니다.

### Repository

- Prisma 조회와 저장만 담당합니다.
- 트랜잭션이 필요한 create/update/delete 함수는 `databaseClient = prisma` 인자를 받을 수 있게 합니다.
- Repository에서 HTTP 상태 코드나 권한을 판단하지 않습니다.

## GET 목록의 탭과 쿼리스트링

참여 중, 완료, 신청한 챌린지는 엔드포인트를 세 개로 만들지 않고 같은 목록 API에 조건을 전달합니다.
다음은 합의에 사용할 수 있는 쿼리 예시이며, 실제 이름과 응답 형식은 GET 담당자와 프론트 담당자가 확정해야 합니다.

```http
GET /challenges?view=participating
GET /challenges?view=completed
GET /challenges?view=applied
```

각 탭을 누를 때 해당 query string으로 한 번 요청합니다.
검색과 필터를 함께 사용한다면 한 요청에 조합합니다.

```http
GET /challenges?view=participating&keyword=router&field=WEB&docType=OFFICIAL
```

POST와 PATCH는 생성·수정 값을 request body에 전달하므로 탭 구분용 쿼리스트링을 사용하지 않습니다.

## Swagger 병합 원칙

- 파일은 담당별로 분리해도 모든 문서는 같은 `Challenges` tag를 사용합니다.
- 같은 method와 path의 Swagger 정의를 두 파일에 중복 작성하지 않습니다.
- `/api-docs`에서 GET, POST, PATCH, DELETE가 모두 보이는지 확인합니다.
- 인증 API는 HttpOnly access token 쿠키를 사용하므로 보호된 API에 `cookieAuth`를 표시합니다.

## 병합 순서

1. 각 담당자가 자신의 기능 브랜치에서 테스트와 PR 리뷰를 완료합니다.
2. 먼저 병합된 Challenge PR을 기준으로 다음 담당자가 `origin/dev`를 rebase합니다.
3. `app.js` 충돌에서는 기존 Router와 새 Router를 모두 보존합니다.
4. 공통 파일을 양쪽이 수정했다면 기능을 하나씩 비교하고 통째로 덮어쓰지 않습니다.
5. Swagger와 REST Client에서 전체 엔드포인트를 다시 실행합니다.
6. Challenge 변경 이벤트마다 필요한 알림이 같은 트랜잭션에서 생성되는지 확인합니다.

## 최종 병합 체크리스트

- [ ] `GET /challenges`와 `GET /challenges/:id`가 조회 담당 Router에 한 번씩만 존재한다.
- [ ] `POST /challenges`와 `PATCH /challenges/:id`가 manage Router에 한 번씩만 존재한다.
- [ ] `DELETE /challenges/:id`가 삭제 담당 Router에 한 번만 존재한다.
- [ ] 승인·거절에서 사용할 경로와 Handler 소유자가 팀 문서에 확정되어 있다.
- [ ] USER와 ADMIN의 실제 권한이 Notion, Swagger, 코드에서 일치한다.
- [ ] 각 Router가 `app.js`의 `/challenges` 경로에 모두 연결되어 있다.
- [ ] 관리자 수정·삭제·승인·거절 시 신청자 알림이 생성된다.
- [ ] 조회 탭의 query 이름과 응답 형식을 프론트와 공유했다.
- [ ] Prisma 스키마를 담당자 합의 없이 변경하지 않았다.
