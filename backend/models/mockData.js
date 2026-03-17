/**
 * ──────────────────────────────────────────────────────────────
 *  Mock Data Store
 *  Simulates database tables using in-memory arrays.
 *  
 *  WHY: This makes it easy to swap in a real database later —
 *  just replace these arrays with database queries.
 * ──────────────────────────────────────────────────────────────
 */

// ─── In-Memory Data Stores (our "tables") ────────────────────

/** Users table — stores all accounts (customers, workers, admin) */
let users = [
  {
    id: 'admin-001',
    name: 'Platform Admin',
    email: 'admin@workerfinder.com',
    password: 'admin123', // In production: hash this!
    role: 'admin',
    createdAt: new Date().toISOString()
  }
];

/** Worker profiles — linked to user accounts via userId */
let workers = [];

/** Jobs — posted by users (customers) */
let jobs = [
  {
    id: 'job-1',
    userId: 'user-admin-001',
    postedBy: 'Test Customer',
    title: 'Kitchen Plumbing Repair',
    description: 'Need a plumber to fix leaking pipes in kitchen sink and replace faucet.',
    category: 'Plumbing',
    budget: 150,
    location: 'Lahore, Pakistan',
    status: 'open',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
  },
  {
    id: 'job-2', 
    userId: 'user-admin-001',
    postedBy: 'Test Customer',
    title: 'House Painting',
    description: 'Need to paint exterior walls of 2-story house. Paint will be provided.',
    category: 'Painting',
    budget: 300,
    location: 'Karachi, Pakistan',
    status: 'open',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
  },
  {
    id: 'job-3',
    userId: 'user-admin-001', 
    postedBy: 'Test Customer',
    title: 'Electrical Wiring Installation',
    description: 'Install new electrical wiring for a room addition. Must be certified electrician.',
    category: 'Electrical',
    budget: 500,
    location: 'Islamabad, Pakistan',
    status: 'open',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() // 3 hours ago
  }
];

/** Applications — workers apply to jobs */
let applications = [];

/** Token store — maps token string → userId (simulates sessions) */
let tokens = {};

/** Notifications — user notifications for various events */
let notifications = [];

/** Reviews — ratings and reviews for workers */
let reviews = [];

/** Saved Jobs — bookmarked/saved jobs by users */
let savedJobs = [];

/** Activity Logs — admin action audit trail */
let activityLogs = [];

// ─── ID Generator ────────────────────────────────────────────
// Simple auto-incrementing counter per entity type
let counters = { 
  user: 1, 
  worker: 1, 
  job: 1, 
  application: 1,
  notification: 1,
  review: 1,
  saved: 1,
  log: 1,
  verification: 1,
  feedback: 1
};

/**
 * Generate a unique ID for a given entity type.
 * Format: "type-timestamp-counter" ensures uniqueness.
 */
const generateId = (type) => {
  counters[type] = (counters[type] || 0) + 1;
  return `${type}-${Date.now()}-${counters[type]}`;
};

// ─── Exports ─────────────────────────────────────────────────
module.exports = {
  users,
  workers,
  jobs,
  applications,
  tokens,
  notifications,
  reviews,
  savedJobs,
  activityLogs,
  generateId
};
