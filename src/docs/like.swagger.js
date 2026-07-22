// like 엔드포인트 Swagger 문서 (라우터와 분리)
// swagger.js의 apis 경로(./src/docs/*.js)로 스캔됨

/**
 * @openapi
 * tags:
 *   name: Likes
 *   description: 작업물 좋아요(하트) 관련 API
 */

/**
 * @openapi
 * /submissions/{submissionId}/likes:
 *   post:
 *     summary: 좋아요 등록
 *     description: 특정 작업물에 좋아요를 등록합니다. accessToken 쿠키로 인증합니다.
 *     tags: [Likes]
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 31
 *     responses:
 *       201:
 *         description: 등록 성공
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
 *                         liked:
 *                           type: boolean
 *                           example: true
 *                         likeCount:
 *                           type: integer
 *                           example: 2
 *       401:
 *         description: 인증 실패 (UNAUTHORIZED)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: 작업물을 찾을 수 없음 (NOT_FOUND)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: 이미 좋아요를 눌렀거나 마감된 챌린지 (CONFLICT)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     summary: 좋아요 취소
 *     description: 특정 작업물의 좋아요를 취소합니다. accessToken 쿠키로 인증합니다.
 *     tags: [Likes]
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 31
 *     responses:
 *       200:
 *         description: 취소 성공
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
 *                         liked:
 *                           type: boolean
 *                           example: false
 *                         likeCount:
 *                           type: integer
 *                           example: 1
 *       401:
 *         description: 인증 실패 (UNAUTHORIZED)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: 작업물을 찾을 수 없거나 좋아요를 누르지 않음 (NOT_FOUND)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: 마감된 챌린지 (CONFLICT)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
