import express from 'express';
import * as challengeController from '../controllers/challenge.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const challengeRouter = express.Router();

// Challenge API는 이 Router 하나를 공유합니다. 담당자별로 Router 파일을 새로 만들지 않습니다.
// GET 목록은 반드시 GET '/' 하나만 사용하고 view query로 화면의 세 탭을 구분합니다.
// 예: /challenges?view=participating, view=completed, view=applied

// 인증된 USER와 ADMIN이 신규 챌린지를 신청합니다.
challengeRouter.post('/', authenticate, challengeController.createChallenge);

// authenticate가 req.user를 만든 뒤 authorize가 ADMIN 역할인지 확인합니다.
challengeRouter.patch(
  '/:id',
  authenticate,
  authorize,
  challengeController.updateChallenge
);

// 목록·상세·삭제 담당자는 각 계층의 함수를 먼저 작성한 뒤 이 파일에 라우트를 등록합니다.
// 같은 메서드인 GET '/'와 GET '/:id'는 고정 경로를 동적 경로보다 먼저 배치합니다.

export default challengeRouter;
