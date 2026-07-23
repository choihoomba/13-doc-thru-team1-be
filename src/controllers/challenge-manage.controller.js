import * as challengeManageService from '../services/challenge-manage.service.js';
import {
  challengeIdParamsSchema,
  createChallengeSchema,
  updateChallengeSchema,
} from '../validations/challenge-manage.validation.js';

// Controller는 HTTP 요청에서 필요한 값을 꺼내고 응답을 만드는 역할만 담당합니다.
// 챌린지 상태나 수정 가능 여부까지 여기서 판단하면 같은 규칙을 다른 호출부에서
// 재사용하기 어려워지므로 비즈니스 규칙은 Service에서 처리합니다.
async function createChallenge(req, res) {
  // Zod parse는 잘못된 요청이면 예외를 발생시킵니다. Express 5가 해당 예외를
  // 전역 에러 미들웨어로 전달하므로 Controller마다 try/catch를 반복하지 않습니다.
  const data = createChallengeSchema.parse(req.body);

  // userId를 request body에서 받으면 다른 사용자 이름으로 신청할 수 있습니다.
  // authenticate가 검증한 req.user의 ID만 Service로 전달합니다.
  const challenge = await challengeManageService.createChallenge({
    userId: req.user.userId,
    data,
  });

  // 새 Challenge 레코드가 생성되었으므로 REST 의미에 맞게 201을 반환합니다.
  return res.status(201).json({
    success: true,
    data: challenge,
  });
}

async function updateChallenge(req, res) {
  // URL parameter는 문자열로 들어오기 때문에 Zod에서 숫자로 변환하고
  // 1 이상의 정수인지 확인한 값만 Repository 조회에 사용합니다.
  const { id: challengeId } = challengeIdParamsSchema.parse(req.params);

  // PATCH는 전체 필드가 아닌 수정할 필드만 받을 수 있지만,
  // 신청자에게 전달할 관리자 수정 사유는 반드시 포함해야 합니다.
  const data = updateChallengeSchema.parse(req.body);
  const challenge = await challengeManageService.updateChallenge({
    challengeId,
    data,
  });

  // 수정 결과를 프론트가 즉시 화면에 반영할 수 있도록 변경된 레코드를 반환합니다.
  return res.status(200).json({
    success: true,
    data: challenge,
  });
}

export { createChallenge, updateChallenge };
