// src/docs/participations.swagger.js
// participations 엔드포인트 Swagger 문서 (라우터와 분리)
// swagger.js의 apis 경로(./src/docs/*.js)로 스캔됨

/**
 * @openapi
 * tags:
 *   name: Participations
 *   description: 챌린지 참여(도전하기/포기하기) 관련 API
 */

/**
 * @openapi
 * /participations:
 *   post:
 *     summary: 작업 도전하기
 *     description: >
 *       챌린지에 참여를 등록합니다. accessToken 쿠키로 인증합니다.
 *
 *       - 신규 참여: 참여(Participation)와 빈 제출물(Submission)이 함께 생성됩니다.
 *       - 재도전: 이전에 포기(DROPPED)했던 챌린지는 기존 참여를 ACTIVE로 복구합니다.
 *         이때 기존 제출물도 함께 복구되어(soft delete 해제) 이전 작성 내용을 이어서 사용할 수 있습니다.
 *       - 이미 참여 중(ACTIVE)이거나 제재 이력(REMOVED)이 있는 챌린지는 재참여할 수 없습니다.
 *     tags: [Participations]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [challengeId]
 *             properties:
 *               challengeId:
 *                 type: integer
 *                 example: 7
 *     responses:
 *       201:
 *         description: 참여 등록 또는 재도전 성공
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         participation:
 *                           $ref: '#/components/schemas/Participation'
 *                         submission:
 *                           $ref: '#/components/schemas/Submission'
 *       400:
 *         description: 유효성 검사 실패 (VALIDATION_ERROR)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: 인증 실패 (UNAUTHORIZED)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: 본인이 등록한 챌린지는 참여 불가 (FORBIDDEN)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: 참여할 수 없는 챌린지 (존재하지 않거나 미승인) (NOT_FOUND)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: >
 *           마감된 챌린지 / 참여 정원 마감 / 이미 참여 중인 챌린지 / 제재 이력이 있어 참여 불가한 챌린지 (CONFLICT)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @openapi
 * /participations/{id}:
 *   patch:
 *     summary: 작업 도전 포기하기
 *     description: >
 *       진행 중인 참여를 포기 처리합니다. accessToken 쿠키로 인증합니다.
 *       포기 시 연결된 제출물은 soft delete되고, 챌린지 참여 인원이 1 감소합니다.
 *       이후 같은 챌린지에 재도전하면 포기 시점의 제출물 내용을 그대로 이어서 사용할 수 있습니다.
 *     tags: [Participations]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 포기할 참여(Participation)의 id
 *         example: 1
 *     responses:
 *       200:
 *         description: 참여 포기 성공
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         participation:
 *                           $ref: '#/components/schemas/Participation'
 *                         submission:
 *                           $ref: '#/components/schemas/Submission'
 *       400:
 *         description: 유효성 검사 실패 (VALIDATION_ERROR)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: 인증 실패 (UNAUTHORIZED)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: 본인의 참여가 아님 (FORBIDDEN)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: 존재하지 않는 참여 (NOT_FOUND)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: >
 *           이미 포기했거나 유효하지 않은 참여 / 이미 마감된 챌린지 (CONFLICT)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
