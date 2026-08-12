import { AppError } from "./errorHandler.js";


/**
 * @param {object} schemas - any of { body, query, params }, each a zod schema
 */
const validate = (schemas) => (req, res, next) => {
  for (const source of ["body", "query", "params"]) {
    const schema = schemas[source];
    if (!schema) continue;

    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join(".") || source,
        message: issue.message,
      }));
      return next(new AppError(400, "Validation failed", details));
    }

    // req.query is a getter on the Express 5 request, so assigning to it
    // throws. Stash the parsed values alongside instead and read those.
    if (source === "query") {
      req.validatedQuery = result.data;
    } else {
      req[source] = result.data;
    }
  }

  next();
};

export default validate;
