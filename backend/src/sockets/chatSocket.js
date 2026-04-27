const { Message, Chat, Ticket } = require('../models');
const aiService = require('../modules/ai/ai.service');

const initChatSocket = (io) => {
  io.on('connection', (socket) => {

    socket.on('join_chat', ({ chatId, userId }) => {
      socket.join(`chat_${chatId}`);
    });

    socket.on('join_company', ({ companyId }) => {
      socket.join(`company_${companyId}`);
    });

    socket.on('send_message', async ({ chatId, message, senderType }) => {
      try {
        const savedMessage = await Message.create({ chatId, message, senderType });
        io.to(`chat_${chatId}`).emit('receive_message', savedMessage);

        if (senderType === 'customer') {
          try {
            const chat = await Chat.findByPk(chatId);
            if (!chat) return;

            const history = await Message.findAll({
              where: { chatId },
              order: [['createdAt', 'ASC']],
              limit: 10,
            });

            const sentiment = await aiService.detectSentiment(chatId, message);
            const suggestion = await aiService.generateReply(chatId, message, history, sentiment);
            const category = await aiService.classifyIssue(chatId, message);

            // Reopen if closed and update ticket details
            const updates = { sentiment, lastAISuggestion: suggestion };
            
            // Ticket updates based on AI
            const ticketUpdates = { category };
            if (sentiment === 'angry') {
              ticketUpdates.priority = 'high';
            }

            if (chat.status === 'closed') {
              updates.status = 'open';
              ticketUpdates.status = 'open';
              
              // Notify agents of reopening
              io.to(`company_${chat.companyId}`).emit('notification', { 
                type: 'chat_reopened', 
                payload: { chatId, customerName: chat.customerName } 
              });
            }

            await Ticket.update(ticketUpdates, { where: { chatId } });
            await chat.update(updates);

            // Fetch updated ticket to emit
            const updatedTicket = await Ticket.findOne({ where: { chatId } });

            // Notify open chat room
            io.to(`chat_${chatId}`).emit('ai_suggestion', { 
              chatId, 
              suggestion, 
              sentiment,
              category,
              priority: ticketUpdates.priority || updatedTicket.priority
            });

            // Notify company room for background/sidebar updates
            io.to(`company_${chat.companyId}`).emit('chat_updated', { 
              chatId, 
              sentiment, 
              lastAISuggestion: suggestion,
              status: updates.status || chat.status,
              category,
              priority: ticketUpdates.priority || updatedTicket.priority
            });
          } catch (aiErr) {
            console.warn('AI processing error:', aiErr.message);
          }
        }
      } catch (err) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('typing', ({ chatId, userId, isTyping }) => {
      socket.to(`chat_${chatId}`).emit('user_typing', { userId, isTyping });
    });

    socket.on('chat_closed', ({ chatId }) => {
      io.to(`chat_${chatId}`).emit('chat_closed', { chatId });
    });
  });
};

module.exports = { initChatSocket };
