// Notification 라우터에는 요청 처리 코드만 두고 API 명세는 이 파일에서 관리합니다.
// swagger.js의 apis 경로(./src/docs/*.js)가 이 주석을 읽어 Swagger 문서를 만듭니다.

/**
 * @openapi
 * tags:
 *   name: Notifications
 *   description: 로그인 사용자의 알림 조회 및 읽음 처리 API
 */

/**
 * @openapi
 * /notifications:
 *   get:
 *     summary: 알림 목록 조회
 *     description: 로그인 사용자의 알림을 생성일 기준 최신순으로 조회합니다.
 *     tags: [Notifications]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: 알림 목록 조회 성공
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
 *                         $ref: '#/components/schemas/Notification'
 *       401:
 *         description: accessToken이 없거나 유효하지 않음 (UNAUTHORIZED / TOKEN_EXPIRED)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @openapi
 * /notifications/{id}/read:
 *   patch:
 *     summary: 알림 읽음 처리
 *     description: 로그인 사용자가 소유한 알림 한 건의 isRead를 true로 변경합니다.
 *     tags: [Notifications]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 읽음 처리할 알림 ID
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *     responses:
 *       200:
 *         description: 알림 읽음 처리 성공
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Notification'
 *       400:
 *         description: 알림 ID 유효성 검사 실패 (VALIDATION_ERROR)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: accessToken이 없거나 유효하지 않음 (UNAUTHORIZED / TOKEN_EXPIRED)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: 알림이 없거나 로그인 사용자의 알림이 아님 (NOT_FOUND)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
