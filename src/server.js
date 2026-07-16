import app from './app.js';
import env from './config/env.js';

const PORT = env.PORT;

app.listen(PORT, () => {
  console.log(`서버가 정상적으로 작동하고 있어요! http://localhost:${PORT}`);
  console.log(`Swagger: http://localhost:${PORT}/api-docs`);
});
