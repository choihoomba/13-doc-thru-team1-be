import app from './app.js';
import env from './config/env.js';

const PORT = env.PORT;

app.listen(PORT, () => {
  console.log(`서버가 ${PORT}에서 작동하고 있어요!`);
});
