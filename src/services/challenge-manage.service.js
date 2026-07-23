import prisma from '../config/prisma.js';
import * as challengeManageRepository from '../repositories/challenge-manage.repository.js';
import { ConflictError, NotFoundError } from '../utils/errors.js';
import { createNotification } from './notification.service.js';

// Service는 Controller에서 검증한 입력을 받아 신규 신청의 초기 상태를 결정합니다.
// 신청 직후에는 아직 관리자가 승인하지 않았으므로 PENDING이며,
// 도전하기를 누른 참여자가 없으므로 현재 참여 인원은 0명으로 시작합니다.
async function createChallenge({ userId, data }) {
  // spread 이후 서버 값을 작성하여 클라이언트가 status, userId 등을 보내더라도
  // 서버가 정한 값이 최종 적용되도록 합니다. 권한상 USER와 ADMIN 모두 신청 가능합니다.
  return challengeManageRepository.create({
    ...data,
    userId,
    status: 'PENDING',
    currentParticipants: 0,
  });
}

async function updateChallenge({ challengeId, data }) {
  // 수정 전 현재 상태와 신청자 ID가 필요합니다. 신청자 ID는 수정 완료 후
  // 알림을 받을 사용자를 결정하는 데도 사용하므로 함께 조회합니다.
  const challenge = await challengeManageRepository.findById(challengeId);

  // soft delete된 데이터도 일반 조회와 수정 대상에서는 존재하지 않는 것처럼 처리합니다.
  // 삭제 여부를 구분해 응답하면 외부에 불필요한 데이터 상태가 노출될 수 있습니다.
  if (!challenge || challenge.status === 'DELETED' || challenge.deletedAt) {
    throw new NotFoundError('챌린지를 찾을 수 없습니다.');
  }

  // 요구사항의 "현재 진행 중인 챌린지"는 관리자가 승인했고 마감 전인 상태입니다.
  // PENDING/REJECTED/CLOSED 상태까지 수정되면 신청 및 마감 이력이 달라질 수 있어 차단합니다.
  if (challenge.status !== 'APPROVED' || challenge.deadline <= new Date()) {
    throw new ConflictError('진행 중인 챌린지만 수정할 수 있습니다.');
  }

  // 이미 참여한 인원보다 최대 인원을 작게 바꾸면 현재 데이터 자체가 모순됩니다.
  // maxParticipants를 실제로 변경하는 요청일 때만 이 규칙을 검사합니다.
  if (
    data.maxParticipants !== undefined &&
    data.maxParticipants < challenge.currentParticipants
  ) {
    throw new ConflictError(
      '최대 참여 인원은 현재 참여 인원보다 작을 수 없습니다.'
    );
  }

  // 요청의 reason은 관리자가 신청자에게 설명할 "수정 사유"입니다.
  // Challenge.reason은 승인 거절 사유를 저장하는 필드이므로 덮어쓰지 않고,
  // Prisma update에 전달할 실제 Challenge 필드와 분리해 알림 문구에만 사용합니다.
  const { reason, ...challengeData } = data;

  // Challenge 수정과 Notification 생성은 사용자 관점에서 하나의 사건입니다.
  // 두 작업을 같은 트랜잭션에 넣어 수정만 되고 알림이 빠지거나,
  // 수정은 실패했는데 알림만 전달되는 부분 성공 상태를 방지합니다.
  return prisma.$transaction(async (transactionClient) => {
    const updatedChallenge = await challengeManageRepository.update(
      challengeId,
      challengeData,
      transactionClient
    );

    // 알림 생성용 공개 API를 프론트에서 호출하지 않고 이벤트가 발생한 Service에서
    // 공통 함수를 호출합니다. 수신자와 target ID를 DB에서 얻기 때문에 위조도 막을 수 있습니다.
    await createNotification(
      {
        // 챌린지를 처음 신청한 사용자가 관리자 수정 사실을 확인해야 합니다.
        userId: challenge.userId,
        // 챌린지 제목/내용 수정은 상태 변경이 아니라 콘텐츠 변경 알림입니다.
        type: 'CONTENT_CHANGED',
        // 프론트가 관련 리소스 종류와 ID를 구분할 수 있도록 대상 정보를 함께 저장합니다.
        targetType: 'CHALLENGE',
        targetId: challenge.id,
        message: `'${updatedChallenge.title}' 챌린지가 수정되었습니다. 사유: ${reason}`,
      },
      transactionClient
    );

    // 트랜잭션 안의 두 작업이 모두 성공한 경우에만 수정된 Challenge를 반환합니다.
    return updatedChallenge;
  });
}

export { createChallenge, updateChallenge };
