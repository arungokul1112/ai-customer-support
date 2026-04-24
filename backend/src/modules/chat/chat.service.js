const { Chat, Message, Ticket } = require('../../models');
const { Op } = require('sequelize');
const { notifyNewChat } = require('../notification/notification.service');

const getChats = async (companyId, { status, page = 1, limit = 20 }) => {
  const where = { companyId };
  if (status) where.status = status;

  const offset = (page - 1) * limit;
  const { count, rows } = await Chat.findAndCountAll({
    where,
    include: [
      { model: Message, limit: 1, order: [['createdAt', 'DESC']], separate: true },
      { model: Ticket, attributes: ['id', 'status', 'priority', 'category'] },
    ],
    order: [['updatedAt', 'DESC']],
    limit: parseInt(limit),
    offset,
  });

  return { chats: rows, total: count };
};

const getChatById = async (chatId, companyId) => {
  const chat = await Chat.findOne({
    where: { id: chatId, companyId },
    include: [
      { model: Message, order: [['createdAt', 'ASC']] },
      { model: Ticket },
    ],
  });
  if (!chat) throw new Error('Chat not found');
  return chat;
};

const createChat = async (companyId, { customerName, customerEmail }) => {
  const chat = await Chat.create({ companyId, customerName, customerEmail });

  // Auto-create ticket
  await Ticket.create({
    chatId: chat.id,
    companyId,
    status: 'open',
    priority: 'medium',
    title: `Chat with ${customerName}`,
  });

  notifyNewChat(companyId, chat);

  return chat;
};

const addMessage = async (chatId, companyId, { message, senderType }) => {
  const chat = await Chat.findOne({ where: { id: chatId, companyId } });
  if (!chat) throw new Error('Chat not found');
  if (chat.status === 'closed') throw new Error('Chat is closed');

  return Message.create({ chatId, message, senderType });
};

const closeChat = async (chatId, companyId) => {
  const chat = await Chat.findOne({ where: { id: chatId, companyId } });
  if (!chat) throw new Error('Chat not found');

  chat.status = 'closed';
  await chat.save();

  // Resolve ticket
  await Ticket.update({ status: 'resolved' }, { where: { chatId } });

  return chat;
};

const findChatByCustomer = async (companyId, { customerName, customerEmail }) => {
  const chat = await Chat.findOne({
    where: { 
      companyId, 
      customerName,
      customerEmail: customerEmail || null
    },
    include: [
      { model: Message, order: [['createdAt', 'ASC']] },
      { model: Ticket },
    ],
    order: [['createdAt', 'DESC']], // Get the most recent one
  });
  return chat;
};

module.exports = { getChats, getChatById, createChat, addMessage, closeChat, findChatByCustomer };
