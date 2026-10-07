const { ValidationError } = require('../errors');

const REQUEST_PARTS = ['params', 'query', 'body'];

/**
 * Validates request parts against zod schemas. Parsed (and coerced) values are
 * exposed on `req.validated` because Express 5 makes `req.query` read-only.
 *
 *   router.post('/', validate({ body: createClassSchema }), controller.create)
 */
function validate(schemas) {
  return (req, _res, next) => {
    req.validated = {};
    for (const part of REQUEST_PARTS) {
      const schema = schemas[part];
      if (!schema) continue;

      const result = schema.safeParse(req[part] ?? {});
      if (!result.success) {
        const details = result.error.issues.map((issue) => ({
          field: [part, ...issue.path].join('.'),
          message: issue.message,
        }));
        throw new ValidationError('Request validation failed', details);
      }
      req.validated[part] = result.data;
    }
    next();
  };
}

module.exports = { validate };
