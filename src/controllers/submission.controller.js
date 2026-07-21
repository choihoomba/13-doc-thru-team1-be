import { z } from 'zod';
import * as submissionService from '../services/submission.service.js';

// Zod
const submissionIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const submissionListQuerySchema = z.object({
  challengeId: z.coerce.number().int().positive().optional(),
  orderBy: z.enum(['likeDesc']).optional(),
  include: z.enum(['user', 'draft']).optional(),
});

const submissionDetailQuerySchema = z.object({
  include: z.enum(['feedback']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(3),
});

const updateSubmissionSchema = z.object({
  content: z.string().min(1, '내용을 입력해주세요'),
});

// 작업물 목록 조회
export async function getSubmissionList(req, res) {
  const query = submissionListQuerySchema.parse(req.query);
  const submissions = await submissionService.getSubmissionList(query);
  res.status(200).json({ success: true, data: submissions });
}

// 작업물 상세 조회 (?include=feedback 일 때만 피드백 포함, ?page=&limit=으로 더보기)
export async function getSubmissionById(req, res) {
  const { id } = submissionIdParamSchema.parse(req.params);
  const { include, page, limit } = submissionDetailQuerySchema.parse(req.query);
  const submission = await submissionService.getSubmissionById(
    id,
    req.user.userId,
    include,
    { page, limit }
  );
  res.status(200).json({ success: true, data: submission });
}

// 작업물 수정
export async function updateSubmission(req, res) {
  const { id } = submissionIdParamSchema.parse(req.params);
  const { content } = updateSubmissionSchema.parse(req.body);
  const submission = await submissionService.updateSubmission(
    req.user.userId,
    id,
    content
  );
  res.status(200).json({ success: true, data: submission });
}
