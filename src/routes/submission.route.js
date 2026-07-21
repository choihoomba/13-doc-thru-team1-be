import { Router } from 'express';
import * as submissionController from '../controllers/submission.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authenticate, submissionController.getSubmissionList);
router.get('/:id', authenticate, submissionController.getSubmissionById);
<<<<<<< HEAD
router.patch('/:id', authenticate, submissionController.updateSubmission);
=======
router.post('/', authenticate, submissionController.createSubmission);
router.patch('/:id', authenticate, submissionController.updateSubmission);
router.delete('/:id', authenticate, submissionController.deleteSubmission);
>>>>>>> aab66dbaf3c24239e56707395a155b3e77dd9623

export default router;
