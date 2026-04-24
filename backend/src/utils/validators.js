const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const isStrongPassword = (password) => {
  return password && password.length >= 6;
};

const isValidUUID = (id) => {
  const re = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return re.test(id);
};

const validateRegister = ({ name, email, password, companyName }) => {
  const errors = [];
  if (!companyName || companyName.trim().length < 2) errors.push('Company name must be at least 2 characters');
  if (!name || name.trim().length < 2) errors.push('Name must be at least 2 characters');
  if (!email || !isValidEmail(email)) errors.push('Valid email is required');
  if (!password || !isStrongPassword(password)) errors.push('Password must be at least 6 characters');
  return errors;
};

const validateLogin = ({ email, password }) => {
  const errors = [];
  if (!email || !isValidEmail(email)) errors.push('Valid email is required');
  if (!password) errors.push('Password is required');
  return errors;
};

module.exports = { isValidEmail, isStrongPassword, isValidUUID, validateRegister, validateLogin };
