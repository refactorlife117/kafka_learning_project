const memberService = require('../services/member.service');

async function getMe(req, res) {
  res.json(await memberService.getById(req.user.id));
}

async function updateMe(req, res) {
  res.json(await memberService.updateProfile(req.user.id, req.validated.body));
}

async function list(req, res) {
  res.json(await memberService.list(req.validated.query));
}

async function getById(req, res) {
  res.json(await memberService.getForRequester(req.validated.params.id, req.user));
}

async function changeRole(req, res) {
  res.json(await memberService.changeRole(req.validated.params.id, req.validated.body.role));
}

module.exports = { getMe, updateMe, list, getById, changeRole };
