// 챌린지가 '마감' 상태인지 판단하는 공통 기준.
// 크론이 status를 CLOSED로 바꾸지만, 크론 실행 전이라도
// deadline이 지났으면 마감으로 취급해야 안전하다.
// feedback, submission, participation 등에서 챌린지 마감 여부를 판단할 때 사용한다. (공통이라 따로 utils로 뺌)
function isChallengeClosed(challenge) {
  return (
    challenge.status === 'CLOSED' || new Date(challenge.deadline) < new Date()
  );
}

export { isChallengeClosed };
