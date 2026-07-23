import dayjs from 'dayjs';

// 날짜 포맷팅 (YYYY-MM-DD)
export const formatDate = (date) => {
  if (!date) return null;
  return dayjs(date).format('YYYY-MM-DD');
};

// Enum 한글 변환
export const docTypeToKo = {
  OFFICIAL: '공식문서',
  BLOG: '블로그',
  BOOK: '도서',
  ETC: '기타',
};

export const fieldToName = {
  NEXTJS: 'Next.js',
  REACT: 'React',
  MODERNJS: 'Modern JS',
  TYPESCRIPT: 'TypeScript',
  API: 'API',
  WEB: 'Web',
  CAREER: 'Career',
};

// 프론트엔드 응답용 DTO 변환 함수
// status(PENDING/APPROVED/REJECTED/DELETED/CLOSED)에 따라 프론트가 다른 화면을 그릴 수 있도록
// reason은 값이 없어도 항상 필드를 포함해 내려줌
export const toChallengeResponse = (challenge) => {
  return {
    id: challenge.id,
    title: challenge.title,
    field: fieldToName[challenge.field] ?? challenge.field,
    docType: docTypeToKo[challenge.docType] ?? challenge.docType,
    content: challenge.content,
    originalUrl: challenge.originalUrl,
    maxParticipants: challenge.maxParticipants,
    currentParticipants: challenge.currentParticipants,
    status: challenge.status,
    reason: challenge.reason ?? null,
    userId: challenge.userId,
    applicantName: challenge.user?.nickname,
    applicantEmail: challenge.user?.email,
    appliedAt: formatDate(challenge.createdAt),
    deadline: formatDate(challenge.deadline),
    updatedAt: formatDate(challenge.updatedAt),
  };
};
