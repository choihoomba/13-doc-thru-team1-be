/**
 * @openapi
 * /draft/{id}:
 *   put:
 *     summary: 작업물 임시저장 (upsert)
 *     tags: [Draft]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: 작업물(Submission) id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               title:
 *                 type: string
 *                 description: 서버에서 trim/공백-빈문자열 정규화를 하지 않고 받은 그대로 저장함. "제목 없음" 표시 등은 프론트에서 처리
 *               content: { type: string }
 *     responses:
 *       200:
 *         description: 저장된 임시저장본
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/Draft'
 *       403:
 *         description: 본인의 작업물이 아니고 어드민도 아님 (FORBIDDEN)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: 작업물을 찾을 수 없음 (삭제된 작업물 포함) (NOT_FOUND)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: 마감된 챌린지의 작업물은 임시저장할 수 없음 (CONFLICT)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @openapi
 * /draft/{id}:
 *   delete:
 *     summary: 임시저장 삭제
 *     tags: [Draft]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: 작업물(Submission) id
 *     responses:
 *       200:
 *         description: 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { nullable: true, example: null }
 *       403:
 *         description: 본인의 작업물이 아니고 어드민도 아님 (FORBIDDEN)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: 작업물 또는 임시저장본을 찾을 수 없음 (삭제된 작업물 포함) (NOT_FOUND)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: 마감된 챌린지의 작업물은 삭제할 수 없음 (CONFLICT)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
