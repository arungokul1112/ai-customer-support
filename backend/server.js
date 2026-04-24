require('dotenv').config();
const http = require('http');
const app = require('./app');
const { initSocket } = require('./src/config/socket');
const { sequelize } = require('./src/models');
const { initChatSocket } = require('./src/sockets/chatSocket');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = initSocket(server);
initChatSocket(io);

sequelize
  .sync({ alter: true })
  .then(() => {
    console.log('✅ Database synced successfully');
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`🤖 AI powered by Groq (${process.env.GROQ_MODEL})`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to sync database:', err);
    process.exit(1);
  });
