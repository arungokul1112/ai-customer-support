const { User } = require('../../models');

const getAgents = async (companyId) => {
  return User.findAll({
    where: { companyId, role: 'agent' },
    attributes: { exclude: ['password'] },
    order: [['createdAt', 'DESC']],
  });
};

const createAgent = async (companyId, { name, email, password }) => {
  const existing = await User.findOne({ where: { email, companyId } });
  if (existing) throw new Error('Agent with this email already exists');

  return User.create({ name, email, password, role: 'agent', companyId });
};

const updateUser = async (userId, companyId, updates) => {
  const user = await User.findOne({ where: { id: userId, companyId } });
  if (!user) throw new Error('User not found');

  const allowed = ['name', 'isActive'];
  allowed.forEach((field) => {
    if (updates[field] !== undefined) user[field] = updates[field];
  });

  await user.save();
  const { password: _, ...userData } = user.toJSON();
  return userData;
};

module.exports = { getAgents, createAgent, updateUser };
