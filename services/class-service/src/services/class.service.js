const {
  withTransaction,
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} = require('@fitness/common');
const pool = require('../db/pool');
const classRepository = require('../repositories/class.repository');
const trainerRepository = require('../repositories/trainer.repository');
const classPublisher = require('../events/publishers/class.publisher');
const { CLASS_STATUS } = require('../constants');

function resolveTrainerId(input, requester) {
  if (requester.role === 'admin') {
    if (!input.trainerId) {
      throw new BadRequestError('trainerId is required when an admin schedules a class');
    }
    return input.trainerId;
  }
  if (input.trainerId && input.trainerId !== requester.id) {
    throw new ForbiddenError('Trainers can only schedule their own classes');
  }
  return requester.id;
}

async function scheduleClass(input, requester) {
  const trainerId = resolveTrainerId(input, requester);

  return withTransaction(pool, async (client) => {
    const trainer = await trainerRepository.findActiveById(trainerId, client);
    if (!trainer) {
      // The trainers table is fed by Kafka, so a just-promoted trainer may take a moment to appear
      throw new BadRequestError('Trainer not found (if the role was just granted, retry shortly)');
    }

    const gymClass = await classRepository.create({ ...input, trainerId }, client);
    await classPublisher.classScheduled(client, gymClass);
    return gymClass;
  });
}

async function cancelClass(id, reason, requester) {
  return withTransaction(pool, async (client) => {
    const gymClass = await classRepository.findById(id, client);
    if (!gymClass) throw new NotFoundError('Class not found');
    if (requester.role !== 'admin' && gymClass.trainer.id !== requester.id) {
      throw new ForbiddenError('Only the class trainer or an admin can cancel this class');
    }
    if (gymClass.status === CLASS_STATUS.CANCELLED) {
      throw new ConflictError('Class is already cancelled');
    }
    if (new Date(gymClass.startsAt) <= new Date()) {
      throw new ConflictError('Cannot cancel a class that has already started');
    }

    const cancelled = await classRepository.cancel(id, reason, client);
    await classPublisher.classCancelled(client, cancelled);
    return cancelled;
  });
}

async function getClass(id) {
  const gymClass = await classRepository.findById(id);
  if (!gymClass) throw new NotFoundError('Class not found');
  return gymClass;
}

async function listClasses({ page, pageSize, from, ...filters }) {
  const items = await classRepository.findMany({
    ...filters,
    from: from ?? new Date(), // upcoming classes by default
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });
  return { items, page, pageSize };
}

const listTrainers = () => trainerRepository.findAllActive();

module.exports = { scheduleClass, cancelClass, getClass, listClasses, listTrainers };
