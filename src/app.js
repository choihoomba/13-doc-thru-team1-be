import env from './config/env.js';
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import feedbackRouter from './routes/feedback.route.js';
import errorHandler from './middlewares/error.middleware.js';
import authRouter from './routes/auth.route.js';
import submissionRouter from './routes/submission.route.js';
import challengeRouter from './routes/challenge.route.js';
import participationRouter from './routes/participations.route.js';
import draftRouter from './routes/draft.route.js';
import notificationRouter from './routes/notification.route.js';
import likeRouter from './routes/like.route.js';

const app = express();

app.use(morgan('dev'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(
  cors({
    origin: [env.CLIENT_URL, env.SERVER_URL], // 프론트 + 백엔드(swagger) 오리진 허용
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// 라우터 연결 (도메인별로 추가)
app.use('/auth', authRouter);

/**
 * Challenge 목록(query), 상세, 신청(manage), 승인·거절(status), 수정·삭제 기능은
 * challenge.route.js 하나로 통합되어 있습니다. 담당자별 Router를 같은
 * `/challenges` 경로에 여러 번 마운트하면 동일 PATCH Handler가 등록 순서에 따라
 * 가려질 수 있으므로 이 마운트는 반드시 한 번만 유지합니다.
 */
app.use('/challenges', challengeRouter);
app.use('/participations', participationRouter);
app.use('/draft', draftRouter);
app.use('/notifications', notificationRouter);
app.use('/', likeRouter);
app.use('/submissions', submissionRouter);
app.use('/', feedbackRouter);

// 에러 핸들러 (항상 마지막)
app.use(errorHandler);

export default app;
