const { z } = require('zod');
const { CLASS_CATEGORIES, CLASS_STATUS } = require('../constants');

const classIdParams = z.object({ id: z.string().uuid() });

const createClassSchema = z
  .object({
    title: z.string().trim().min(3).max(100),
    description: z.string().trim().max(1000).optional(),
    category: z.enum(CLASS_CATEGORIES),
    trainerId: z.string().uuid().optional(), // required only when an admin schedules
    room: z.string().trim().max(50).optional(),
    startsAt: z.coerce
      .date()
      .refine((date) => date > new Date(), { message: 'startsAt must be in the future' }),
    durationMinutes: z.number().int().min(15).max(240),
    capacity: z.number().int().min(1).max(200),
  })
  .strict();

const listClassesQuery = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  category: z.enum(CLASS_CATEGORIES).optional(),
  trainerId: z.string().uuid().optional(),
  status: z.enum(Object.values(CLASS_STATUS)).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

const cancelClassSchema = z.object({ reason: z.string().trim().max(500).optional() }).strict();

module.exports = { classIdParams, createClassSchema, listClassesQuery, cancelClassSchema };
