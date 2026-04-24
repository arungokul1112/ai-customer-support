const { Message, Chat, Ticket, AILog } = require('../../models');
const { Op, fn, col, literal } = require('sequelize');

const getSentimentTrends = async (companyId) => {
  const chats = await Chat.findAll({
    where: { companyId },
    attributes: ['sentiment', [fn('COUNT', col('id')), 'count']],
    group: ['sentiment'],
  });
  return chats.map((c) => ({ sentiment: c.sentiment, count: parseInt(c.dataValues.count) }));
};

const getTicketCategories = async (companyId) => {
  const tickets = await Ticket.findAll({
    where: { companyId },
    attributes: ['category', [fn('COUNT', col('id')), 'count']],
    group: ['category'],
  });
  return tickets.map((t) => ({ category: t.category, count: parseInt(t.dataValues.count) }));
};

const getAgentPerformance = async (companyId) => {
  const tickets = await Ticket.findAll({
    where: { companyId, status: 'resolved', assignedTo: { [Op.ne]: null } },
    attributes: ['assignedTo', [fn('COUNT', col('Ticket.id')), 'resolved']],
    include: [{ association: 'assignee', attributes: ['name'] }],
    group: ['Ticket.assignedTo', 'assignee.id'],
  });
  return tickets.map((t) => ({
    agentId: t.assignedTo,
    agentName: t.assignee?.name || 'Unknown',
    resolved: parseInt(t.dataValues.resolved),
  }));
};

const getChatVolume = async (companyId) => {
  const chats = await Chat.findAll({
    where: {
      companyId,
      createdAt: { [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
    attributes: [
      [fn('DATE', col('createdAt')), 'date'],
      [fn('COUNT', col('id')), 'count'],
    ],
    group: [fn('DATE', col('createdAt'))],
    order: [[fn('DATE', col('createdAt')), 'ASC']],
  });
  return chats.map((c) => ({ date: c.dataValues.date, count: parseInt(c.dataValues.count) }));
};

module.exports = { getSentimentTrends, getTicketCategories, getAgentPerformance, getChatVolume };
