import submissionService from '../services/submission.service.js';
import {
  submissionIdParamSchema,
  submissionListQuerySchema,
  submissionDetailQuerySchema,
  updateSubmissionSchema,
} from '../validations/submission.validation.js';

// 작업물 목록 조회
export async function getSubmissionList(req, res) {
  const query = submissionListQuerySchema.parse(req.query);
  const data = await submissionService.getSubmissionList(query);
  res.status(200).json({ success: true, data });
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
    req.user.role,
    id,
    content
  );
  res.status(200).json({ success: true, data: submission });
}
