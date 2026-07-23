import * as adminChallengeService from '../services/adminChallenge.service.js';
import { getAdminChallengesQuerySchema } from '../validations/adminChallenge.validation.js';

export async function getList(req, res) {
  const query = getAdminChallengesQuerySchema.parse(req.query);

  const result = await adminChallengeService.getApplicationList(query);

  res.status(200).json({ success: true, data: result });
}
