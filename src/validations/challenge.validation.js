import { z } from 'zod';

const FIELD_VALUES = [
  'NEXTJS',
  'REACT',
  'MODERNJS',
  'TYPESCRIPT',
  'API',
  'WEB',
  'CAREER',
];

const DOC_TYPE_VALUES = ['OFFICIAL', 'BLOG', 'BOOK', 'ETC'];

// HTML date input은 날짜 문자열을 전달하므로 Date로 변환한 뒤 미래 날짜인지 검사합니다.
const deadlineSchema = z.coerce
  .date('deadline은 올바른 날짜 형식이어야 합니다.')
  .refine((deadline) => deadline > new Date(), {
    message: '마감일은 현재 시간보다 이후여야 합니다.',
  });

// 생성과 수정에서 같은 필드 규칙을 사용하여 엔드포인트마다 검증 기준이 달라지지 않게 합니다.
const challengeFieldsSchema = z.object(
  {
    title: z
      .string('title은 필수 값입니다.')
      .trim()
      .min(1, '제목을 입력해주세요.')
      .max(100, '제목은 100자 이하여야 합니다.'),
    field: z.enum(FIELD_VALUES, {
      message: '지원하지 않는 분야입니다.',
    }),
    docType: z.enum(DOC_TYPE_VALUES, {
      message: '지원하지 않는 문서 유형입니다.',
    }),
    content: z
      .string('content는 필수 값입니다.')
      .trim()
      .min(1, '챌린지 내용을 입력해주세요.')
      .max(5000, '챌린지 내용은 5000자 이하여야 합니다.'),
    originalUrl: z
      .string('originalUrl은 필수 값입니다.')
      .trim()
      .max(2048, '원문 URL은 2048자 이하여야 합니다.')
      .url('올바른 원문 URL을 입력해주세요.'),
    deadline: deadlineSchema,
    maxParticipants: z.coerce
      .number('maxParticipants는 숫자여야 합니다.')
      .int('최대 참여 인원은 정수여야 합니다.')
      .positive('최대 참여 인원은 1명 이상이어야 합니다.'),
  },
  { message: '요청 본문이 올바르지 않습니다.' }
);

const createChallengeSchema = challengeFieldsSchema;

// PATCH는 전달된 필드만 변경하되, 빈 객체 요청은 실제 수정 내용이 없으므로 거부합니다.
const updateChallengeSchema = challengeFieldsSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: '수정할 챌린지 정보를 한 개 이상 입력해주세요.',
  });

const challengeIdParamsSchema = z.object({
  id: z.coerce
    .number('챌린지 ID는 숫자여야 합니다.')
    .int('챌린지 ID는 정수여야 합니다.')
    .positive('챌린지 ID는 1 이상이어야 합니다.'),
});

// 목록 담당자는 GET /challenges의 query 검증 스키마를 이 파일에 추가하면 됩니다.
// 세 탭은 view=participating|completed|applied 값으로 구분하고 별도 엔드포인트를 만들지 않습니다.

export {
  FIELD_VALUES,
  DOC_TYPE_VALUES,
  createChallengeSchema,
  updateChallengeSchema,
  challengeIdParamsSchema,
};
