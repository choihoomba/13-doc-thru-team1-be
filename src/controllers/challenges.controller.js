import challengeService from '../services/challenges.service.js';
import {
  challengeIdParamSchema,
  challengeListQuerySchema,
  createChallengeSchema,
} from '../validations/challenges.validation.js';

/** 승인된 챌린지 목록 조회 (참여할 챌린지 찾기)
 * - GET /challenges
 */
async function getChallengeList(req, res, next) {
  try {
    const query = challengeListQuerySchema.parse(req.query);
    const result = await challengeService.getChallengeList(query);

    res.status(200).json({
      success: true,
      data: result,
      message: '챌린지 목록 조회 성공',
    });
  } catch (error) {
    next(error);
  }
}

/** 승인된 챌린지 상세 조회 (참여 전 미리보기)
 * - GET /challenges/:id
 */
async function getChallengeDetail(req, res, next) {
  try {
    const { id } = challengeIdParamSchema.parse(req.params);
    const challenge = await challengeService.getChallengeDetail(id);

    res.status(200).json({
      success: true,
      data: challenge,
      message: '챌린지 상세 조회 성공',
    });
  } catch (error) {
    next(error);
  }
}

/** 챌린지 신청(생성) — 생성 즉시 PENDING(승인 대기) 상태
 * - POST /challenges
 */
async function createChallenge(req, res, next) {
  try {
    const userId = req.user.userId;
    const body = createChallengeSchema.parse(req.body);
    const challenge = await challengeService.createChallenge(userId, body);

    res.status(201).json({
      success: true,
      data: challenge,
      message: '챌린지 신청이 접수되었습니다. 어드민 승인 후 노출됩니다.',
    });
  } catch (error) {
    next(error);
  }
}

export default {
  getChallengeList,
  getChallengeDetail,
  createChallenge,
};
