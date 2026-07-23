import prisma from '../config/prisma.js';

/**
 * 만료된 APPROVED 챌린지를 CLOSED로 바꾸고 최다 추천 작업물과 알림을 기록합니다.
 *
 * 프로젝트 요구사항은 WebSocket, webhook, browser push 같은 실시간 채널이
 * 아니라 새로고침/fetch 시점의 동기화를 요구합니다. 따라서 별도 상시 실행
 * 서버를 전제로 하지 않고 다음 Service 진입점에서 이 함수를 호출합니다.
 * - GET /challenges 목록
 * - GET /challenges/:id 상세
 * - GET /notifications 알림 목록
 *
 * 처리 단위:
 * 1. APPROVED이면서 deadline <= now인 챌린지 후보 조회
 * 2. 각 챌린지를 조건부 updateMany로 CLOSED 전환
 * 3. 제출된 작업물의 하트 수를 비교해 공동 1등까지 isTopSubmission=true
 * 4. 신청자에게 DEADLINE 알림 저장
 *
 * 동시성 방어:
 * 여러 사용자가 같은 시점에 목록/알림을 fetch할 수 있습니다. 단순 update를
 * 사용하면 두 요청이 모두 마감 알림을 만들 수 있으므로
 * `id + status=APPROVED + deletedAt=null` 조건의 updateMany를 사용합니다.
 * 먼저 상태를 바꾼 트랜잭션만 count=1을 받고, 나머지는 count=0으로 즉시
 * 종료하여 중복 마감 처리와 중복 알림을 막습니다.
 *
 * @param {Date} now 테스트와 호출 시점에 사용할 기준 시간
 */
async function closeExpiredChallenges(now = new Date()) {
  // 후보 조회는 최소 필드만 가져와 이후 트랜잭션과 알림 생성에 사용합니다.
  const expiredChallenges = await prisma.challenge.findMany({
    where: {
      status: 'APPROVED',
      deletedAt: null,
      deadline: { lte: now },
    },
    select: {
      id: true,
      title: true,
      userId: true,
      deadline: true,
    },
  });

  // 각 Challenge를 독립 트랜잭션으로 처리해 한 건의 실패가 다른 마감까지 막지 않게 합니다.
  for (const challenge of expiredChallenges) {
    await prisma.$transaction(async (transactionClient) => {
      // 현재도 APPROVED인 경우에만 상태를 선점합니다.
      const { count } = await transactionClient.challenge.updateMany({
        where: {
          id: challenge.id,
          status: 'APPROVED',
          deletedAt: null,
        },
        data: {
          status: 'CLOSED',
        },
      });

      // 다른 요청이 먼저 처리했거나 중간에 상태가 바뀌었다면 아무것도 중복 생성하지 않습니다.
      if (count === 0) return;

      // 빈 작업물은 참여 직후 생성된 미제출 상태이므로 최다 추천 후보에서 제외합니다.
      const submissions = await transactionClient.submission.findMany({
        where: {
          challengeId: challenge.id,
          deletedAt: null,
          content: { not: '' },
        },
        select: {
          id: true,
          _count: {
            select: {
              likes: true,
            },
          },
        },
      });

      if (submissions.length > 0) {
        // 하트 수가 같은 공동 1등은 요구사항상 모두 최다 추천 작업물로 볼 수 있게 유지합니다.
        const topLikeCount = Math.max(
          ...submissions.map((submission) => submission._count.likes)
        );
        const topSubmissionIds = submissions
          .filter((submission) => submission._count.likes === topLikeCount)
          .map((submission) => submission.id);

        // 과거 실행의 플래그가 남아 있지 않도록 먼저 해당 챌린지 전체를 false로 초기화합니다.
        await transactionClient.submission.updateMany({
          where: {
            challengeId: challenge.id,
          },
          data: {
            isTopSubmission: false,
          },
        });

        // 이번 마감 시점의 최다 추천 작업물만 true로 설정합니다.
        await transactionClient.submission.updateMany({
          where: {
            id: { in: topSubmissionIds },
          },
          data: {
            isTopSubmission: true,
          },
        });
      }

      /**
       * 상태 전환, 추천작 계산, 알림 저장이 모두 같은 transactionClient를
       * 사용합니다. 어느 단계든 실패하면 CLOSED 상태까지 rollback됩니다.
       *
       * createdAt은 실제 fetch 시각이 아니라 챌린지 deadline을 사용해 사용자가
       * 알림에서 정확한 마감 시점을 볼 수 있게 합니다.
       */
      await transactionClient.notification.create({
        data: {
          userId: challenge.userId,
          type: 'DEADLINE',
          targetType: 'CHALLENGE',
          targetId: challenge.id,
          message: `'${challenge.title}' 챌린지가 마감되었습니다.`,
          createdAt: challenge.deadline,
        },
      });
    });
  }
}

export { closeExpiredChallenges };
