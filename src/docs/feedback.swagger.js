// feedback 엔드포인트 Swagger 문서 (라우터와 분리)
// swagger.js의 apis 경로(./src/docs/*.js)로 스캔됨

/**
 * @openapi
 * tags:
 *   name: Feedbacks
 *   description: 작업물 피드백 관련 API
 */

/**
 * @openapi
 * /submissions/{submissionId}/feedbacks:
 *   get:
 *     summary: 피드백 목록 조회
 *     description: >
 *       특정 작업물의 피드백 목록을 커서 기반 페이지네이션으로 조회합니다.
 *       비로그인 사용자도 조회할 수 있습니다.
 *     tags: [Feedbacks]
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 5
 *       - in: query
 *         name: cursor
 *         required: false
 *         schema:
 *           type: integer
 *         description: 이전 응답의 nextCursor 값. 다음 페이지 조회 시 사용
 *       - in: query
 *         name: take
 *         required: false
 *         schema:
 *           type: integer
 *           default: 5
 *           maximum: 50
 *         description: 한 번에 가져올 개수
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
 *                         feedbacks:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Feedback'
 *                         nextCursor:
 *                           type: integer
 *                           nullable: true
 *                           description: 다음 페이지 커서 (없으면 null)
 *                         hasNext:
 *                           type: boolean
 *       400:
 *         description: 잘못된 파라미터 (VALIDATION_ERROR)
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
 *   post:
 *     summary: 피드백 작성
 *     description: 특정 작업물에 피드백을 작성합니다. accessToken 쿠키로 인증합니다.
 *     tags: [Feedbacks]
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 39
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *                 example: 번역 잘 하셨네요! 다만 이 부분은 문맥상...
 *     responses:
 *       201:
 *         description: 작성 성공
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Feedback'
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
 *       404:
 *         description: 작업물을 찾을 수 없음 (NOT_FOUND)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: 마감된 챌린지에는 작성 불가 (CONFLICT)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @openapi
 * /feedbacks/{feedbackId}:
 *   patch:
 *     summary: 피드백 수정
 *     description: 본인이 작성한 피드백 또는 어드민이 수정할 수 있습니다.
 *     tags: [Feedbacks]
 *     parameters:
 *       - in: path
 *         name: feedbackId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 51
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *                 example: 수정된 피드백 내용입니다.
 *     responses:
 *       200:
 *         description: 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Feedback'
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
 *         description: 수정 권한 없음 (FORBIDDEN)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: 피드백을 찾을 수 없음 (NOT_FOUND)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: 마감된 챌린지의 피드백은 수정 불가 (CONFLICT)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     summary: 피드백 삭제
 *     description: 본인이 작성한 피드백 또는 어드민이 삭제할 수 있습니다.
 *     tags: [Feedbacks]
 *     parameters:
 *       - in: path
 *         name: feedbackId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 51
 *     responses:
 *       200:
 *         description: 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: 인증 실패 (UNAUTHORIZED)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: 삭제 권한 없음 (FORBIDDEN)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: 피드백을 찾을 수 없음 (NOT_FOUND)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: 마감된 챌린지의 피드백은 삭제 불가 (CONFLICT)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */