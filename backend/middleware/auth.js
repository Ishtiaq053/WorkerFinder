/**
 * ──────────────────────────────────────────────────────────────
 *  Authentication & Authorization Middleware
 *  
 *  authenticate — verifies the Bearer token on each request
 *  authorize    — restricts access to specific roles
 * ──────────────────────────────────────────────────────────────
 */

const { tokens, users } = require('../models/mockData');
const { decodeToken, sendResponse } = require('../utils/helpers');

/**
 * Middleware: Verify that the request has a valid Bearer token.
 * Attaches req.user and req.token if successful.
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Check for Authorization header
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendResponse(res, 401, false, 'Access denied. No token provided.');
  }

  const token = authHeader.split(' ')[1];

  // Check if token exists in our store
  if (!tokens[token]) {
    return sendResponse(res, 401, false, 'Invalid or expired token.');
  }

  // Decode the token payload
  const decoded = decodeToken(token);
  if (!decoded) {
    return sendResponse(res, 401, false, 'Invalid token format.');
  }

  // Find the user associated with this token
  const user = users.find((u) => u.id === decoded.userId);
  if (!user) {
    return sendResponse(res, 401, false, 'User not found.');
  }

  // Attach user info to the request object (excluding password)
  req.user = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
  req.token = token;

  next();
};

/**
 * Middleware factory: Restrict route access to specific roles.
 * Usage: authorize('admin') or authorize('user', 'admin')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendResponse(res, 401, false, 'Authentication required.');
    }

    if (!roles.includes(req.user.role)) {
      return sendResponse(
        res, 403, false,
        'You do not have permission to perform this action.'
      );
    }

    next();
  };
};

/**
 * Middleware: Restrict route access to admin only.
 * Convenience wrapper around authorize('admin').
 */
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return sendResponse(res, 401, false, 'Authentication required.');
  }

  if (req.user.role !== 'admin') {
    return sendResponse(res, 403, false, 'Admin access required.');
  }

  next();
};

/**
 * Middleware: Restrict route access to workers only.
 */
const isWorker = (req, res, next) => {
  if (!req.user) {
    return sendResponse(res, 401, false, 'Authentication required.');
  }

  if (req.user.role !== 'worker') {
    return sendResponse(res, 403, false, 'Worker access required.');
  }

  next();
};

/**
 * Middleware: Restrict route access to customers only.
 */
const isCustomer = (req, res, next) => {
  if (!req.user) {
    return sendResponse(res, 401, false, 'Authentication required.');
  }

  if (req.user.role !== 'user') {
    return sendResponse(res, 403, false, 'Customer access required.');
  }

  next();
};

module.exports = { authenticate, authorize, isAdmin, isWorker, isCustomer };
