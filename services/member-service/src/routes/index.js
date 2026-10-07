const { Router } = require('express');
const authRoutes = require('./auth.routes');
const memberRoutes = require('./member.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/members', memberRoutes);

module.exports = router;
