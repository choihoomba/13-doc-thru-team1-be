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
 *         schema: { type: string, enum: [user, draft] }
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
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Submission'
 *                       - type: object
 *                         properties:
 *                           user:
 *                             $ref: '#/components/schemas/User'
 *                           draft:
 *                             $ref: '#/components/schemas/Draft'
 *                           _count:
 *                             type: object
 *                             description: include=draft일 때는 응답에 포함되지 않음
 *                             properties:
 *                               likes: { type: integer, example: 3 }
 *                               feedbacks: { type: integer, example: 2 }
 */

/**
 * @openapi
 * /submissions/{id}:
 *   get:
 *     summary: 작업물 상세 조회 (?include=feedback 일 때만 피드백 포함, page/limit으로 더보기)
 *     tags: [Submission]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: include
 *         schema: { type: string, enum: [feedback] }
 *       - in: query
 *         name: page
 *         description: 피드백 페이지 (include=feedback일 때만 사용, 기본값 1)
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         description: 피드백 페이지당 개수 (include=feedback일 때만 사용, 기본값 3, 최대 50)
 *         schema: { type: integer, default: 3 }
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
 *                           description: 임시저장 내역이 없으면 null. 헤딩은 draft.title ?? challenge.title 순으로 사용
 *                           properties:
 *                             title: { type: string, nullable: true }
 *                         _count:
 *                           type: object
 *                           properties:
 *                             likes: { type: integer, example: 3 }
 *                         isLiked:
 *                           type: boolean
 *                           description: 현재 로그인한 사용자의 좋아요 여부
 *                         feedbacks:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Feedback'
 *                         feedbackPagination:
 *                           type: object
 *                           description: include=feedback일 때만 포함
 *                           properties:
 *                             page: { type: integer, example: 1 }
 *                             limit: { type: integer, example: 3 }
 *                             totalCount: { type: integer, example: 8 }
 *                             hasMore: { type: boolean, example: true }
 *       404:
 *         description: 작업물을 찾을 수 없음
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
 *       403:
 *         description: 본인이 작성한 작업물이 아님
 *       404:
 *         description: 작업물을 찾을 수 없음
 */
