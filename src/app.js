import env from './config/env.js';
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import errorHandler from './middlewares/error.middleware.js';
import authRouter from './routes/auth.route.js';
import participationRouter from './routes/participations.route.js';
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
app.use('/participations', participationRouter);
app.use('/', likeRouter);

// 에러 핸들러 (항상 마지막)
app.use(errorHandler);

export default app;
