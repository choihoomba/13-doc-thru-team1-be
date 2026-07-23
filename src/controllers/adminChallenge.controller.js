import * as adminChallengeService from '../services/adminChallenge.service.js';
import { getAdminChallengesQuerySchema } from '../validations/adminChallenge.validation.js';
/**
 * GET /challenges?type=admin
 *
 * 어드민 신청 관리 목록 조회
 */

// 사용자가 보낸 쿼리스트링을 검사
// 값이 올바르면 query에 저장되고,
// 잘못된 값이면 Validation 에러가 발생
export async function getList(req, res) {
  const query = getAdminChallengesQuerySchema.parse(req.query);

  // 실제 목록 조회는 Service에게 맡긴다.
  // Controller는 직접 DB를 조회하지 않고
  // 필요한 조회 조건만 Service로 전달하는 역할을 한다.
  const result = await adminChallengeService.getApplicationList(query);
  // 조회 결과 반환
  res.status(200).json({ success: true, data: result });
}
