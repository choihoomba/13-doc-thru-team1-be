// src/config/swagger.js
import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '독스루 API',
      version: '1.0.0',
      description: '개발 문서 번역 챌린지 서비스 API',
    },
    servers: [{ url: 'http://localhost:4000' }],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'accessToken',
          description: '로그인 시 HttpOnly 쿠키로 발급되는 accessToken',
        },
      },
      schemas: {
        // 공통 성공 응답 래퍼 — data는 엔드포인트별 실제 타입으로 오버라이드
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              nullable: true,
              description: '엔드포인트별 실제 데이터 (없으면 null)',
            },
          },
        },
        // 공통 에러 응답 래퍼
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: {
              type: 'string',
              example: '유효하지 않은 인증 정보입니다.',
            },
            code: {
              type: 'string',
              example: 'UNAUTHORIZED',
              // 실제 code는 utils/errors.js와 error.middleware.js 참고
              // (팀 전체 code 확정되면 enum 고려)
            },
          },
        },
        AuthUser: {
          type: 'object',
          description: '본인 인증 응답용 유저 정보',
          properties: {
            id: { type: 'integer', example: 1 },
            role: { type: 'string', enum: ['ADMIN', 'USER'] },
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            nickname: { type: 'string', example: '만두' },
            grade: { type: 'string', enum: ['GENERAL', 'EXPERT'] },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            nickname: { type: 'string', example: '만두' },
            role: { type: 'string', enum: ['ADMIN', 'USER'] },
            grade: { type: 'string', enum: ['GENERAL', 'EXPERT'] },
            topLikedCount: { type: 'integer', example: 3 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Challenge: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            title: {
              type: 'string',
              example: 'Next.js - App Router: Routing Fundamentals',
            },
            field: {
              type: 'string',
              enum: [
                'NEXTJS',
                'REACT',
                'MODERNJS',
                'TYPESCRIPT',
                'API',
                'WEB',
                'CAREER',
              ],
            },
            docType: {
              type: 'string',
              enum: ['OFFICIAL', 'BLOG', 'BOOK', 'ETC'],
            },
            content: { type: 'string' },
            originalUrl: { type: 'string', format: 'uri' },
            deadline: { type: 'string', format: 'date-time' },
            maxParticipants: { type: 'integer', example: 10 },
            currentParticipants: { type: 'integer', example: 3 },
            status: {
              type: 'string',
              enum: ['PENDING', 'APPROVED', 'REJECTED', 'DELETED', 'CLOSED'],
            },
            reason: {
              type: 'string',
              nullable: true,
              description: '거절 사유',
            },
            deletedAt: { type: 'string', format: 'date-time', nullable: true },
            userId: { type: 'integer', description: '신청자 id' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Participation: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            status: { type: 'string', enum: ['ACTIVE', 'DROPPED', 'REMOVED'] },
            userId: { type: 'integer' },
            challengeId: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Submission: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            content: { type: 'string', description: '제출 전에는 빈 문자열' },
            deletedAt: { type: 'string', format: 'date-time', nullable: true },
            isTopSubmission: { type: 'boolean' },
            participationId: { type: 'integer' },
            challengeId: { type: 'integer' },
            userId: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Draft: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: {
              type: 'string',
              nullable: true,
              description: '미입력 시 프론트에서 "제목 없음" 처리',
            },
            content: { type: 'string' },
            submissionId: { type: 'integer' },
            userId: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Feedback: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            content: { type: 'string' },
            submissionId: { type: 'integer' },
            userId: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            type: {
              type: 'string',
              enum: [
                'CONTENT_CHANGED',
                'STATUS_CHANGED',
                'NEW_SUBMISSION',
                'NEW_FEEDBACK',
                'DEADLINE',
              ],
            },
            targetType: {
              type: 'string',
              enum: ['CHALLENGE', 'SUBMISSION', 'FEEDBACK'],
            },
            targetId: { type: 'integer' },
            message: { type: 'string' },
            isRead: { type: 'boolean' },
            userId: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js', './src/docs/*.js'],
};

export default swaggerJSDoc(options);
