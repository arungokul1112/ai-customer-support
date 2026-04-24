const { getIO } = require('../../config/socket');

const broadcastNotification = (companyId, type, payload) => {
  try {
    const io = getIO();
    io.to(`company_${companyId}`).emit('notification', { type, payload, timestamp: new Date() });
  } catch (e) {
    console.warn('Could not broadcast notification:', e.message);
  }
};

const notifyNewChat = (companyId, chat) => {
  broadcastNotification(companyId, 'new_chat', {
    message: `New chat from ${chat.customerName}`,
    chatId: chat.id,
  });
};

const notifyHighPriorityTicket = (companyId, ticket) => {
  broadcastNotification(companyId, 'high_priority_ticket', {
    message: `High priority ticket created`,
    ticketId: ticket.id,
  });
};

module.exports = { broadcastNotification, notifyNewChat, notifyHighPriorityTicket };
