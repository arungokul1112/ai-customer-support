const userService = require('./user.service');
const { success, error } = require('../../utils/apiResponse');

const getAgents = async (req, res) => {
  try {
    const agents = await userService.getAgents(req.user.companyId);
    return success(res, agents, 'Agents retrieved');
  } catch (err) {
    return error(res, err.message);
  }
};

const createAgent = async (req, res) => {
  try {
    const agent = await userService.createAgent(req.user.companyId, req.body);
    const { password: _, ...agentData } = agent.toJSON();
    return success(res, agentData, 'Agent created', 201);
  } catch (err) {
    return error(res, err.message, 400);
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await userService.updateUser(req.params.id, req.user.companyId, req.body);
    return success(res, user, 'User updated');
  } catch (err) {
    return error(res, err.message, 400);
  }
};

module.exports = { getAgents, createAgent, updateUser };
