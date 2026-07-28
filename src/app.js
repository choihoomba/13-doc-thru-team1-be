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
import { registerCronJobs } from './jobs/scheduler.js';

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

app.use('/auth', authRouter);
app.use('/challenges', challengeRouter);
app.use('/participations', participationRouter);
app.use('/drafts', draftRouter);
app.use('/notifications', notificationRouter);
app.use('/submissions', submissionRouter);
// feedback/like 라우터는 자체 파일 내부에 전체 경로(/submissions/:submissionId/...)를 갖고 있어 접두사 없이 마운트
app.use('/', likeRouter);
app.use('/', feedbackRouter);

registerCronJobs();

app.use(errorHandler);

export default app;
