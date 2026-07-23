import challengeService from '../services/challenges.service.js';
import {
  myChallengesQuerySchema,
  challengeIdParamSchema,
} from '../validations/challenges.validation.js';

async function getMyChallenges(req, res, next) {
  try {
    const userId = req.user.userId;
    const query = myChallengesQuerySchema.parse(req.query);

    const challenges = await challengeService.getMyChallenges(userId, query);

    res.status(200).json({
      success: true,
      data: challenges,
      message: '신청한 챌린지 목록 조회 성공',
    });
  } catch (error) {
    next(error);
  }
}

async function getMyChallengeDetail(req, res, next) {
  try {
    const userId = req.user.userId;
    const { id } = challengeIdParamSchema.parse(req.params);

    const challenge = await challengeService.getMyChallengeDetail(id, userId);

    res.status(200).json({
      success: true,
      data: challenge,
      message: '챌린지 상세 조회 성공',
    });
  } catch (error) {
    next(error);
  }
}

async function cancelMyChallenge(req, res, next) {
  try {
    const userId = req.user.userId;
    const { id } = challengeIdParamSchema.parse(req.params);

    const result = await challengeService.cancelMyChallenge(id, userId);

    res.status(200).json({
      success: true,
      data: result,
      message: '챌린지 신청이 취소되었습니다.',
    });
  } catch (error) {
    next(error);
  }
}

export default {
  getMyChallenges,
  getMyChallengeDetail,
  cancelMyChallenge,
};
