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
 *       참여 등록과 동시에 제출물(Submission)이 빈 내용으로 함께 생성됩니다.
 *     tags: [Participations]
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
 *         description: 참여 등록 성공
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
 *           마감된 챌린지 / 참여 정원 마감 / 이미 참여한 챌린지 (CONFLICT)
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
 *     tags: [Participations]
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
