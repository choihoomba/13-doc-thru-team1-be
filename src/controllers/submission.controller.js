import submissionService from '../services/submission.service.js';
import {
  submissionIdParamSchema,
  submissionListQuerySchema,
  updateSubmissionSchema,
} from '../validations/submission.validation.js';

// 작업물 목록 조회
export async function getSubmissionList(req, res) {
  const query = submissionListQuerySchema.parse(req.query);
  const data = await submissionService.getSubmissionList({
    ...query,
    userId: req.user.userId,
  });
  res.status(200).json({ success: true, data });
}

// 작업물 상세 조회 (피드백은 GET /submissions/:submissionId/feedbacks로 별도 조회)
export async function getSubmissionById(req, res) {
  const { id } = submissionIdParamSchema.parse(req.params);
  const submission = await submissionService.getSubmissionById(
    id,
    req.user.userId,
    req.user.role
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

// 작업물 삭제
// 본인: content 초기화 / 어드민: soft delete (deletedAt 세팅) + 알림
export async function deleteSubmission(req, res) {
  const { id } = submissionIdParamSchema.parse(req.params);
  const submission = await submissionService.deleteSubmission(
    req.user.userId,
    req.user.role,
    id
  );
  res.status(200).json({ success: true, data: null });
}
