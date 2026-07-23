import * as challengeQueryService from '../services/challenge-query.service.js';
import { challengeListQuerySchema } from '../validations/challenge-query.validation.js';

/**
 * GET /challenges
 *
 * 챌린지 목록을 조회하는 공통 Controller입니다.
 *
 * 다음 네 가지 목록을 하나의 Handler에서 처리합니다.
 *
 * - view=public
 *   전체 공개 챌린지 목록
 *
 * - view=participating
 *   로그인 사용자가 참여 중인 챌린지 목록
 *
 * - view=completed
 *   로그인 사용자가 참여한 완료 챌린지 목록
 *
 * - view=admin
 *   관리자 챌린지 신청 관리 목록
 *
 * 어떤 목록을 조회할지는 Controller가 직접 판단하지 않고,
 * 검증된 query를 Service에 전달하여 Service에서 판단합니다.
 */
async function getChallenges(req, res) {
  /**
   * 요청 Query 검증
   *
   * req.query에는 URL의 쿼리스트링이 객체 형태로 들어옵니다.
   *
   * 요청 예시:
   * GET /challenges?view=public&search=router&page=1&limit=10
   *
   * req.query 예시:
   * {
   *   view: 'public',
   *   search: 'router',
   *   page: '1',
   *   limit: '10'
   * }
   *
   * challengeListQuerySchema.parse()는 다음 작업을 수행합니다.
   *
   * 1. view, field, docType, status, sort 값 검증
   * 2. page와 limit을 문자열에서 숫자로 변환
   * 3. 전달되지 않은 값에 기본값 적용
   * 4. 허용되지 않은 쿼리 조합 검사
   *
   * 검증에 실패하면 ZodError가 발생합니다.
   * Express 5가 해당 에러를 전역 에러 Handler로 전달하므로
   * 이 Controller에 별도의 try-catch를 작성하지 않습니다.
   */
  const query = challengeListQuerySchema.parse(req.query);

  /**
   * 인증된 사용자 정보와 검증된 Query를 Service로 전달합니다.
   *
   * req.user는 Route에 연결된 authenticate 미들웨어가
   * accessToken을 검증한 후 만들어주는 값입니다.
   *
   * userId:
   * participating과 completed 목록에서
   * 현재 사용자의 참여 기록을 조회할 때 사용합니다.
   *
   * userRole:
   * view=admin 요청에서 ADMIN 권한인지 확인할 때 사용합니다.
   *
   * query:
   * Validation 검증이 끝난 안전한 목록 조회 조건입니다.
   */
  const result = await challengeQueryService.getChallenges({
    userId: req.user.userId,
    userRole: req.user.role,
    query,
  });

  /**
   * 모든 view가 동일한 응답 구조를 사용합니다.
   *
   * Service의 result는 다음 구조를 반환해야 합니다.
   *
   * {
   *   challenges: [],
   *   pagination: {
   *     page: 1,
   *     limit: 10,
   *     total: 0,
   *     totalPages: 0
   *   }
   * }
   *
   * Controller는 Service 결과를 data 안에 넣어
   * 최종 API 응답 형식으로 반환합니다.
   */
  return res.status(200).json({
    success: true,
    data: result,
  });
}

export { getChallenges };
