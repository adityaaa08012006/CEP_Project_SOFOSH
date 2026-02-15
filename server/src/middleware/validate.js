export const validate = (schema) => (req, res, next) => {
  try {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    req.validatedBody = result.data;
    next();
  } catch (err) {
    return res.status(400).json({ error: 'Invalid request data' });
  }
};
