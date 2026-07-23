// src/docs/my-challenges.swagger.js
// 유저 본인 챌린지(목록/상세/취소) Swagger 문서

/**
 * @openapi
 * tags:
 *   name: MyChallenges
 */

/**
 * @openapi
 * /challenges/users:
 *   get:
 *     summary: 내가 신청한 챌린지 목록 조회
 *     tags: [MyChallenges]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED, DELETED, CLOSED]
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [appliedAt_asc, appliedAt_desc, deadline_asc, deadline_desc]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Challenge'
 *       401:
 *         description: 인증 실패 (UNAUTHORIZED)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @openapi
 * /challenges/users/{id}:
 *   get:
 *     summary: 내가 신청한 챌린지 상세 조회
 *     tags: [MyChallenges]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Challenge'
 *       401:
 *         description: 인증 실패 (UNAUTHORIZED)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: 존재하지 않거나 본인의 챌린지가 아님 (NOT_FOUND)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @openapi
 * /challenges/users/{id}/cancel:
 *   patch:
 *     summary: 승인 대기(PENDING) 신청 취소
 *     tags: [MyChallenges]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
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
 *                         id: { type: integer }
 *       401:
 *         description: 인증 실패 (UNAUTHORIZED)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: 본인의 챌린지가 아님 (FORBIDDEN)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: 챌린지를 찾을 수 없음 (NOT_FOUND)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: 승인 대기 상태가 아니라 취소 불가 (CONFLICT)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
