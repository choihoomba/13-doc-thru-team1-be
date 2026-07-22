import * as likeService from '../services/like.service.js';
import { submissionIdParamSchema } from '../validations/like.validation.js';

// POST /submissions/:submissionId/likes
export async function addLike(req, res) {
  const { submissionId } = submissionIdParamSchema.parse(req.params);
  const { userId } = req.user; // authenticate가 심어준 값

  const data = await likeService.addLike(submissionId, userId);
  res.status(201).json({ success: true, data });
}

// DELETE /submissions/:submissionId/likes
export async function removeLike(req, res) {
  const { submissionId } = submissionIdParamSchema.parse(req.params);
  const { userId } = req.user;

  // 취소 후 갱신된 개수를 돌려줘야 하므로 204가 아닌 200 + body
  const data = await likeService.removeLike(submissionId, userId);
  res.status(200).json({ success: true, data });
}
