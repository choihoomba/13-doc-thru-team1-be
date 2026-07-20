import { Router } from 'express';
import * as draftController from '../controllers/draft.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

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
 *               title: { type: string, nullable: true }
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
 *         description: 본인의 작업물이 아님
 *       404:
 *         description: 작업물을 찾을 수 없음
 */
router.put('/:id', authenticate, draftController.upsertDraft);

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
 *         description: 본인의 작업물이 아님
 *       404:
 *         description: 작업물 또는 임시저장본을 찾을 수 없음
 */
router.delete('/:id', authenticate, draftController.deleteDraft);

export default router;
