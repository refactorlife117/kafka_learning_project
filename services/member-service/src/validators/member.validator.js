const { z } = require('zod');
const { ROLES, MEMBERSHIP_PLANS } = require('../constants');

const memberIdParams = z.object({ id: z.string().uuid() });

const listMembersQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  role: z.enum(ROLES).optional(),
});

const updateProfileSchema = z
  .object({
    firstName: z.string().trim().min(1).max(50).optional(),
    lastName: z.string().trim().min(1).max(50).optional(),
    phone: z.string().trim().min(7).max(20).optional(),
    membershipPlan: z.enum(MEMBERSHIP_PLANS).optional(),
  })
  .strict()
  .refine((body) => Object.keys(body).length > 0, { message: 'Provide at least one field' });

const changeRoleSchema = z.object({ role: z.enum(ROLES) }).strict();

module.exports = { memberIdParams, listMembersQuery, updateProfileSchema, changeRoleSchema };
