/**
 * @openapi
 * /submissions:
 *   get:
 *     summary: 작업물 목록 조회
 *     tags: [Submission]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: challengeId
 *         schema: { type: integer }
 *       - in: query
 *         name: orderBy
 *         schema: { type: string, enum: [likeDesc] }
 *       - in: query
 *         name: include
 *         schema: { type: string, enum: [user] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         description: 페이지당 개수 (기본값 5, 최대 50)
 *         schema: { type: integer, default: 5 }
 *     responses:
 *       200:
 *         description: 작업물 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     submissions:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/Submission'
 *                           - type: object
 *                             properties:
 *                               user:
 *                                 allOf:
 *                                   - $ref: '#/components/schemas/User'
 *                                   - type: object
 *                                     properties:
 *                                       grade: { type: string, example: EXPERT }
 *                               _count:
 *                                 type: object
 *                                 properties:
 *                                   likes: { type: integer, example: 3 }
 *                                   feedbacks: { type: integer, example: 2 }
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page: { type: integer, example: 1 }
 *                         limit: { type: integer, example: 5 }
 *                         totalCount: { type: integer, example: 12 }
 *                         hasMore: { type: boolean, example: true }
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
 */

/**
 * @openapi
 * /submissions/{id}:
 *   get:
 *     summary: 작업물 상세 조회
 *     tags: [Submission]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 작업물 상세
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Submission'
 *                     - type: object
 *                       properties:
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *                         challenge:
 *                           type: object
 *                           description: 페이지 메인 헤딩용 원본 문서 제목 (draft.title 없을 때 폴백)
 *                           properties:
 *                             title: { type: string }
 *                         draft:
 *                           type: object
 *                           nullable: true
 *                           description: >
 *                             임시저장 내역이 없으면 null. 헤딩은 draft.title ?? challenge.title 순으로 사용.
 *                             본인 작업물이거나 요청자가 어드민이면 content/updatedAt까지 포함되고,
 *                             그 외에는 title만 내려감.
 *                           properties:
 *                             title: { type: string, nullable: true }
 *                             content:
 *                               type: string
 *                               description: 본인 또는 어드민에게만 포함됨
 *                             updatedAt:
 *                               type: string
 *                               format: date-time
 *                               description: 본인 또는 어드민에게만 포함됨
 *                         _count:
 *                           type: object
 *                           properties:
 *                             likes: { type: integer, example: 3 }
 *                         isLiked:
 *                           type: boolean
 *                           description: 현재 로그인한 사용자의 좋아요 여부
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
 *         description: 작업물을 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @openapi
 * /submissions/{id}:
 *   patch:
 *     summary: 작업물 수정 (참여 등록 시 생성된 빈 작업물에 최초 제출 시에도 사용)
 *     tags: [Submission]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string }
 *     responses:
 *       200:
 *         description: 수정된 작업물
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/Submission'
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
 *         description: 본인이 작성한 작업물이 아님 (FORBIDDEN)
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
 *         description: 마감된 챌린지의 작업물은 수정할 수 없음 (CONFLICT)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
