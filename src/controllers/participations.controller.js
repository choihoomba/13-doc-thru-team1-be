import participationService from '../services/participations.service.js';
import {
  createParticipationSchema,
  cancelParticipationSchema,
} from '../validations/participations.validation.js';

/** 작업 도전하기 컨트롤러
 * - POST /participations
 */
async function createParticipation(req, res, next) {
  const data = createParticipationSchema.parse(req.body); // 검증 실패 시 에러핸들러로

  const result = await participationService.create({
    userId: parseInt(req.user.userId, 10),
    challengeId: parseInt(data.challengeId, 10),
  });

  res.status(201).json({ success: true, data: result });
}

/** 작업 도전 포기하기 컨트롤러
 * - PATCH /participations/:id
 */
async function cancelParticipation(req, res, next) {
  const { id } = cancelParticipationSchema.parse(req.params); // 검증 실패 시 에러핸들러로

  const result = await participationService.cancel({
    userId: parseInt(req.user.userId, 10),
    participationId: id,
  });

  res.json({ success: true, data: result });
}

export default {
  createParticipation,
  cancelParticipation,
};
