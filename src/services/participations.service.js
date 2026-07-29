import participationRepository from '../repositories/participations.repository.js';

/** 작업 도전하기 서비스 로직 */
async function create({ userId, challengeId }) {
  return await participationRepository.create({ userId, challengeId });
}

/** 작업 도전 포기하기 서비스 로직 */
async function cancel({ userId, participationId }) {
  return await participationRepository.cancel({ userId, participationId });
}

export default {
  create,
  cancel,
};
