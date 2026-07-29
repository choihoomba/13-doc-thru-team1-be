import { Router } from 'express';
import * as draftController from '../controllers/draft.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.put('/:id', authenticate, draftController.upsertDraft);
router.delete('/:id', authenticate, draftController.deleteDraft);

export default router;
