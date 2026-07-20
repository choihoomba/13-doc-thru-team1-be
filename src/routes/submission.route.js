import { Router } from 'express';
import * as submissionController from '../controllers/submission.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

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
 */
router.get('/', submissionController.getSubmissionList);
// router.get('/', requireAuth, submissionController.getSubmissionList);

/**
 * @openapi
 * /submissions/{id}:
 *   get:
 *     summary: 작업물 상세 조회 (?include=feedback 일 때만 피드백 포함)
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
 *     responses:
 *       200:
 *         description: 작업물 상세
 *       404:
 *         description: 작업물을 찾을 수 없음
 */
router.get('/:id', submissionController.getSubmissionById);
// router.get('/:id', requireAuth, submissionController.getSubmissionById);

/**
 * @openapi
 * /submissions:
 *   post:
 *     summary: 작업물 생성 (제출하기)
 *     tags: [Submission]
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [participationId, content]
 *             properties:
 *               participationId: { type: integer }
 *               content: { type: string }
 *     responses:
 *       201:
 *         description: 생성된 작업물
 */
router.post('/', submissionController.createSubmission);
// router.post('/', requireAuth, submissionController.createSubmission);

/**
 * @openapi
 * /submissions/{id}:
 *   patch:
 *     summary: 작업물 수정
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
 */
router.patch('/:id', submissionController.updateSubmission);
// router.patch('/:id', requireAuth, submissionController.updateSubmission);

/**
 * @openapi
 * /submissions/{id}:
 *   delete:
 *     summary: 작업물 삭제 (soft delete)
 *     tags: [Submission]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204:
 *         description: 삭제 성공
 */
router.delete('/:id', submissionController.deleteSubmission);
// router.delete('/:id', requireAuth, submissionController.deleteSubmission);

export default router;
