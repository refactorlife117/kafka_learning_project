const { z } = require('zod');
const { MEMBERSHIP_PLANS } = require('../constants');

const email = z.string().trim().toLowerCase().email();

// .strict() rejects unknown keys, so a client cannot sneak in e.g. { role: 'admin' }
const registerSchema = z
  .object({
    email,
    password: z.string().min(8).max(72),
    firstName: z.string().trim().min(1).max(50),
    lastName: z.string().trim().min(1).max(50),
    phone: z.string().trim().min(7).max(20).optional(),
    membershipPlan: z.enum(MEMBERSHIP_PLANS).default('basic'),
  })
  .strict();

const loginSchema = z.object({
  email,
  password: z.string().min(1),
});

module.exports = { registerSchema, loginSchema };
