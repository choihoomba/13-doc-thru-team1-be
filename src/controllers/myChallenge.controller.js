import * as myChallengeService from '../services/myChallenge.service.js';
import { getMyChallengesQuerySchema } from '../validations/myChallenge.validation.js';

/**
 * GET /challenges?type=me
 * 로그인한 사용자의
 * '나의 챌린지 목록'을 조회하는 API
 */

// 사용자가 보낸 쿼리스트링을 검사한다.
// 값이 올바르면 query에 저장되고,
// 잘못된 값이면 Validation 에러가 발생한다.
export async function getList(req, res) {
  const query = getMyChallengesQuerySchema.parse(req.query);

  // Service에게 실제 목록 조회를 맡긴다.
  // req.user.userId는 authenticate 미들웨어에서
  // 로그인 확인(JWT 검증)이 끝난 후 넣어준 현재 로그인한 유저의 id이다.
  const result = await myChallengeService.getList({
    userId: req.user.userId,
    status: query.status,
    keyword: query.keyword,
    cursor: query.cursor,
    limit: query.limit,
  });
  // 조회 결과 반환
  res.status(200).json({ success: true, data: result });
}
