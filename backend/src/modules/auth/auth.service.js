const jwt = require('jsonwebtoken');
const { Company, User } = require('../../models');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, companyId: user.companyId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

const register = async ({ companyName, name, email, password }) => {
  // Check if email already exists globally
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) throw new Error('Email already in use');

  // Create company
  const company = await Company.create({ name: companyName });

  // Create admin user
  const user = await User.create({
    name,
    email,
    password,
    role: 'admin',
    companyId: company.id,
  });

  const token = generateToken(user);

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    },
    company: { id: company.id, name: company.name },
  };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ where: { email } });
  if (!user) throw new Error('Invalid email or password');

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new Error('Invalid email or password');

  if (!user.isActive) throw new Error('Account is deactivated');

  const token = generateToken(user);

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    },
  };
};

module.exports = { register, login, generateToken };
