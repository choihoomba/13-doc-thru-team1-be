import challengeService from '../services/challenges.service.js';
import {
  challengeIdParamSchema,
  adminChallengesQuerySchema,
  updateChallengeStatusSchema,
  deleteChallengeSchema,
} from '../validations/challenges.validation.js';

async function getAdminChallenges(req, res, next) {
  try {
    const query = adminChallengesQuerySchema.parse(req.query);
    const result = await challengeService.getAdminChallenges(query);

    res.status(200).json({
      success: true,
      data: result,
      message: '관리자 챌린지 목록 조회 성공',
    });
  } catch (error) {
    next(error);
  }
}

async function updateChallengeStatus(req, res, next) {
  try {
    const { id } = challengeIdParamSchema.parse(req.params);
    const body = updateChallengeStatusSchema.parse(req.body);

    const updated = await challengeService.updateChallengeStatus(id, body);

    res.status(200).json({
      success: true,
      data: updated,
      message: '챌린지 상태가 변경되었습니다.',
    });
  } catch (error) {
    next(error);
  }
}

async function deleteChallenge(req, res, next) {
  try {
    const { id } = challengeIdParamSchema.parse(req.params);
    const { reason } = deleteChallengeSchema.parse(req.body);

    const deleted = await challengeService.softDeleteChallenge(id, reason);

    res.status(200).json({
      success: true,
      data: deleted,
      message: '챌린지가 성공적으로 삭제(Soft Delete) 되었습니다.',
    });
  } catch (error) {
    next(error);
  }
}

export default {
  getAdminChallenges,
  updateChallengeStatus,
  deleteChallenge,
};
