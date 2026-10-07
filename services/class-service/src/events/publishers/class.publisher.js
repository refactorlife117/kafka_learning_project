const { createEvent, enqueueEvent, TOPICS, EVENT_TYPES } = require('@fitness/common');
const config = require('../../config');

const enqueue = (client, type, gymClass, data) =>
  enqueueEvent(client, {
    topic: TOPICS.CLASS_EVENTS,
    key: gymClass.id,
    event: createEvent({ type, source: config.serviceName, data }),
  });

function classScheduled(client, gymClass) {
  return enqueue(client, EVENT_TYPES.CLASS_SCHEDULED, gymClass, {
    classId: gymClass.id,
    title: gymClass.title,
    category: gymClass.category,
    trainerId: gymClass.trainer.id,
    trainerName: gymClass.trainer.name,
    room: gymClass.room,
    startsAt: gymClass.startsAt,
    durationMinutes: gymClass.durationMinutes,
    capacity: gymClass.capacity,
  });
}

function classCancelled(client, gymClass) {
  return enqueue(client, EVENT_TYPES.CLASS_CANCELLED, gymClass, {
    classId: gymClass.id,
    title: gymClass.title,
    startsAt: gymClass.startsAt,
    reason: gymClass.cancellationReason,
  });
}

module.exports = { classScheduled, classCancelled };
