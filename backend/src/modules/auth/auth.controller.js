const authService = require('./auth.service');
const { success, error } = require('../../utils/apiResponse');
const { validateRegister, validateLogin } = require('../../utils/validators');

const register = async (req, res) => {
  try {
    const errors = validateRegister(req.body);
    if (errors.length > 0) return error(res, 'Validation failed', 400, errors);

    const result = await authService.register(req.body);
    return success(res, result, 'Registration successful', 201);
  } catch (err) {
    return error(res, err.message, 400);
  }
};

const login = async (req, res) => {
  try {
    const errors = validateLogin(req.body);
    if (errors.length > 0) return error(res, 'Validation failed', 400, errors);

    const result = await authService.login(req.body);
    return success(res, result, 'Login successful');
  } catch (err) {
    return error(res, err.message, 401);
  }
};

const getProfile = async (req, res) => {
  try {
    return success(res, req.user, 'Profile retrieved');
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = { register, login, getProfile };
