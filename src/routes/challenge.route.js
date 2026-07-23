import express from 'express';
import * as challengeController from '../controllers/challenge.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

/**
 * Challenge 도메인의 단일 Router입니다.
 *
 * 통합 전에는 목록 조회와 신청·수정 기능이 담당자별 Router로 나뉘어 같은
 * `/challenges` 기본 경로에 여러 번 마운트될 가능성이 있었습니다. 특히 같은
 * `PATCH /challenges/:id`를 두 Router가 각각 등록하면 먼저 응답한 Handler가
 * 뒤 Handler를 가리는 문제가 생길 수 있습니다.
 *
 * 그래서 외부 API 명세는 그대로 유지하면서 Challenge의 모든 method/path를
 * 이 파일 한 곳에서만 선언합니다. `src/app.js`도 이 Router를
 * `app.use('/challenges', challengeRouter)`로 한 번만 연결합니다.
 *
 * 이 레이어의 책임은 다음 세 가지로 제한합니다.
 * 1. URL과 HTTP method를 Controller에 연결
 * 2. 로그인 여부를 확인하는 authenticate 연결
 * 3. Route 단계에서 확정할 수 있는 관리자 전용 권한 연결
 *
 * Query 해석, 상태 전이, 소유권, 마감일, 정원 같은 비즈니스 판단은
 * Controller나 Router가 아니라 Service에서 처리합니다.
 */
const challengeRouter = express.Router();

/**
 * GET /challenges
 * - view query에 따라 공개/참여 중/완료/내 신청/어드민 신청 목록을 조회합니다.
 *
 * POST /challenges
 * - 로그인 사용자가 신규 챌린지를 PENDING 상태로 신청합니다.
 *
 * 같은 컬렉션 리소스를 대상으로 하므로 Express의 route('/') 체인으로 묶되,
 * 각 요청은 서로 다른 Controller 함수로 분리합니다.
 */
challengeRouter
  .route('/')
  .get(authenticate, challengeController.getChallenges)
  .post(authenticate, challengeController.createChallenge);

/**
 * GET /challenges/:id
 * - 공개 챌린지 상세 또는 신청자/관리자용 신청 상세를 조회합니다.
 *
 * PATCH /challenges/:id
 * - 정보 수정, 승인·거절, 승인 대기 신청 취소가 기존 API 명세상 같은 경로를
 *   공유합니다. Router Handler를 여러 개 만들지 않고 Controller에서 검증된
 *   body의 식별 필드(`action`, `status`, 수정 필드)를 기준으로 분기합니다.
 *
 * DELETE /challenges/:id
 * - 진행 중 챌린지를 soft delete합니다.
 * - 삭제는 명세상 명확한 ADMIN 전용 작업이라 authenticate 뒤에 authorize를
 *   연결합니다. PATCH는 신청자 취소도 포함하므로 Route에서 ADMIN으로 고정하지
 *   않고 Service의 각 기능에서 역할과 소유권을 검사합니다.
 */
challengeRouter
  .route('/:id')
  .get(authenticate, challengeController.getChallenge)
  .patch(authenticate, challengeController.patchChallenge)
  .delete(authenticate, authorize, challengeController.deleteChallenge);

export default challengeRouter;
