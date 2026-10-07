const classService = require('../services/class.service');

async function list(req, res) {
  res.json(await classService.listClasses(req.validated.query));
}

async function getById(req, res) {
  res.json(await classService.getClass(req.validated.params.id));
}

async function create(req, res) {
  const gymClass = await classService.scheduleClass(req.validated.body, req.user);
  res.status(201).json(gymClass);
}

async function cancel(req, res) {
  const { id } = req.validated.params;
  res.json(await classService.cancelClass(id, req.validated.body.reason, req.user));
}

async function listTrainers(_req, res) {
  res.json({ items: await classService.listTrainers() });
}

module.exports = { list, getById, create, cancel, listTrainers };
