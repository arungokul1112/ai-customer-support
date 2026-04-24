const express = require('express');
const router = express.Router();
const { getChats, getChatById, createChat, closeChat, resumeChat } = require('./chat.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');

router.use(verifyToken);

router.get('/', getChats);
router.post('/resume', resumeChat);
router.get('/:id', getChatById);
router.post('/', createChat);
router.put('/:id/close', closeChat);

module.exports = router;
