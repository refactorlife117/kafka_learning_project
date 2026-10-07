const authService = require('../services/auth.service');

async function register(req, res) {
  const result = await authService.register(req.validated.body);
  res.status(201).json(result);
}

async function login(req, res) {
  const result = await authService.login(req.validated.body);
  res.json(result);
}

module.exports = { register, login };
