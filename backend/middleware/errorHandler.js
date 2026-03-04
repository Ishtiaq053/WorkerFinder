/**
 * ──────────────────────────────────────────────────────────────
 *  Centralized Error Handling Middleware
 *  Catches all unhandled errors and returns a clean response.
 * ──────────────────────────────────────────────────────────────
 */

/**
 * Global error handler — catches errors thrown in routes/controllers.
 * Must have 4 parameters for Express to recognize it as error middleware.
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);
  console.error(err.stack);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    data: null
  });
};

/**
 * 404 handler — called when no route matches the request.
 */
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    data: null
  });
};

module.exports = { errorHandler, notFound };
