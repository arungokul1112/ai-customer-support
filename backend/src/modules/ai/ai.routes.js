const express = require('express');
const router = express.Router();
const { getSuggestion, getSummary, getSentiment, getClassification } = require('./ai.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');

router.use(verifyToken);

router.post('/suggest', getSuggestion);
router.post('/summarize', getSummary);
router.post('/sentiment', getSentiment);
router.post('/classify', getClassification);

module.exports = router;
