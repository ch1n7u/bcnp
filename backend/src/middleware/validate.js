function validate(schema, property = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[property]);

    if (!result.success) {
      return res.status(400).json({
        status: "error",
        message: "Unable to process your request.",
        correlationId: req.correlationId,
        errors: result.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message
        }))
      });
    }

    req[property] = result.data;
    return next();
  };
}

module.exports = validate;
