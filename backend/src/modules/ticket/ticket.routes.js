const express = require('express');
const router = express.Router();
const { createTicket, getTickets, updateTicket, getTicketStats } = require('./ticket.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');

router.use(verifyToken);

router.get('/stats', getTicketStats);
router.get('/', getTickets);
router.post('/', createTicket);
router.put('/:id', updateTicket);

module.exports = router;
