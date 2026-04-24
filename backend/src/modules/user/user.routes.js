const express = require('express');
const router = express.Router();
const { getAgents, createAgent, updateUser } = require('./user.controller');
const { verifyToken, roleCheck } = require('../../middlewares/auth.middleware');

router.use(verifyToken);

router.get('/agents', roleCheck('admin'), getAgents);
router.post('/agents', roleCheck('admin'), createAgent);
router.put('/:id', roleCheck('admin'), updateUser);

module.exports = router;
