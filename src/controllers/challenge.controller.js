import * as challengeService from '../services/challenge.service.js';
import {
  challengeIdParamsSchema,
  createChallengeSchema,
  updateChallengeSchema,
} from '../validations/challenge.validation.js';

// Controller는 HTTP 입력을 검증하고 Service 결과를 팀 공통 응답 형식으로 반환합니다.
async function createChallenge(req, res) {
  const data = createChallengeSchema.parse(req.body);
  const challenge = await challengeService.createChallenge({
    userId: req.user.userId,
    data,
  });

  return res.status(201).json({
    success: true,
    data: challenge,
  });
}

async function updateChallenge(req, res) {
  const { id: challengeId } = challengeIdParamsSchema.parse(req.params);
  const data = updateChallengeSchema.parse(req.body);
  const challenge = await challengeService.updateChallenge({
    challengeId,
    data,
  });

  return res.status(200).json({
    success: true,
    data: challenge,
  });
}

// 목록 담당자는 query를 검증한 뒤 getChallenges, 상세 담당자는 getChallenge 함수를 추가합니다.
// 새 함수는 같은 이름으로 Service에 연결하고 아래 export 목록에도 추가합니다.

export { createChallenge, updateChallenge };
