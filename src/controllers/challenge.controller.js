import * as challengeService from '../services/challenge.service.js';
import {
  challengeIdParamsSchema,
  challengeListQuerySchema,
  createChallengeSchema,
  deleteChallengeSchema,
  patchChallengeSchema,
} from '../validations/challenge.validation.js';

/**
 * Challenge Controller의 공통 원칙
 *
 * 기존 담당자별 `challenge-manage.controller`와 `challenge-query.controller`
 * 역할을 이 파일로 합쳤습니다. 외부 엔드포인트는 유지하고 Controller 함수만
 * 하나의 모듈에서 export하여 Router가 중복 Handler를 등록하지 않게 합니다.
 *
 * - req.params, req.query, req.body는 반드시 Zod Schema로 검증합니다.
 * - 사용자 ID와 역할은 조작 가능한 body가 아니라 authenticate가 만든
 *   `req.user`에서 가져옵니다.
 * - 상태 전이와 권한 같은 비즈니스 규칙은 Service에 위임합니다.
 * - 모든 성공 응답은 `{ success: true, data }` 형태로 통일합니다.
 * - 별도 try/catch를 두지 않습니다. Express 5가 async 함수의 예외를 전역
 *   error middleware로 전달하므로 여기에서 오류 응답을 중복 작성하지 않습니다.
 */

/**
 * 화면별 챌린지 목록을 조회합니다.
 *
 * 요청 예:
 * GET /challenges?view=participating&search=router&page=1&limit=10
 *
 * Validation 이후 query에는 기본값도 들어 있습니다.
 * - view: public
 * - sort: latest
 * - page: 1
 * - limit: 10
 *
 * 응답:
 * {
 *   success: true,
 *   data: {
 *     challenges: [...],
 *     pagination: { page, limit, total, totalPages, hasNext }
 *   }
 * }
 */
async function getChallenges(req, res) {
  const query = challengeListQuerySchema.parse(req.query);
  const data = await challengeService.getChallenges({
    userId: req.user.userId,
    userRole: req.user.role,
    query,
  });

  return res.status(200).json({ success: true, data });
}

/**
 * 챌린지 상세를 조회합니다.
 *
 * `:id`는 문자열로 들어오지만 Schema에서 양의 정수로 변환합니다.
 * Service는 공개 여부와 신청자/관리자 여부를 판단하고 다음 화면 데이터를
 * 조합합니다.
 * - 챌린지 기본 정보와 originalUrl
 * - 현재 사용자의 참여 및 작업물 ID
 * - 도전 가능 여부
 * - 마감된 경우 최다 추천 작업물
 */
async function getChallenge(req, res) {
  const { id: challengeId } = challengeIdParamsSchema.parse(req.params);
  const data = await challengeService.getChallenge({
    challengeId,
    userId: req.user.userId,
    userRole: req.user.role,
  });

  return res.status(200).json({ success: true, data });
}

/**
 * 신규 챌린지를 신청합니다.
 *
 * 클라이언트는 챌린지 입력값만 보냅니다. 신청자 ID, PENDING 상태,
 * 현재 참여 인원 0명은 서버에서 결정하여 권한/상태 조작을 방지합니다.
 * 리소스가 생성되므로 HTTP 201을 반환합니다.
 */
async function createChallenge(req, res) {
  const body = createChallengeSchema.parse(req.body);
  const data = await challengeService.createChallenge({
    userId: req.user.userId,
    body,
  });

  return res.status(201).json({ success: true, data });
}

/**
 * 하나의 PATCH 명세를 세 가지 기능으로 안전하게 분기합니다.
 *
 * 1. `{ action: 'CANCEL' }`
 *    신청자 본인의 PENDING 신청 취소
 * 2. `{ status: 'APPROVED' | 'REJECTED', reason? }`
 *    관리자의 신청 승인 또는 거절
 * 3. `{ title?, field?, ..., reason }`
 *    관리자의 진행 중 챌린지 정보 수정
 *
 * patchChallengeSchema가 strict union이므로 서로 다른 기능의 필드를 섞으면
 * 400 VALIDATION_ERROR가 발생합니다. 예를 들어 status와 title을 함께 보내
 * 승인 처리와 정보 수정을 한 요청에서 실행하는 것은 허용하지 않습니다.
 *
 * 분기 순서는 각 body를 구분하는 고유 키를 사용합니다.
 * - action은 취소 body에만 존재
 * - status는 상태 변경 body에만 존재
 * - 두 키가 없으면 정보 수정 body
 */
async function patchChallenge(req, res) {
  const { id: challengeId } = challengeIdParamsSchema.parse(req.params);
  const body = patchChallengeSchema.parse(req.body);
  const actor = {
    userId: req.user.userId,
    userRole: req.user.role,
  };

  let data;
  if ('action' in body) {
    data = await challengeService.cancelChallenge({
      challengeId,
      userId: actor.userId,
    });
  } else if ('status' in body) {
    data = await challengeService.updateChallengeStatus({
      challengeId,
      userRole: actor.userRole,
      body,
    });
  } else {
    data = await challengeService.updateChallenge({
      challengeId,
      userRole: actor.userRole,
      body,
    });
  }

  return res.status(200).json({ success: true, data });
}

/**
 * 관리자가 진행 중인 챌린지를 삭제합니다.
 *
 * Route의 authorize가 ADMIN을 1차 확인하고, Service도 직접 호출되거나 라우팅이
 * 바뀌는 경우를 방어하기 위해 역할을 다시 검사합니다. 삭제 사유는 신청자의
 * 알림과 신청 상세에 필요하므로 body에서 필수로 검증합니다.
 *
 * 실제 레코드는 제거하지 않고 Service에서 DELETED/deletedAt/reason을 저장하는
 * soft delete 방식이라 신청자는 이후에도 삭제 상태와 사유를 확인할 수 있습니다.
 */
async function deleteChallenge(req, res) {
  const { id: challengeId } = challengeIdParamsSchema.parse(req.params);
  const { reason } = deleteChallengeSchema.parse(req.body);
  const data = await challengeService.deleteChallenge({
    challengeId,
    userRole: req.user.role,
    reason,
  });

  return res.status(200).json({ success: true, data: null });
}

export {
  getChallenges,
  getChallenge,
  createChallenge,
  patchChallenge,
  deleteChallenge,
};
