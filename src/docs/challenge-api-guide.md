# Challenge API 협업 가이드

## 공통 파일 구조

Challenge API 담당자는 엔드포인트별 파일을 새로 만들지 않고 아래 공통 파일에 함수를 추가합니다.

```text
src/
├─ routes/challenge.route.js
├─ controllers/challenge.controller.js
├─ services/challenge.service.js
├─ repositories/challenge.repository.js
├─ validations/challenge.validation.js
└─ docs/challenge.swagger.js
```

요청은 `Route → Controller → Service → Repository → Prisma` 순서로 처리합니다.

- Route: 경로와 인증·인가 미들웨어를 연결합니다.
- Controller: params, query, body를 검증하고 공통 응답 형식을 만듭니다.
- Service: 권한 외의 상태 판단과 비즈니스 규칙을 처리합니다.
- Repository: Prisma를 이용한 데이터 접근만 담당합니다.
- Validation: Zod 요청 스키마를 관리합니다.
- Swagger: API 요청과 응답, 가능한 에러를 문서화합니다.

## 다른 엔드포인트 합치는 순서

1. `challenge.validation.js`에 담당 요청의 params, query 또는 body 스키마를 추가합니다.
2. `challenge.repository.js`에 필요한 Prisma 조회 또는 변경 함수를 추가합니다.
3. `challenge.service.js`에 상태와 권한을 판단하는 비즈니스 함수를 추가합니다.
4. `challenge.controller.js`에서 요청을 검증하고 Service를 호출합니다.
5. `challenge.route.js`에 경로와 미들웨어를 등록합니다.
6. `challenge.swagger.js`에 같은 `Challenges` 태그로 명세를 추가합니다.
7. `http/challenge.http`에 정상·실패 테스트 요청을 추가합니다.

각 파일의 기존 export를 덮어쓰지 말고 새로운 함수를 export 목록에 추가해야 합니다. `src/app.js`의 `/challenges` 등록은 한 번만 유지합니다.

## 나의 챌린지 세 탭 조회

참여 중, 완료, 신청한 챌린지는 별도 엔드포인트를 만들지 않고 같은 목록 엔드포인트를 세 번 호출합니다.

```http
GET /challenges?view=participating
GET /challenges?view=completed
GET /challenges?view=applied
```

- `participating`: 로그인 사용자가 참여 중이고 마감되지 않은 챌린지
- `completed`: 로그인 사용자가 참여했고 마감된 챌린지
- `applied`: 로그인 사용자가 직접 신청한 챌린지

검색과 필터가 필요하면 같은 요청에 조합합니다.

```http
GET /challenges?view=participating&keyword=react&field=REACT&docType=OFFICIAL
```

목록 담당자는 Controller에서 query를 검증하고, Service에서 `view` 값에 맞는 조회 조건을 선택한 뒤, Repository에서 Prisma `where` 조건으로 변환합니다. `/challenges/participating` 같은 탭 전용 엔드포인트는 추가하지 않습니다.

## POST와 PATCH에 query가 없는 이유

- `POST /challenges`는 생성할 정보를 request body로 전달합니다.
- `PATCH /challenges/:id`는 수정할 대상을 path parameter로, 변경할 정보를 request body로 전달합니다.

두 요청은 목록을 검색하거나 분류하지 않으므로 query string이 필요하지 않습니다.

`POST /challenges`는 인증된 USER와 ADMIN 모두 사용할 수 있습니다. `PATCH /challenges/:id`는 기존 `authorize` 미들웨어를 적용하여 ADMIN만 사용할 수 있습니다.

## 병합 시 주의점

- 여러 담당자가 같은 Challenge 파일을 수정하므로 PR 병합 전 최신 `origin/dev`를 rebase하고 충돌을 직접 확인합니다.
- `challenge.route.js` 충돌 시 한 사람의 라우트만 선택하지 말고 각 담당자의 라우트를 모두 남깁니다.
- Controller, Service, Repository의 export 충돌 시 기존 함수와 새 함수를 모두 export합니다.
- `GET '/'`와 `GET '/:id'`는 목록 경로를 먼저 배치합니다.
- 다른 HTTP 메서드의 같은 경로는 하나의 Router에서 함께 사용할 수 있습니다.
- Prisma 스키마는 공통 기준이므로 담당자 합의 없이 수정하지 않습니다.

## Notification 연결

Challenge 수정 알림은 Notification API가 `dev`에 병합된 뒤 `challenge.service.js`의 표시된 위치에서 연결합니다. 챌린지 수정과 알림 저장은 같은 트랜잭션을 사용해야 한쪽만 저장되는 상태를 방지할 수 있습니다.
