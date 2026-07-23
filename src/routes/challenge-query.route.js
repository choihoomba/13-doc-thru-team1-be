import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import * as challengeQueryController from '../controllers/challenge-query.controller.js';

/**
 * 챌린지 목록 조회 Router
 *
 * 다음 네 가지 화면의 목록 조회를 하나의 GET Handler에서 처리합니다.
 *
 * - public: 전체 공개 챌린지 목록
 * - participating: 내가 참여 중인 챌린지 목록
 * - completed: 내가 완료한 챌린지 목록
 * - admin: 관리자 챌린지 신청 관리 목록
 *
 * 각 화면을 별도의 GET Route로 등록하지 않고
 * view 쿼리스트링을 사용하여 구분합니다.
 */
const challengeQueryRouter = Router();

/**
 * GET /challenges
 *
 * 사용 예시:
 *
 * 공개 챌린지 목록
 * GET /challenges
 * GET /challenges?view=public
 *
 * 내가 참여 중인 챌린지 목록
 * GET /challenges?view=participating
 *
 * 내가 완료한 챌린지 목록
 * GET /challenges?view=completed
 *
 * 관리자 챌린지 신청 관리 목록
 * GET /challenges?view=admin
 *
 * 검색·필터·정렬·페이지네이션 조합
 * GET /challenges?view=public&search=router&field=WEB&page=1&limit=10
 */
challengeQueryRouter.get(
  '/',

  /**
   * 모든 챌린지 목록은 로그인이 필요합니다.
   *
   * authenticate 미들웨어는 httpOnly 쿠키에 있는 accessToken을
   * 검증하고, 인증에 성공하면 req.user를 만듭니다.
   *
   * 생성되는 값의 예:
   *
   * req.user = {
   *   userId: 1,
   *   role: 'USER'
   * };
   *
   * Controller와 Service는 이 값을 사용하여 다음 작업을 합니다.
   *
   * - participating: 현재 사용자의 참여 기록 조회
   * - completed: 현재 사용자의 완료 챌린지 조회
   * - admin: 현재 사용자가 ADMIN인지 확인
   */
  authenticate,

  /**
   * 쿼리 검증 및 목록 조회를 담당하는 Controller입니다.
   *
   * Controller는 다음 순서로 동작합니다.
   *
   * 1. req.query를 Zod로 검증
   * 2. req.user와 검증된 query를 Service에 전달
   * 3. 조회 결과를 공통 응답 형식으로 반환
   */
  challengeQueryController.getChallenges
);

export default challengeQueryRouter;
