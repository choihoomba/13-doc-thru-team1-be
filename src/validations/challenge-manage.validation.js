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

// 프론트의 HTML date input과 JSON 요청은 날짜를 문자열로 전송합니다.
// z.coerce.date로 Prisma가 요구하는 Date 객체로 변환한 뒤,
// 이미 지난 챌린지가 신규 생성되거나 마감일이 과거로 수정되는 것을 막습니다.
const deadlineSchema = z.coerce
  .date('deadline은 올바른 날짜 형식이어야 합니다.')
  .refine((deadline) => deadline > new Date(), {
    message: '마감일은 현재 시간보다 이후여야 합니다.',
  });

// 생성과 수정에서 같은 필드 규칙을 재사용하여 엔드포인트마다 글자 수나 enum 기준이
// 달라지는 문제를 막습니다. status, userId, currentParticipants는 의도적으로 포함하지 않아
// 인증 정보와 초기 상태를 클라이언트가 결정하지 못하게 합니다.
const challengeFieldsSchema = z.object(
  {
    title: z
      .string('title은 필수 값입니다.')
      .trim()
      .min(1, '제목을 입력해주세요.')
      .max(100, '제목은 100자 이하이어야 합니다.'),
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
      .max(5000, '챌린지 내용은 5000자 이하이어야 합니다.'),
    originalUrl: z
      .string('originalUrl은 필수 값입니다.')
      .trim()
      .max(2048, '원문 URL은 2048자 이하이어야 합니다.')
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

// partial은 Challenge 필드를 모두 선택값으로 바꾸어 PATCH의 부분 수정을 허용합니다.
// extend로 관리자 수정 사유만 다시 필수값으로 추가합니다.
// 사유는 제목과 함께 Notification.message에 저장되므로 전체 255자 제한을 넘지 않도록
// 100자 이하로 제한합니다.
const updateChallengeSchema = challengeFieldsSchema
  .partial()
  .extend({
    reason: z
      .string('reason은 필수 값입니다.')
      .trim()
      .min(1, '수정 사유를 입력해주세요.')
      .max(100, '수정 사유는 100자 이하이어야 합니다.'),
  })
  // reason만 보내고 실제 변경 필드를 하나도 보내지 않는 의미 없는 PATCH를 차단합니다.
  .refine((data) => Object.keys(data).some((key) => key !== 'reason'), {
    message: '수정할 챌린지 정보를 한 개 이상 입력해주세요.',
  });

// Express의 req.params는 항상 문자열이므로 coerce로 숫자로 바꿉니다.
// NaN, 소수, 0, 음수를 Repository까지 전달하기 전에 Controller 경계에서 차단합니다.
const challengeIdParamsSchema = z.object({
  id: z.coerce
    .number('챌린지 ID는 숫자여야 합니다.')
    .int('챌린지 ID는 정수여야 합니다.')
    .positive('챌린지 ID는 1 이상이어야 합니다.'),
});

export {
  FIELD_VALUES,
  DOC_TYPE_VALUES,
  createChallengeSchema,
  updateChallengeSchema,
  challengeIdParamsSchema,
};
