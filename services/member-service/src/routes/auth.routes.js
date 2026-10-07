const { Router } = require('express');
const { validate } = require('@fitness/common');
const controller = require('../controllers/auth.controller');
const { registerSchema, loginSchema } = require('../validators/auth.validator');

const router = Router();

router.post('/register', validate({ body: registerSchema }), controller.register);
router.post('/login', validate({ body: loginSchema }), controller.login);

module.exports = router;
