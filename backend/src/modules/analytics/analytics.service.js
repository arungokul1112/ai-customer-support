const { Message, Chat, Ticket, AILog, User } = require('../../models');
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
  const agents = await User.findAll({
    where: { companyId, role: 'agent' },
    attributes: ['id', 'name'],
    include: [{
      model: Ticket,
      as: 'assignedTickets',
      attributes: ['id', 'status'],
      required: false
    }],
  });

  return agents.map((agent) => {
    const resolvedCount = agent.assignedTickets.filter(t => t.status === 'resolved').length;
    return {
      agentId: agent.id,
      agentName: agent.name,
      resolved: resolvedCount,
    };
  });
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
