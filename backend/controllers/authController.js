/**
 * ──────────────────────────────────────────────────────────────
 *  Auth Controller
 *  Handles signup, login, logout, and profile retrieval.
 * ──────────────────────────────────────────────────────────────
 */

const { users, workers, tokens, generateId } = require('../models/mockData');
const { generateToken, sendResponse, validateFields } = require('../utils/helpers');

/**
 * POST /api/auth/signup
 * Register a new user (customer) or worker account.
 */
const signup = (req, res) => {
  const { name, email, password, role, skill, experience, location } = req.body;

  // 1. Validate common required fields
  const { valid, missing } = validateFields(req.body, ['name', 'email', 'password', 'role']);
  if (!valid) {
    return sendResponse(res, 400, false, `Missing required fields: ${missing.join(', ')}`);
  }

  // 2. Validate role value
  if (!['user', 'worker'].includes(role)) {
    return sendResponse(res, 400, false, 'Role must be either "user" or "worker".');
  }

  // 3. Check for duplicate email
  if (users.find((u) => u.email === email.trim().toLowerCase())) {
    return sendResponse(res, 409, false, 'An account with this email already exists.');
  }

  // 4. If worker, validate extra fields
  if (role === 'worker') {
    const workerCheck = validateFields(req.body, ['skill', 'experience', 'location']);
    if (!workerCheck.valid) {
      return sendResponse(res, 400, false, `Workers must provide: ${workerCheck.missing.join(', ')}`);
    }
  }

  // 5. Create the user account
  const userId = generateId('user');
  const newUser = {
    id: userId,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password, // In production: bcrypt.hashSync(password, 10)
    role,
    createdAt: new Date().toISOString()
  };
  users.push(newUser);

  // 6. If worker, create a worker profile (starts as "pending")
  if (role === 'worker') {
    const workerId = generateId('worker');
    const newWorker = {
      id: workerId,
      userId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      skill: skill.trim(),
      experience: experience.toString().trim(),
      location: location.trim(),
      status: 'pending', // Requires admin approval
      createdAt: new Date().toISOString()
    };
    workers.push(newWorker);
  }

  // 7. Generate auth token
  const token = generateToken(userId, role);
  tokens[token] = userId;

  // 8. Return user data (exclude password from response)
  const { password: _, ...userData } = newUser;

  sendResponse(res, 201, true, 'Account created successfully.', {
    user: userData,
    token
  });
};

/**
 * POST /api/auth/login
 * Authenticate with email and password.
 */
const login = (req, res) => {
  const { email, password } = req.body;

  // 1. Validate fields
  const { valid, missing } = validateFields(req.body, ['email', 'password']);
  if (!valid) {
    return sendResponse(res, 400, false, `Missing required fields: ${missing.join(', ')}`);
  }

  // 2. Find user by email
  const user = users.find((u) => u.email === email.trim().toLowerCase());
  if (!user) {
    return sendResponse(res, 401, false, 'Invalid email or password.');
  }

  // 3. Check password
  if (user.password !== password) {
    return sendResponse(res, 401, false, 'Invalid email or password.');
  }

  // 4. Generate token
  const token = generateToken(user.id, user.role);
  tokens[token] = user.id;

  // 5. Get worker info if applicable
  let workerInfo = null;
  if (user.role === 'worker') {
    workerInfo = workers.find((w) => w.userId === user.id) || null;
  }

  const { password: _, ...userData } = user;

  sendResponse(res, 200, true, 'Login successful.', {
    user: userData,
    worker: workerInfo,
    token
  });
};

/**
 * POST /api/auth/logout
 * Invalidate the current session token.
 */
const logout = (req, res) => {
  if (req.token && tokens[req.token]) {
    delete tokens[req.token];
  }
  sendResponse(res, 200, true, 'Logged out successfully.');
};

/**
 * GET /api/auth/me
 * Get the current user's profile.
 */
const getProfile = (req, res) => {
  const user = users.find((u) => u.id === req.user.id);
  if (!user) {
    return sendResponse(res, 404, false, 'User not found.');
  }

  const { password: _, ...userData } = user;

  // Include worker profile if the user is a worker
  let workerInfo = null;
  if (user.role === 'worker') {
    workerInfo = workers.find((w) => w.userId === user.id) || null;
  }

  sendResponse(res, 200, true, 'Profile retrieved.', {
    user: userData,
    worker: workerInfo
  });
};

module.exports = { signup, login, logout, getProfile };
