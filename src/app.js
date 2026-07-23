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
import challengeManageRouter from './routes/challenge-manage.route.js';
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
// Challenge API는 세 명이 기능별 Router를 나누어도 같은 기본 경로에 연결할 수 있습니다.
// 현재 Router는 POST와 PATCH만 등록하므로 다른 담당자의 GET/DELETE Router와 충돌하지 않습니다.
// 병합할 때 한 Router로 덮어쓰지 말고 각 Router import와 app.use를 모두 유지해야 합니다.
app.use('/challenges', challengeManageRouter);
app.use('/participations', participationRouter);
app.use('/draft', draftRouter);
app.use('/notifications', notificationRouter);
app.use('/', likeRouter);
app.use('/submissions', submissionRouter);
app.use('/', feedbackRouter);

// 에러 핸들러 (항상 마지막)
app.use(errorHandler);

export default app;
