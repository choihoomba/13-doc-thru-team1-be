import * as myChallengeService from '../services/myChallenge.service.js';
import { getMyChallengesQuerySchema } from '../validations/myChallenge.validation.js';

/**
 * GET /challenges?type=me
 * 로그인한 사용자의
 * '나의 챌린지 목록'을 조회하는 API
 */
export async function getList(req, res) {
  const query = getMyChallengesQuerySchema.parse(req.query);

  // req.user.userId는 authenticate 미들웨어가 JWT 검증 후 심어준 값
  const result = await myChallengeService.getList({
    userId: req.user.userId,
    status: query.status,
    search: query.search,
    field: query.field,
    docType: query.docType,
    cursor: query.cursor,
    limit: query.limit,
  });

  res.status(200).json({ success: true, data: result });
}
