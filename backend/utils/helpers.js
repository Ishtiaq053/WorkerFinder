/**
 * ──────────────────────────────────────────────────────────────
 *  Utility Helpers
 *  Shared functions used across the backend.
 * ──────────────────────────────────────────────────────────────
 */

const crypto = require('crypto');

/**
 * Generate a mock JWT-like token.
 * In production, you'd use a real JWT library (jsonwebtoken).
 * This encodes user info in base64 + a random signature.
 */
const generateToken = (userId, role) => {
  const payload = JSON.stringify({ userId, role, iat: Date.now() });
  const encoded = Buffer.from(payload).toString('base64');
  const signature = crypto.randomBytes(16).toString('hex');
  return `${encoded}.${signature}`;
};

/**
 * Decode a mock token to extract the payload.
 * Returns null if the token is malformed.
 */
const decodeToken = (token) => {
  try {
    const payloadBase64 = token.split('.')[0];
    return JSON.parse(Buffer.from(payloadBase64, 'base64').toString());
  } catch {
    return null;
  }
};

/**
 * Standard API response formatter.
 * Every API response follows the same shape for consistency.
 */
const sendResponse = (res, statusCode, success, message, data = null) => {
  const response = { success, message };
  if (data !== null) response.data = data;
  return res.status(statusCode).json(response);
};

/**
 * Validate that all required fields exist in the request body.
 * Returns { valid: boolean, missing: string[] }
 */
const validateFields = (body, requiredFields) => {
  const missing = requiredFields.filter(
    (field) => !body[field] || body[field].toString().trim() === ''
  );
  return { valid: missing.length === 0, missing };
};

module.exports = {
  generateToken,
  decodeToken,
  sendResponse,
  validateFields
};
