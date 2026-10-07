const { Router } = require('express');
const { validate, authenticate, authorize } = require('@fitness/common');
const controller = require('../controllers/member.controller');
const {
  memberIdParams,
  listMembersQuery,
  updateProfileSchema,
  changeRoleSchema,
} = require('../validators/member.validator');

const router = Router();

router.use(authenticate);

router.get('/me', controller.getMe);
router.patch('/me', validate({ body: updateProfileSchema }), controller.updateMe);

router.get('/', authorize('admin'), validate({ query: listMembersQuery }), controller.list);
router.get('/:id', validate({ params: memberIdParams }), controller.getById);
router.patch(
  '/:id/role',
  authorize('admin'),
  validate({ params: memberIdParams, body: changeRoleSchema }),
  controller.changeRole,
);

module.exports = router;
