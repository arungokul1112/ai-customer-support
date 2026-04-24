const analyticsService = require('./analytics.service');
const { success, error } = require('../../utils/apiResponse');

const getSentimentTrends = async (req, res) => {
  try {
    const data = await analyticsService.getSentimentTrends(req.user.companyId);
    return success(res, data, 'Sentiment trends retrieved');
  } catch (err) {
    return error(res, err.message);
  }
};

const getTicketCategories = async (req, res) => {
  try {
    const data = await analyticsService.getTicketCategories(req.user.companyId);
    return success(res, data, 'Ticket categories retrieved');
  } catch (err) {
    return error(res, err.message);
  }
};

const getAgentPerformance = async (req, res) => {
  try {
    const data = await analyticsService.getAgentPerformance(req.user.companyId);
    return success(res, data, 'Agent performance retrieved');
  } catch (err) {
    return error(res, err.message);
  }
};

const getChatVolume = async (req, res) => {
  try {
    const data = await analyticsService.getChatVolume(req.user.companyId);
    return success(res, data, 'Chat volume retrieved');
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = { getSentimentTrends, getTicketCategories, getAgentPerformance, getChatVolume };
