const { Ticket, User } = require('../../models');
const { Op } = require('sequelize');

const createTicket = async ({ chatId, companyId, priority = 'medium', category = 'general', title }) => {
  return Ticket.create({ chatId, companyId, priority, category, title, status: 'open' });
};

const getTickets = async (companyId, { status, priority, assignedTo, page = 1, limit = 20 }) => {
  const where = { companyId };
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (assignedTo) where.assignedTo = assignedTo;

  const offset = (page - 1) * limit;
  const { count, rows } = await Ticket.findAndCountAll({
    where,
    include: [{ model: User, as: 'assignee', attributes: ['id', 'name', 'email'] }],
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset,
  });

  return { tickets: rows, total: count };
};

const updateTicket = async (ticketId, companyId, updates) => {
  const ticket = await Ticket.findOne({ where: { id: ticketId, companyId } });
  if (!ticket) throw new Error('Ticket not found');

  const allowed = ['status', 'priority', 'category', 'assignedTo', 'title'];
  allowed.forEach((field) => {
    if (updates[field] !== undefined) ticket[field] = updates[field];
  });

  await ticket.save();
  return ticket;
};

const getTicketStats = async (companyId) => {
  const [open, inProgress, resolved, high, medium, low] = await Promise.all([
    Ticket.count({ where: { companyId, status: 'open' } }),
    Ticket.count({ where: { companyId, status: 'in_progress' } }),
    Ticket.count({ where: { companyId, status: 'resolved' } }),
    Ticket.count({ where: { companyId, priority: 'high' } }),
    Ticket.count({ where: { companyId, priority: 'medium' } }),
    Ticket.count({ where: { companyId, priority: 'low' } }),
  ]);

  return {
    byStatus: { open, in_progress: inProgress, resolved },
    byPriority: { high, medium, low },
    total: open + inProgress + resolved,
  };
};

module.exports = { createTicket, getTickets, updateTicket, getTicketStats };
