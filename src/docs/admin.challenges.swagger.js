// src/docs/admin.challenges.swagger.js
// 어드민 챌린지 관리(목록/승인·거절/삭제) Swagger 문서

/**
 * @openapi
 * tags:
 *   name: AdminChallenges
 */

/**
 * @openapi
 * /challenges/admin:
 *   get:
 *     summary: 전체 챌린지 목록 조회 (관리자)
 *     tags: [AdminChallenges]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED, DELETED, CLOSED]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
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
 *                       type: object
 *                       properties:
 *                         challenges:
 *                           type: array
 *                           items:
 *                             allOf:
 *                               - $ref: '#/components/schemas/Challenge'
 *                               - type: object
 *                                 properties:
 *                                   applicantName: { type: string }
 *                                   applicantEmail: { type: string, format: email }
 *                         total: { type: integer }
 *                         page: { type: integer }
 *                         limit: { type: integer }
 *       401:
 *         description: 인증 실패 (UNAUTHORIZED)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: 관리자 권한 없음 (FORBIDDEN)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @openapi
 * /challenges/admin/{id}/status:
 *   patch:
 *     summary: 챌린지 승인/거절 (관리자)
 *     tags: [AdminChallenges]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [APPROVED, REJECTED]
 *               reason:
 *                 type: string
 *                 description: status가 REJECTED일 때 필수
 *     responses:
 *       200:
 *         description: 변경 성공
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Challenge'
 *       400:
 *         description: 유효성 검사 실패 / 거절 사유 누락 (VALIDATION_ERROR / BAD_REQUEST)
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
 *         description: 관리자 권한 없음 (FORBIDDEN)
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
 *         description: PENDING 상태가 아니라 처리 불가 (CONFLICT)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @openapi
 * /challenges/admin/{id}:
 *   delete:
 *     summary: 챌린지 삭제 (Soft Delete, 관리자)
 *     tags: [AdminChallenges]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Challenge'
 *       400:
 *         description: 삭제 사유 누락 (VALIDATION_ERROR / BAD_REQUEST)
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
 *         description: 관리자 권한 없음 (FORBIDDEN)
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
 */
