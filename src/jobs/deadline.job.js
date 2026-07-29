import prisma from '../config/prisma.js';

/**
 * 만료된 챌린지 마감 처리
 * - APPROVED 챌린지 중 deadline 지난 것을 CLOSED로 전환
 * - 최다 추천 작업물(isTopSubmission) 계산
 * - 신청자에게 DEADLINE 알림 생성
 * - 최다 추천작 작성자 topLikedCount 증가
 * - 참여자 전원 등급(GENERAL/EXPERT) 재계산
 *
 * 매 자정 크론에서만 호출 - 조회 API에서는 호출하지 않음
 */
export async function closeExpiredChallenges(now = new Date()) {
  // 마감 후보 조회 - 이후 알림 생성에 필요한 최소 필드만
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

  // 챌린지 단위로 독립 트랜잭션 처리 - 한 건 실패가 다른 챌린지 마감을 막지 않음
  for (const challenge of expiredChallenges) {
    await prisma.$transaction(async (tx) => {
      // 동시 요청 대비 조건부 전환 - count 0이면 이미 처리된 것으로 보고 스킵
      const { count } = await tx.challenge.updateMany({
        where: { id: challenge.id, status: 'APPROVED', deletedAt: null },
        data: { status: 'CLOSED' },
      });

      if (count === 0) return;

      // 최다 추천 작업물 계산 - 미제출(빈 content)은 후보에서 제외
      const submissions = await tx.submission.findMany({
        where: {
          challengeId: challenge.id,
          deletedAt: null,
          content: { not: '' },
        },
        select: {
          id: true,
          userId: true,
          _count: { select: { likes: true } },
        },
      });

      let topUserIds = [];

      if (submissions.length > 0) {
        const topLikeCount = Math.max(
          ...submissions.map((submission) => submission._count.likes)
        );
        const topSubmissions = submissions.filter(
          (submission) => submission._count.likes === topLikeCount
        );
        const topSubmissionIds = topSubmissions.map(
          (submission) => submission.id
        );
        topUserIds = topSubmissions.map((submission) => submission.userId);

        // 과거 실행 플래그 초기화 후 이번 최다 추천작만 true로 설정
        await tx.submission.updateMany({
          where: { challengeId: challenge.id },
          data: { isTopSubmission: false },
        });
        await tx.submission.updateMany({
          where: { id: { in: topSubmissionIds } },
          data: { isTopSubmission: true },
        });
      }

      // 신청자 마감 알림 - createdAt을 deadline으로 맞춰 정확한 마감 시점 표시
      await tx.notification.create({
        data: {
          userId: challenge.userId,
          type: 'DEADLINE',
          targetType: 'CHALLENGE',
          targetId: challenge.id,
          message: `'${challenge.title}' 챌린지가 마감되었습니다.`,
          createdAt: challenge.deadline,
        },
      });

      // 최다 추천작 작성자 topLikedCount 증가 (동점이면 전원 증가)
      for (const userId of topUserIds) {
        await tx.user.update({
          where: { id: userId },
          data: { topLikedCount: { increment: 1 } },
        });
      }

      // 이번 챌린지 참여자 전원 등급 재계산
      // - 참여 횟수: 완료(CLOSED)된 챌린지에 ACTIVE로 남아있는 참여만 즉석 집계
      // - 추천 선정 횟수: topLikedCount 캐시 사용 (위에서 갱신된 최신 값)
      const participants = await tx.participation.findMany({
        where: { challengeId: challenge.id, status: 'ACTIVE' },
        select: { userId: true },
      });

      for (const { userId } of participants) {
        const [completedCount, user] = await Promise.all([
          tx.participation.count({
            where: {
              userId,
              status: 'ACTIVE',
              challenge: { status: 'CLOSED' },
            },
          }),
          tx.user.findUnique({
            where: { id: userId },
            select: { topLikedCount: true, grade: true },
          }),
        ]);

        const isExpert =
          (completedCount >= 5 && user.topLikedCount >= 5) ||
          completedCount >= 10 ||
          user.topLikedCount >= 10;
        const newGrade = isExpert ? 'EXPERT' : 'GENERAL';

        // 등급이 실제로 바뀔 때만 갱신 - 불필요한 쓰기 방지
        if (newGrade !== user.grade) {
          await tx.user.update({
            where: { id: userId },
            data: { grade: newGrade },
          });
        }
      }
    });
  }
}
