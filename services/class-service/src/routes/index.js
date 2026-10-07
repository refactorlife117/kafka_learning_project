const { Router } = require('express');
const classRoutes = require('./class.routes');
const controller = require('../controllers/class.controller');

const router = Router();

router.use('/classes', classRoutes);
router.get('/trainers', controller.listTrainers);

module.exports = router;
