import * as challengeRepository from '../repositories/challenge.repository.js';
import { ConflictError, NotFoundError } from '../utils/errors.js';

async function createChallenge({ userId, data }) {
  // 신청자, 승인 상태, 참여 인원은 클라이언트가 변경하지 못하도록 서버에서 결정합니다.
  // 인증된 USER와 ADMIN 모두 신청할 수 있으므로 별도의 역할 검사는 하지 않습니다.
  return challengeRepository.create({
    ...data,
    userId,
    status: 'PENDING',
    currentParticipants: 0,
  });
}

async function updateChallenge({ challengeId, data }) {
  const challenge = await challengeRepository.findById(challengeId);

  if (!challenge || challenge.status === 'DELETED' || challenge.deletedAt) {
    throw new NotFoundError('챌린지를 찾을 수 없습니다.');
  }

  // 요구사항의 "현재 진행 중인 챌린지"는 승인되었고 마감 전인 상태를 의미합니다.
  if (challenge.status !== 'APPROVED' || challenge.deadline <= new Date()) {
    throw new ConflictError('진행 중인 챌린지만 수정할 수 있습니다.');
  }

  // 이미 참여 중인 인원보다 최대 인원을 작게 바꾸면 기존 참여 데이터와 모순이 생깁니다.
  if (
    data.maxParticipants !== undefined &&
    data.maxParticipants < challenge.currentParticipants
  ) {
    throw new ConflictError(
      '최대 참여 인원은 현재 참여 인원보다 작을 수 없습니다.'
    );
  }

  const updatedChallenge = await challengeRepository.update(challengeId, data);

  // Notification API 병합 후 이 위치에서 신청자에게 CONTENT_CHANGED 알림을 생성합니다.
  // 원본 수정과 알림 저장은 하나의 트랜잭션으로 묶어 함께 성공하거나 실패하게 연결합니다.

  return updatedChallenge;
}

// 목록·상세·삭제 담당자는 이 파일에 비즈니스 함수를 추가하고 Repository를 호출합니다.
// Controller의 req/res 객체를 Service로 넘기지 않아 HTTP 계층과 규칙 처리를 분리합니다.

export { createChallenge, updateChallenge };
