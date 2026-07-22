import { getChallengesQuerySchema } from '../validations/challenges.validation.js';
import * as getchallengesService from '../services/challenges.service.js';
// 조회 중 발생하는 검증 오류나 비즈니스 예외는
// 전역 에러 핸들러에 넘겨줌
export async function getChallengesController(req, res) {
  // 쿼리스트링 검증
  const query = getChallengesQuerySchema.parse(req.query);
  // 챌린지 목록 조회
  const result = await getchallengesService.getChallenges(query);
  // 조회 결과 반환
  res.status(200).json(result);
}
