// 뼈대만 잡아놓은 상태
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
      schemas: {
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
  apis: ['./src/routes/*.js'],
};

export default swaggerJSDoc(options);
