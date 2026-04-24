const express = require('express');
const router = express.Router();
const { getSentimentTrends, getTicketCategories, getAgentPerformance, getChatVolume } = require('./analytics.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');

router.use(verifyToken);

router.get('/sentiment', getSentimentTrends);
router.get('/categories', getTicketCategories);
router.get('/agents', getAgentPerformance);
router.get('/volume', getChatVolume);

module.exports = router;
