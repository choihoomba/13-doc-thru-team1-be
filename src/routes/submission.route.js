import { Router } from 'express';
import * as submissionController from '../controllers/submission.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authenticate, submissionController.getSubmissionList);
router.get('/:id', authenticate, submissionController.getSubmissionById);
router.patch('/:id', authenticate, submissionController.updateSubmission);
router.delete('/:id', authenticate, submissionController.deleteSubmission);

export default router;
