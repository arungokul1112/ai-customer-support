const aiService = require('./ai.service');
const { Chat, Message } = require('../../models');
const { success, error } = require('../../utils/apiResponse');

const getSuggestion = async (req, res) => {
  try {
    const { chatId, message } = req.body;
    if (!chatId || !message) return error(res, 'chatId and message are required', 400);

    const chat = await Chat.findOne({ where: { id: chatId, companyId: req.user.companyId } });
    if (!chat) return error(res, 'Chat not found', 404);

    const history = await Message.findAll({
      where: { chatId },
      order: [['createdAt', 'ASC']],
      limit: 10,
    });

    const suggestion = await aiService.generateReply(chatId, message, history);
    return success(res, { suggestion }, 'AI suggestion generated');
  } catch (err) {
    return error(res, err.message);
  }
};

const getSummary = async (req, res) => {
  try {
    const { chatId } = req.body;
    if (!chatId) return error(res, 'chatId is required', 400);

    const chat = await Chat.findOne({ where: { id: chatId, companyId: req.user.companyId } });
    if (!chat) return error(res, 'Chat not found', 404);

    const messages = await Message.findAll({
      where: { chatId },
      order: [['createdAt', 'ASC']],
    });

    const summary = await aiService.summarizeChat(chatId, messages);
    return success(res, { summary }, 'Summary generated');
  } catch (err) {
    return error(res, err.message);
  }
};

const getSentiment = async (req, res) => {
  try {
    const { chatId, message } = req.body;
    if (!chatId || !message) return error(res, 'chatId and message are required', 400);

    const sentiment = await aiService.detectSentiment(chatId, message);

    // Update chat sentiment
    await Chat.update({ sentiment }, { where: { id: chatId, companyId: req.user.companyId } });

    return success(res, { sentiment }, 'Sentiment detected');
  } catch (err) {
    return error(res, err.message);
  }
};

const getClassification = async (req, res) => {
  try {
    const { chatId, message } = req.body;
    if (!chatId || !message) return error(res, 'chatId and message are required', 400);

    const category = await aiService.classifyIssue(chatId, message);
    return success(res, { category }, 'Issue classified');
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = { getSuggestion, getSummary, getSentiment, getClassification };
