const { z } = require('zod');

/**
 * validateRequest — Zod schema validation middleware factory.
 * Usage: router.post('/route', validateRequest(schema), handler)
 * Validates req.body against the provided Zod schema.
 */
const validateRequest = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    next(err);
  }
};

module.exports = validateRequest;
