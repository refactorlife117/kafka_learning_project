const { Router } = require('express');
const { validate, authenticate, authorize } = require('@fitness/common');
const controller = require('../controllers/class.controller');
const {
  classIdParams,
  createClassSchema,
  listClassesQuery,
  cancelClassSchema,
} = require('../validators/class.validator');

const router = Router();

// Public: browse the timetable
router.get('/', validate({ query: listClassesQuery }), controller.list);
router.get('/:id', validate({ params: classIdParams }), controller.getById);

// Trainers & admins: manage classes
router.post(
  '/',
  authenticate,
  authorize('trainer', 'admin'),
  validate({ body: createClassSchema }),
  controller.create,
);
router.patch(
  '/:id/cancel',
  authenticate,
  authorize('trainer', 'admin'),
  validate({ params: classIdParams, body: cancelClassSchema }),
  controller.cancel,
);

module.exports = router;
