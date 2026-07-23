# Notification 공통 함수 연동 가이드

## 문서 목적

Notification API는 알림 목록 조회와 읽음 처리를 담당합니다.
알림을 발생시키는 책임은 Challenge, Submission, Feedback 및 마감 처리 Service에 있습니다.

프론트에서 원본 변경 요청과 알림 생성 요청을 따로 보내면 두 요청을 하나의 DB 트랜잭션으로 묶을 수 없습니다.
따라서 원본 데이터가 변경되는 백엔드 Service에서 Notification 공통 함수를 직접 호출합니다.

## 전체 처리 흐름

```text
프론트가 원본 리소스 변경 요청
→ Route에서 인증과 권한 검사
→ Controller에서 Zod 요청 검증
→ 도메인 Service에서 비즈니스 규칙 확인
→ Prisma 트랜잭션 시작
→ 원본 데이터 생성/수정/삭제
→ createNotification 호출
→ 둘 다 성공하면 commit
→ 하나라도 실패하면 rollback
```

알림 생성용 `POST /notifications`는 만들지 않습니다.
외부 사용자가 수신자와 메시지를 직접 보내게 하면 다른 사람에게 허위 알림을 생성할 수 있기 때문입니다.

## 공통 함수 위치와 인자

공통 함수는 `src/services/notification.service.js`에서 가져옵니다.

```js
import { createNotification } from './notification.service.js';
```

호출 형식은 다음과 같습니다.

```js
await createNotification(
  {
    userId: notificationReceiverId,
    type: 'CONTENT_CHANGED',
    targetType: 'CHALLENGE',
    targetId: changedChallengeId,
    message: '사용자에게 보여줄 알림 문구',
  },
  transactionClient
);
```

| 값                  | 의미                              | 결정 위치                             |
| ------------------- | --------------------------------- | ------------------------------------- |
| `userId`            | 알림을 받을 사용자 ID             | 원본 데이터의 관계를 DB에서 조회      |
| `type`              | 알림이 발생한 사건 종류           | 이벤트를 처리하는 Service             |
| `targetType`        | 관련 리소스 종류                  | `CHALLENGE`, `SUBMISSION`, `FEEDBACK` |
| `targetId`          | 관련 레코드 ID                    | DB 생성·수정 결과에서 가져옴          |
| `message`           | 화면에 표시할 문구                | Service에서 사건 내용과 사유로 작성   |
| `transactionClient` | 원본 변경과 같은 Prisma 작업 단위 | `$transaction` callback에서 전달      |

수신자 ID와 target ID를 request body에서 그대로 받지 않습니다.
반드시 로그인 정보나 Repository가 조회한 실제 관계에서 결정해야 알림 위조를 막을 수 있습니다.

## 기본 트랜잭션 예시

다른 도메인의 Repository 함수도 transaction client를 받을 수 있어야 합니다.

```js
async function update(id, data, databaseClient = prisma) {
  return databaseClient.submission.update({
    where: { id },
    data,
  });
}
```

Service에서는 원본 변경 결과와 알림을 같은 callback 안에서 처리합니다.

```js
return prisma.$transaction(async (transactionClient) => {
  const updatedSubmission = await submissionRepository.update(
    submissionId,
    submissionData,
    transactionClient
  );

  await createNotification(
    {
      userId: challengeApplicantId,
      type: 'CONTENT_CHANGED',
      targetType: 'SUBMISSION',
      targetId: updatedSubmission.id,
      message: `'${challengeTitle}' 챌린지의 작업물이 수정되었습니다.`,
    },
    transactionClient
  );

  return updatedSubmission;
});
```

Repository에서 기본 `prisma`를 직접 사용하고 Notification에만 `transactionClient`를 전달하면 두 작업은 같은 트랜잭션이 아닙니다.
원본 Repository와 Notification 공통 함수 양쪽에 동일한 client를 전달해야 합니다.

## 요구사항별 알림 연결표

아래 표는 현재 Prisma enum과 프로젝트 요구사항을 기준으로 한 구현 기준입니다.

| 발생 사건                      | 호출할 Service                 | 수신자        | `type`            | `targetType` | `targetId`   |
| ------------------------------ | ------------------------------ | ------------- | ----------------- | ------------ | ------------ |
| 관리자가 챌린지 정보 수정      | Challenge 수정 Service         | 챌린지 신청자 | `CONTENT_CHANGED` | `CHALLENGE`  | 챌린지 ID    |
| 관리자가 챌린지 삭제           | Challenge 삭제 Service         | 챌린지 신청자 | `STATUS_CHANGED`  | `CHALLENGE`  | 챌린지 ID    |
| 챌린지 승인 또는 거절          | Challenge 상태 변경 Service    | 챌린지 신청자 | `STATUS_CHANGED`  | `CHALLENGE`  | 챌린지 ID    |
| 신청한 챌린지에 작업물 생성    | Submission 생성 Service        | 챌린지 신청자 | `NEW_SUBMISSION`  | `SUBMISSION` | 새 작업물 ID |
| 챌린지 작업물 수정 또는 삭제   | Submission 수정·삭제 Service   | 챌린지 신청자 | `CONTENT_CHANGED` | `SUBMISSION` | 작업물 ID    |
| 작업물에 피드백 생성           | Feedback 생성 Service          | 작업물 작성자 | `NEW_FEEDBACK`    | `FEEDBACK`   | 새 피드백 ID |
| 관리자가 피드백 수정 또는 삭제 | Feedback 수정·삭제 Service     | 피드백 작성자 | `CONTENT_CHANGED` | `FEEDBACK`   | 피드백 ID    |
| 챌린지 마감                    | Deadline job 또는 마감 Service | 챌린지 신청자 | `DEADLINE`        | `CHALLENGE`  | 챌린지 ID    |

챌린지 삭제는 요구사항의 "콘텐츠 삭제"와 "상태 삭제" 양쪽에서 해석될 수 있습니다.
이 문서에서는 Challenge 전체가 `DELETED` 상태로 바뀌는 사건이므로 `STATUS_CHANGED`를 기본안으로 정했습니다.
팀에서 `CONTENT_CHANGED`로 사용하기로 결정하면 Prisma enum을 추가하지 말고 호출부의 type과 Swagger 예시를 동일하게 변경합니다.

요구사항 문장의 수신 대상이 모호한 이벤트는 구현 전에 팀에서 다시 확인합니다.
예를 들어 마감 알림을 신청자뿐 아니라 모든 참여자에게도 보낼지는 현재 표와 별도의 정책 결정입니다.

## 메시지 작성 기준

메시지는 `notificationCreateSchema`에 따라 1자 이상 255자 이하이어야 합니다.
프론트가 알림 날짜를 표시할 때는 Notification의 `createdAt`을 사용하므로 메시지에 날짜 문자열을 중복 저장할 필요는 없습니다.

권장 문구 예시는 다음과 같습니다.

```text
'Express Router 번역' 챌린지가 수정되었습니다. 사유: 원문 링크를 수정했습니다.
'Express Router 번역' 챌린지가 승인되었습니다.
'Express Router 번역' 챌린지가 거절되었습니다. 사유: 원문 링크를 확인할 수 없습니다.
'Express Router 번역' 챌린지에 새로운 작업물이 등록되었습니다.
내 작업물에 새로운 피드백이 등록되었습니다.
'Express Router 번역' 챌린지가 마감되었습니다.
```

관리자 작업에 사유가 필요한 경우 요청 Validation에서 사유를 필수로 검증하고 메시지에 포함합니다.
Challenge의 거절 사유처럼 별도 DB 필드의 의미가 정해져 있다면 다른 사건의 사유로 덮어쓰지 않습니다.

## 여러 명에게 알림을 보낼 때

같은 사건을 여러 사용자가 받아야 한다면 먼저 수신자 ID 중복을 제거합니다.
부트캠프 프로젝트 규모에서는 흐름이 명확한 `for...of`를 사용할 수 있습니다.

```js
const receiverIds = [...new Set(userIds)];

for (const userId of receiverIds) {
  await createNotification(
    {
      userId,
      type: 'DEADLINE',
      targetType: 'CHALLENGE',
      targetId: challenge.id,
      message: `'${challenge.title}' 챌린지가 마감되었습니다.`,
    },
    transactionClient
  );
}
```

수신자가 매우 많아진다면 `createMany`나 작업 큐를 검토할 수 있지만 현재 범위에서는 먼저 정확한 트랜잭션과 중복 방지를 구현합니다.

## 프론트가 담당하는 부분

프론트는 알림을 생성하지 않고 다음 두 API만 사용합니다.

```http
GET /notifications
PATCH /notifications/:id/read
```

- 새로고침하거나 알림 목록을 열 때 GET으로 로그인 사용자의 알림을 가져옵니다.
- 사용자가 알림 항목을 확인하면 PATCH로 `isRead: true` 처리합니다.
- 화면 날짜는 `createdAt`을 변환해 표시합니다.
- 추후 페이지 이동을 연결한다면 `targetType`과 `targetId`로 이동 경로를 결정합니다.

현재 요구사항은 실시간 WebSocket이나 브라우저 Push가 아니라 새로고침 기반 fetch 방식입니다.
따라서 백엔드는 알림 레코드를 정확히 저장하고, 프론트는 필요한 시점에 다시 조회합니다.

## 사용하면 안 되는 처리 방식

```text
프론트: PATCH /challenges/:id 성공
프론트: POST /notifications 별도 요청
```

위 방식은 첫 번째 요청만 성공하고 두 번째 요청이 네트워크 오류로 실패할 수 있습니다.
또한 사용자가 두 번째 요청을 보내지 않거나 내용을 조작할 수 있어 알림을 신뢰할 수 없습니다.

```text
Service에서 원본 Repository는 기본 prisma 사용
Notification만 transactionClient 사용
```

위 방식도 서로 다른 DB 작업 단위이므로 함께 rollback되지 않습니다.

## 담당자별 구현 체크리스트

- [ ] 이벤트를 처리하는 도메인 Service에서 `createNotification`을 import했다.
- [ ] 알림 생성용 외부 엔드포인트를 추가하지 않았다.
- [ ] 수신자 ID를 request body가 아닌 실제 DB 관계에서 가져왔다.
- [ ] enum에 존재하는 `type`과 `targetType`을 사용했다.
- [ ] 원본 데이터의 실제 ID를 `targetId`로 넣었다.
- [ ] 메시지가 255자를 넘지 않게 Validation 또는 문구 길이를 제한했다.
- [ ] 원본 Repository와 Notification에 같은 `transactionClient`를 전달했다.
- [ ] 알림 실패 테스트에서 원본 변경도 rollback되는지 확인했다.
- [ ] 수신자로 로그인해 `GET /notifications`에서 알림을 확인했다.
- [ ] 알림 클릭 후 `PATCH /notifications/:id/read`가 본인 알림만 읽음 처리하는지 확인했다.
