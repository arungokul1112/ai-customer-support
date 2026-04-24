const chatService = require('./chat.service');
const { success, error, paginated } = require('../../utils/apiResponse');

const getChats = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const { chats, total } = await chatService.getChats(req.user.companyId, { status, page, limit });
    return paginated(res, chats, total, page, limit, 'Chats retrieved');
  } catch (err) {
    return error(res, err.message);
  }
};

const getChatById = async (req, res) => {
  try {
    const chat = await chatService.getChatById(req.params.id, req.user.companyId);
    return success(res, chat, 'Chat retrieved');
  } catch (err) {
    return error(res, err.message, 404);
  }
};

const createChat = async (req, res) => {
  try {
    const { customerName, customerEmail } = req.body;
    if (!customerName) return error(res, 'Customer name is required', 400);
    const chat = await chatService.createChat(req.user.companyId, { customerName, customerEmail });
    return success(res, chat, 'Chat created', 201);
  } catch (err) {
    return error(res, err.message, 400);
  }
};

const closeChat = async (req, res) => {
  try {
    const chat = await chatService.closeChat(req.params.id, req.user.companyId);
    return success(res, chat, 'Chat closed');
  } catch (err) {
    return error(res, err.message, 400);
  }
};

const resumeChat = async (req, res) => {
  try {
    const { customerName, customerEmail } = req.body;
    if (!customerName || !customerEmail) return error(res, 'Name and Email are required', 400);
    
    const chat = await chatService.findChatByCustomer(req.user.companyId, { customerName, customerEmail });
    if (!chat) return error(res, 'No previous chat found', 404);
    
    return success(res, chat, 'Chat resumed');
  } catch (err) {
    return error(res, err.message, 400);
  }
};

module.exports = { getChats, getChatById, createChat, closeChat, resumeChat };
