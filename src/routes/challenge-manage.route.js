import express from 'express';
import * as challengeManageController from '../controllers/challenge-manage.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const challengeManageRouter = express.Router();

// 같은 Challenge 리소스를 여러 명이 나누어 작업하므로 이 Router에는
// 신규 신청(POST)과 관리자 정보 수정(PATCH)만 등록합니다.
// 외부 API 경로에 manage를 붙이지 않고 app.js에서 '/challenges'에 연결하면
// API 명세는 유지하면서 내부 파일의 담당 범위만 구분할 수 있습니다.

// POST는 로그인 사용자 ID가 필요하므로 authenticate를 통과해야 합니다.
// 별도의 ADMIN 전용 authorize를 사용하지 않는 이유는 팀 합의에 따라
// USER와 ADMIN 모두 신규 챌린지를 신청할 수 있기 때문입니다.
challengeManageRouter.post(
  '/',
  authenticate,
  challengeManageController.createChallenge
);

// 미들웨어는 왼쪽부터 실행됩니다. authenticate가 쿠키의 access token을 검증하고
// req.user를 만든 다음, authorize가 ADMIN 권한인지 확인합니다.
// 권한 검사를 Route에서 끝내면 Controller와 Service가 HTTP 인증 방식에 의존하지 않습니다.
challengeManageRouter.patch(
  '/:id',
  authenticate,
  authorize,
  challengeManageController.updateChallenge
);

export default challengeManageRouter;
