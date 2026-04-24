const ticketService = require('./ticket.service');
const { success, error, paginated } = require('../../utils/apiResponse');

const createTicket = async (req, res) => {
  try {
    const ticket = await ticketService.createTicket({ ...req.body, companyId: req.user.companyId });
    return success(res, ticket, 'Ticket created', 201);
  } catch (err) {
    return error(res, err.message, 400);
  }
};

const getTickets = async (req, res) => {
  try {
    const { status, priority, assignedTo, page = 1, limit = 20 } = req.query;
    const { tickets, total } = await ticketService.getTickets(req.user.companyId, { status, priority, assignedTo, page, limit });
    return paginated(res, tickets, total, page, limit, 'Tickets retrieved');
  } catch (err) {
    return error(res, err.message);
  }
};

const updateTicket = async (req, res) => {
  try {
    const ticket = await ticketService.updateTicket(req.params.id, req.user.companyId, req.body);
    return success(res, ticket, 'Ticket updated');
  } catch (err) {
    return error(res, err.message, 400);
  }
};

const getTicketStats = async (req, res) => {
  try {
    const stats = await ticketService.getTicketStats(req.user.companyId);
    return success(res, stats, 'Ticket stats retrieved');
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = { createTicket, getTickets, updateTicket, getTicketStats };
