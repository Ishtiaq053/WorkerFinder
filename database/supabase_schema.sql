-- ============================================================================
-- WORKERFINDER - LABOR MARKETPLACE DATABASE SCHEMA
-- ============================================================================
--
-- Database: Supabase PostgreSQL
-- Version: 1.0.0
-- Author: WorkerFinder Development Team
--
-- ARCHITECTURE NOTES:
-- - Hybrid authentication support (works with or without Supabase Auth)
-- - UUID primary keys for distributed systems compatibility
-- - Strict 3NF relational modeling
-- - Row Level Security (RLS) enabled on all tables
-- - Automated triggers for profile creation and rating calculation
-- - Production-ready indexes for query optimization
--
-- ============================================================================

-- ============================================================================
-- SECTION 1: CLEANUP (Safe for fresh installs)
-- ============================================================================
-- Drop existing objects in reverse dependency order to avoid conflicts

-- Drop triggers first
DROP TRIGGER IF EXISTS trigger_update_worker_rating ON feedbacks;
DROP TRIGGER IF EXISTS trigger_auto_create_profile ON app_users;
DROP TRIGGER IF EXISTS trigger_update_timestamps ON jobs;

-- Drop functions
DROP FUNCTION IF EXISTS update_worker_rating() CASCADE;
DROP FUNCTION IF EXISTS auto_create_profile() CASCADE;
DROP FUNCTION IF EXISTS update_timestamps() CASCADE;

-- Drop views
DROP VIEW IF EXISTS verified_applications_view CASCADE;
DROP VIEW IF EXISTS worker_search_view CASCADE;
DROP VIEW IF EXISTS job_applications_view CASCADE;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS admin_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS feedbacks CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS job_skills CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS verification_requests CASCADE;
DROP TABLE IF EXISTS worker_skills CASCADE;
DROP TABLE IF EXISTS skills CASCADE;
DROP TABLE IF EXISTS saved_jobs CASCADE;
DROP TABLE IF EXISTS customer_profiles CASCADE;
DROP TABLE IF EXISTS worker_profiles CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS app_users CASCADE;

-- Drop enum types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS verification_status CASCADE;
DROP TYPE IF EXISTS job_status CASCADE;
DROP TYPE IF EXISTS application_status CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;

-- ============================================================================
-- SECTION 2: ENUM TYPE DEFINITIONS
-- ============================================================================
-- Using enums ensures data integrity and improves query performance

-- User roles in the system
-- customer: Posts jobs and hires workers
-- worker: Applies for jobs and provides services
-- admin: Platform administrators with full access
CREATE TYPE user_role AS ENUM ('customer', 'worker', 'admin');

-- Worker verification status
-- pending: Awaiting admin review
-- approved: Verified and can access full platform features
-- rejected: Verification denied, can reapply
CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');

-- Job lifecycle status
-- open: Available for applications
-- accepted: Worker assigned, not yet started
-- in_progress: Work has begun
-- completed: Work finished successfully
-- cancelled: Job cancelled by customer
CREATE TYPE job_status AS ENUM ('open', 'accepted', 'in_progress', 'completed', 'cancelled');

-- Application status for job applications
-- pending: Awaiting customer review
-- accepted: Customer accepted this worker
-- rejected: Customer rejected this application
CREATE TYPE application_status AS ENUM ('pending', 'accepted', 'rejected');

-- Notification types for categorization
CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'error', 'system');

-- ============================================================================
-- SECTION 3: CORE USER TABLES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- APP_USERS TABLE
-- -----------------------------------------------------------------------------
-- Central user identity table with HYBRID AUTH SUPPORT
--
-- DESIGN DECISION: auth_user_id is NULLABLE to support:
-- 1. Current Supabase Auth integration
-- 2. Future migration to custom JWT auth if Supabase credits expire
-- 3. Application data remains intact regardless of auth provider
-- -----------------------------------------------------------------------------
CREATE TABLE app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Supabase Auth linkage (NULLABLE for hybrid auth support)
    -- If Supabase Auth is disabled, this becomes NULL but user data persists
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Core identity fields (required regardless of auth provider)
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT, -- For custom auth fallback (Supabase Auth handles this normally)

    -- Role-based access control
    role user_role NOT NULL DEFAULT 'customer',

    -- Account status
    is_active BOOLEAN DEFAULT true,
    is_email_verified BOOLEAN DEFAULT false,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    last_login_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Index for faster auth lookups
CREATE INDEX idx_app_users_auth_user_id ON app_users(auth_user_id) WHERE auth_user_id IS NOT NULL;
CREATE INDEX idx_app_users_email ON app_users(email);
CREATE INDEX idx_app_users_role ON app_users(role);

COMMENT ON TABLE app_users IS 'Central user identity table with hybrid auth support. auth_user_id links to Supabase Auth but is nullable for auth provider migration.';
COMMENT ON COLUMN app_users.auth_user_id IS 'Optional link to Supabase auth.users. NULL if using custom auth or after auth migration.';
COMMENT ON COLUMN app_users.password_hash IS 'For custom auth fallback. Not used when Supabase Auth is active.';

-- -----------------------------------------------------------------------------
-- PROFILES TABLE
-- -----------------------------------------------------------------------------
-- Basic profile information shared by all user types
-- Separated from app_users for normalized design and privacy control
-- -----------------------------------------------------------------------------
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,

    -- Basic profile info
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    phone_number TEXT,

    -- Location info
    city TEXT,
    address TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_city ON profiles(city);

COMMENT ON TABLE profiles IS 'Basic profile information shared by all user types (customer, worker, admin).';

-- -----------------------------------------------------------------------------
-- WORKER_PROFILES TABLE
-- -----------------------------------------------------------------------------
-- Extended profile for workers with verification and rating data
-- One-to-one relationship with app_users where role = 'worker'
-- -----------------------------------------------------------------------------
CREATE TABLE worker_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,

    -- Professional info
    bio TEXT,
    experience_years INTEGER DEFAULT 0 CHECK (experience_years >= 0 AND experience_years <= 60),
    hourly_rate NUMERIC(10, 2),

    -- Contact (shown only when verified)
    mobile_number TEXT,
    address TEXT,

    -- Verification status
    verified BOOLEAN DEFAULT false,
    verification_status verification_status DEFAULT 'pending',
    verified_at TIMESTAMPTZ,

    -- Reputation system
    average_rating NUMERIC(3, 2) DEFAULT 0.00 CHECK (average_rating >= 0 AND average_rating <= 5),
    total_ratings INTEGER DEFAULT 0,
    total_demerits INTEGER DEFAULT 0,
    reputation_score NUMERIC(4, 2) DEFAULT 0.00, -- Calculated: rating - (demerits * 0.1)

    -- Statistics
    jobs_completed INTEGER DEFAULT 0,
    jobs_accepted INTEGER DEFAULT 0,

    -- Account flags
    is_restricted BOOLEAN DEFAULT false,
    restricted_at TIMESTAMPTZ,
    restriction_reason TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_worker_profiles_user_id ON worker_profiles(user_id);
CREATE INDEX idx_worker_profiles_verified ON worker_profiles(verified);
CREATE INDEX idx_worker_profiles_verification_status ON worker_profiles(verification_status);
CREATE INDEX idx_worker_profiles_average_rating ON worker_profiles(average_rating DESC);
CREATE INDEX idx_worker_profiles_reputation_score ON worker_profiles(reputation_score DESC);

COMMENT ON TABLE worker_profiles IS 'Extended profile for workers with verification, ratings, and professional info.';
COMMENT ON COLUMN worker_profiles.reputation_score IS 'Calculated score: average_rating - (total_demerits * 0.1). Updated via trigger.';

-- -----------------------------------------------------------------------------
-- CUSTOMER_PROFILES TABLE
-- -----------------------------------------------------------------------------
-- Extended profile for customers (job posters)
-- One-to-one relationship with app_users where role = 'customer'
-- -----------------------------------------------------------------------------
CREATE TABLE customer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,

    -- Contact info
    phone_number TEXT,
    address TEXT,
    city TEXT,

    -- Statistics
    jobs_posted INTEGER DEFAULT 0,
    jobs_completed INTEGER DEFAULT 0,

    -- Preferences
    preferred_contact_method TEXT DEFAULT 'email',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_customer_profiles_user_id ON customer_profiles(user_id);
CREATE INDEX idx_customer_profiles_city ON customer_profiles(city);

COMMENT ON TABLE customer_profiles IS 'Extended profile for customers (job posters) with contact and statistics.';

-- ============================================================================
-- SECTION 4: SKILLS SYSTEM
-- ============================================================================
-- Normalized skill system for matching workers to jobs
-- Skills are globally defined and used in worker profiles and job requirements

-- -----------------------------------------------------------------------------
-- SKILLS TABLE
-- -----------------------------------------------------------------------------
-- Master list of all available skills on the platform
-- Categories help organize skills in the UI
-- -----------------------------------------------------------------------------
CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    category TEXT, -- e.g., 'Plumbing', 'Electrical', 'Carpentry'
    description TEXT,
    icon_name TEXT, -- Bootstrap icon name for UI
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_skills_name ON skills(name);
CREATE INDEX idx_skills_category ON skills(category);

-- Pre-populate with common labor marketplace skills
INSERT INTO skills (name, category, icon_name, display_order) VALUES
    ('Plumbing', 'Home Services', 'droplet', 1),
    ('Electrical', 'Home Services', 'lightning', 2),
    ('Carpentry', 'Home Services', 'hammer', 3),
    ('Painting', 'Home Services', 'palette', 4),
    ('Construction', 'Building', 'building', 5),
    ('Driving', 'Transportation', 'truck', 6),
    ('Gardening', 'Outdoor', 'flower1', 7),
    ('Mechanic', 'Automotive', 'wrench', 8),
    ('Cleaning', 'Home Services', 'house', 9),
    ('Moving', 'Transportation', 'box', 10),
    ('HVAC', 'Home Services', 'thermometer', 11),
    ('Roofing', 'Building', 'house-door', 12),
    ('Flooring', 'Home Services', 'grid', 13),
    ('Welding', 'Industrial', 'fire', 14),
    ('Masonry', 'Building', 'bricks', 15);

COMMENT ON TABLE skills IS 'Master list of skills used for worker-job matching.';

-- -----------------------------------------------------------------------------
-- WORKER_SKILLS TABLE
-- -----------------------------------------------------------------------------
-- Junction table linking workers to their skills
-- Many-to-many relationship
-- -----------------------------------------------------------------------------
CREATE TABLE worker_skills (
    worker_id UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    proficiency_level INTEGER DEFAULT 3 CHECK (proficiency_level BETWEEN 1 AND 5),
    years_experience INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),

    PRIMARY KEY (worker_id, skill_id)
);

CREATE INDEX idx_worker_skills_worker_id ON worker_skills(worker_id);
CREATE INDEX idx_worker_skills_skill_id ON worker_skills(skill_id);

COMMENT ON TABLE worker_skills IS 'Links workers to their skills with proficiency levels.';

-- ============================================================================
-- SECTION 5: JOB SYSTEM
-- ============================================================================

-- -----------------------------------------------------------------------------
-- JOBS TABLE
-- -----------------------------------------------------------------------------
-- Job postings created by customers
-- Contains all job details and lifecycle status
-- -----------------------------------------------------------------------------
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,

    -- Job details
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    budget NUMERIC(12, 2) NOT NULL CHECK (budget > 0),

    -- Location
    location TEXT NOT NULL,
    city TEXT,
    address_details TEXT,

    -- Schedule
    start_date DATE,
    end_date DATE,
    is_urgent BOOLEAN DEFAULT false,

    -- Status
    status job_status DEFAULT 'open',

    -- Assignment
    assigned_worker_id UUID REFERENCES worker_profiles(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ,

    -- Completion
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,

    -- Statistics
    application_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- Constraints
    CONSTRAINT valid_date_range CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

CREATE INDEX idx_jobs_customer_id ON jobs(customer_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_city ON jobs(city);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX idx_jobs_assigned_worker ON jobs(assigned_worker_id) WHERE assigned_worker_id IS NOT NULL;
CREATE INDEX idx_jobs_open_status ON jobs(status) WHERE status = 'open';

COMMENT ON TABLE jobs IS 'Job postings created by customers with full lifecycle tracking.';

-- -----------------------------------------------------------------------------
-- JOB_SKILLS TABLE
-- -----------------------------------------------------------------------------
-- Junction table linking jobs to required skills
-- Many-to-many relationship
-- -----------------------------------------------------------------------------
CREATE TABLE job_skills (
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    is_required BOOLEAN DEFAULT true, -- Required vs nice-to-have
    created_at TIMESTAMPTZ DEFAULT now(),

    PRIMARY KEY (job_id, skill_id)
);

CREATE INDEX idx_job_skills_job_id ON job_skills(job_id);
CREATE INDEX idx_job_skills_skill_id ON job_skills(skill_id);

COMMENT ON TABLE job_skills IS 'Links jobs to required/preferred skills for matching.';

-- ============================================================================
-- SECTION 6: APPLICATION SYSTEM
-- ============================================================================

-- -----------------------------------------------------------------------------
-- APPLICATIONS TABLE
-- -----------------------------------------------------------------------------
-- Worker applications for jobs
-- Tracks the application lifecycle from submission to decision
-- -----------------------------------------------------------------------------
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,

    -- Application content
    cover_message TEXT,
    proposed_rate NUMERIC(10, 2), -- Worker's proposed rate (optional)
    estimated_duration TEXT, -- e.g., "2-3 days"

    -- Status
    status application_status DEFAULT 'pending',

    -- Decision tracking
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- Unique constraint: one application per worker per job
    CONSTRAINT unique_worker_job_application UNIQUE (job_id, worker_id)
);

CREATE INDEX idx_applications_job_id ON applications(job_id);
CREATE INDEX idx_applications_worker_id ON applications(worker_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_created_at ON applications(created_at DESC);

COMMENT ON TABLE applications IS 'Worker applications for jobs with status tracking.';
COMMENT ON CONSTRAINT unique_worker_job_application ON applications IS 'Prevents duplicate applications from same worker to same job.';

-- ============================================================================
-- SECTION 7: SAVED JOBS (BOOKMARKS)
-- ============================================================================

-- -----------------------------------------------------------------------------
-- SAVED_JOBS TABLE
-- -----------------------------------------------------------------------------
-- Workers can save jobs for later review
-- -----------------------------------------------------------------------------
CREATE TABLE saved_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    saved_at TIMESTAMPTZ DEFAULT now(),

    -- Unique constraint: one save per worker per job
    CONSTRAINT unique_saved_job UNIQUE (worker_id, job_id)
);

CREATE INDEX idx_saved_jobs_worker_id ON saved_jobs(worker_id);
CREATE INDEX idx_saved_jobs_job_id ON saved_jobs(job_id);

COMMENT ON TABLE saved_jobs IS 'Bookmarked jobs for workers to review later.';

-- ============================================================================
-- SECTION 8: VERIFICATION SYSTEM
-- ============================================================================

-- -----------------------------------------------------------------------------
-- VERIFICATION_REQUESTS TABLE
-- -----------------------------------------------------------------------------
-- Worker identity verification submissions
-- Admin reviews and approves/rejects
-- -----------------------------------------------------------------------------
CREATE TABLE verification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,

    -- Identity documents
    cnic_number TEXT NOT NULL, -- National ID number
    mobile_number TEXT NOT NULL,
    address TEXT NOT NULL,

    -- Document images (stored in Supabase Storage)
    id_front_image_url TEXT NOT NULL,
    id_back_image_url TEXT,
    selfie_image_url TEXT, -- Optional selfie for matching

    -- Status
    status verification_status DEFAULT 'pending',

    -- Admin review
    reviewed_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    admin_notes TEXT, -- Internal notes not shown to user

    -- Timestamps
    submitted_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- Constraint: only one pending request per worker
    CONSTRAINT one_pending_request_per_worker
        EXCLUDE (worker_id WITH =) WHERE (status = 'pending')
);

CREATE INDEX idx_verification_requests_worker_id ON verification_requests(worker_id);
CREATE INDEX idx_verification_requests_status ON verification_requests(status);
CREATE INDEX idx_verification_requests_submitted_at ON verification_requests(submitted_at DESC);

COMMENT ON TABLE verification_requests IS 'Worker identity verification submissions for admin review.';
COMMENT ON CONSTRAINT one_pending_request_per_worker ON verification_requests IS 'Prevents multiple pending verification requests from same worker.';

-- ============================================================================
-- SECTION 9: FEEDBACK & REPUTATION SYSTEM
-- ============================================================================

-- -----------------------------------------------------------------------------
-- FEEDBACKS TABLE
-- -----------------------------------------------------------------------------
-- Customer feedback for completed jobs
-- Includes rating and demerit points for reputation calculation
-- -----------------------------------------------------------------------------
CREATE TABLE feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID UNIQUE NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,

    -- Rating
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),

    -- Demerit points (for serious issues)
    demerit_points INTEGER DEFAULT 0 CHECK (demerit_points BETWEEN 0 AND 5),
    demerit_reason TEXT, -- Required if demerit_points > 0

    -- Feedback content
    feedback_text TEXT,

    -- Response from worker (optional)
    worker_response TEXT,
    worker_responded_at TIMESTAMPTZ,

    -- Flags
    is_public BOOLEAN DEFAULT true, -- Show on worker profile
    is_disputed BOOLEAN DEFAULT false,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- Constraint: demerit_reason required if points given
    CONSTRAINT demerit_requires_reason
        CHECK (demerit_points = 0 OR demerit_reason IS NOT NULL)
);

CREATE INDEX idx_feedbacks_worker_id ON feedbacks(worker_id);
CREATE INDEX idx_feedbacks_customer_id ON feedbacks(customer_id);
CREATE INDEX idx_feedbacks_job_id ON feedbacks(job_id);
CREATE INDEX idx_feedbacks_rating ON feedbacks(rating);
CREATE INDEX idx_feedbacks_created_at ON feedbacks(created_at DESC);

COMMENT ON TABLE feedbacks IS 'Customer feedback for completed jobs with rating and demerit system.';
COMMENT ON COLUMN feedbacks.demerit_points IS 'Penalty points for serious issues. Affects reputation_score calculation.';

-- ============================================================================
-- SECTION 10: NOTIFICATIONS SYSTEM
-- ============================================================================

-- -----------------------------------------------------------------------------
-- NOTIFICATIONS TABLE
-- -----------------------------------------------------------------------------
-- In-app notifications for users
-- Supports various notification types and read status
-- -----------------------------------------------------------------------------
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,

    -- Notification content
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    notification_type notification_type DEFAULT 'info',

    -- Link to related entity (optional)
    related_type TEXT, -- e.g., 'job', 'application', 'feedback'
    related_id UUID,
    action_url TEXT, -- URL to navigate to

    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ -- Auto-delete old notifications
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id) WHERE is_read = false;

COMMENT ON TABLE notifications IS 'In-app notifications for users with read tracking.';

-- ============================================================================
-- SECTION 11: ADMIN ACTIVITY LOGS
-- ============================================================================

-- -----------------------------------------------------------------------------
-- ADMIN_LOGS TABLE
-- -----------------------------------------------------------------------------
-- Audit trail for admin actions
-- Important for accountability and debugging
-- -----------------------------------------------------------------------------
CREATE TABLE admin_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES app_users(id) ON DELETE SET NULL,

    -- Action details
    action TEXT NOT NULL, -- e.g., 'approve_worker', 'delete_job', 'restrict_user'
    entity_type TEXT, -- e.g., 'worker', 'job', 'user'
    entity_id UUID,

    -- Change details
    old_values JSONB, -- Previous state
    new_values JSONB, -- New state

    -- Context
    ip_address INET,
    user_agent TEXT,

    -- Additional metadata
    metadata JSONB DEFAULT '{}',
    notes TEXT, -- Admin notes about the action

    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX idx_admin_logs_action ON admin_logs(action);
CREATE INDEX idx_admin_logs_entity ON admin_logs(entity_type, entity_id);
CREATE INDEX idx_admin_logs_created_at ON admin_logs(created_at DESC);

COMMENT ON TABLE admin_logs IS 'Audit trail for admin actions with full change tracking.';

-- ============================================================================
-- SECTION 12: VIEWS
-- ============================================================================

-- -----------------------------------------------------------------------------
-- VERIFIED_APPLICATIONS_VIEW
-- -----------------------------------------------------------------------------
-- Shows applications with worker contact info ONLY for verified workers
-- This enforces the contact visibility rule at the database level
-- -----------------------------------------------------------------------------
CREATE VIEW verified_applications_view AS
SELECT
    a.id AS application_id,
    a.job_id,
    a.worker_id,
    a.cover_message,
    a.proposed_rate,
    a.status AS application_status,
    a.created_at AS applied_at,

    -- Job info
    j.title AS job_title,
    j.budget AS job_budget,
    j.status AS job_status,
    j.customer_id,

    -- Worker info
    p.full_name AS worker_name,
    p.avatar_url AS worker_avatar,
    wp.experience_years,
    wp.average_rating,
    wp.verified AS is_verified,

    -- Contact info (ONLY shown if verified)
    CASE WHEN wp.verified = true THEN wp.mobile_number ELSE NULL END AS worker_phone,
    CASE WHEN wp.verified = true THEN p.phone_number ELSE NULL END AS worker_contact

FROM applications a
JOIN jobs j ON a.job_id = j.id
JOIN worker_profiles wp ON a.worker_id = wp.id
JOIN profiles p ON wp.user_id = p.user_id;

COMMENT ON VIEW verified_applications_view IS 'Applications view that only exposes worker contact info for verified workers.';

-- -----------------------------------------------------------------------------
-- WORKER_SEARCH_VIEW
-- -----------------------------------------------------------------------------
-- Optimized view for searching/filtering workers
-- -----------------------------------------------------------------------------
CREATE VIEW worker_search_view AS
SELECT
    wp.id AS worker_profile_id,
    wp.user_id,
    p.full_name,
    p.avatar_url,
    p.city,
    wp.bio,
    wp.experience_years,
    wp.hourly_rate,
    wp.verified,
    wp.average_rating,
    wp.reputation_score,
    wp.jobs_completed,
    wp.is_restricted,
    au.is_active,

    -- Aggregated skills
    COALESCE(
        ARRAY_AGG(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL),
        ARRAY[]::TEXT[]
    ) AS skills

FROM worker_profiles wp
JOIN app_users au ON wp.user_id = au.id
JOIN profiles p ON wp.user_id = p.user_id
LEFT JOIN worker_skills ws ON wp.id = ws.worker_id
LEFT JOIN skills s ON ws.skill_id = s.id
WHERE au.is_active = true AND wp.is_restricted = false
GROUP BY wp.id, wp.user_id, p.full_name, p.avatar_url, p.city,
         wp.bio, wp.experience_years, wp.hourly_rate, wp.verified,
         wp.average_rating, wp.reputation_score, wp.jobs_completed,
         wp.is_restricted, au.is_active;

COMMENT ON VIEW worker_search_view IS 'Optimized view for worker search with aggregated skills.';

-- -----------------------------------------------------------------------------
-- JOB_APPLICATIONS_VIEW
-- -----------------------------------------------------------------------------
-- View for customers to see all applications for their jobs
-- -----------------------------------------------------------------------------
CREATE VIEW job_applications_view AS
SELECT
    j.id AS job_id,
    j.title AS job_title,
    j.budget,
    j.status AS job_status,
    j.customer_id,

    a.id AS application_id,
    a.status AS application_status,
    a.cover_message,
    a.proposed_rate,
    a.created_at AS applied_at,

    wp.id AS worker_profile_id,
    p.full_name AS worker_name,
    p.avatar_url AS worker_avatar,
    wp.experience_years,
    wp.average_rating,
    wp.jobs_completed,
    wp.verified

FROM jobs j
LEFT JOIN applications a ON j.id = a.job_id
LEFT JOIN worker_profiles wp ON a.worker_id = wp.id
LEFT JOIN profiles p ON wp.user_id = p.user_id;

COMMENT ON VIEW job_applications_view IS 'Comprehensive view of jobs with their applications for customer review.';

-- ============================================================================
-- SECTION 13: FUNCTIONS
-- ============================================================================

-- -----------------------------------------------------------------------------
-- UPDATE_WORKER_RATING FUNCTION
-- -----------------------------------------------------------------------------
-- Automatically updates worker rating and reputation score
-- Called by trigger after feedback insertion
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_worker_rating()
RETURNS TRIGGER AS $$
DECLARE
    v_avg_rating NUMERIC;
    v_total_ratings INTEGER;
    v_total_demerits INTEGER;
    v_reputation_score NUMERIC;
BEGIN
    -- Calculate new averages
    SELECT
        COALESCE(AVG(rating), 0),
        COUNT(*),
        COALESCE(SUM(demerit_points), 0)
    INTO v_avg_rating, v_total_ratings, v_total_demerits
    FROM feedbacks
    WHERE worker_id = NEW.worker_id;

    -- Calculate reputation score: rating - (demerits * 0.1), minimum 0
    v_reputation_score := GREATEST(v_avg_rating - (v_total_demerits * 0.1), 0);

    -- Update worker profile
    UPDATE worker_profiles
    SET
        average_rating = ROUND(v_avg_rating, 2),
        total_ratings = v_total_ratings,
        total_demerits = v_total_demerits,
        reputation_score = ROUND(v_reputation_score, 2),
        updated_at = now()
    WHERE id = NEW.worker_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_worker_rating() IS 'Updates worker rating and reputation score after feedback submission.';

-- -----------------------------------------------------------------------------
-- AUTO_CREATE_PROFILE FUNCTION
-- -----------------------------------------------------------------------------
-- Automatically creates profile and role-specific profile when user is created
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION auto_create_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Create base profile
    INSERT INTO profiles (user_id, full_name)
    VALUES (NEW.id, COALESCE(split_part(NEW.email, '@', 1), 'User'));

    -- Create role-specific profile
    IF NEW.role = 'worker' THEN
        INSERT INTO worker_profiles (user_id)
        VALUES (NEW.id);
    ELSIF NEW.role = 'customer' THEN
        INSERT INTO customer_profiles (user_id)
        VALUES (NEW.id);
    END IF;

    -- Create welcome notification
    INSERT INTO notifications (user_id, title, message, notification_type)
    VALUES (
        NEW.id,
        'Welcome to WorkerFinder!',
        CASE
            WHEN NEW.role = 'worker' THEN 'Your worker account is created. Complete your profile and verify your identity to start applying for jobs.'
            WHEN NEW.role = 'customer' THEN 'Your account is ready. Start posting jobs to find skilled workers.'
            ELSE 'Your admin account has been created.'
        END,
        'success'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auto_create_profile() IS 'Automatically creates profiles when new user is registered.';

-- -----------------------------------------------------------------------------
-- UPDATE_TIMESTAMPS FUNCTION
-- -----------------------------------------------------------------------------
-- Generic function to update updated_at timestamp
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_timestamps() IS 'Generic trigger function to update updated_at timestamp.';

-- -----------------------------------------------------------------------------
-- INCREMENT_APPLICATION_COUNT FUNCTION
-- -----------------------------------------------------------------------------
-- Updates job application count when applications change
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_application_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE jobs SET application_count = application_count + 1 WHERE id = NEW.job_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE jobs SET application_count = application_count - 1 WHERE id = OLD.job_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- UPDATE_WORKER_ON_VERIFICATION FUNCTION
-- -----------------------------------------------------------------------------
-- Updates worker profile when verification is approved
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_worker_on_verification()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        UPDATE worker_profiles
        SET
            verified = true,
            verification_status = 'approved',
            verified_at = now(),
            updated_at = now()
        WHERE id = NEW.worker_id;

        -- Create notification
        INSERT INTO notifications (user_id, title, message, notification_type)
        SELECT
            wp.user_id,
            'Verification Approved!',
            'Congratulations! Your identity has been verified. You can now apply for jobs and your contact info will be visible to customers.',
            'success'
        FROM worker_profiles wp WHERE wp.id = NEW.worker_id;

    ELSIF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
        UPDATE worker_profiles
        SET
            verification_status = 'rejected',
            updated_at = now()
        WHERE id = NEW.worker_id;

        -- Create notification
        INSERT INTO notifications (user_id, title, message, notification_type)
        SELECT
            wp.user_id,
            'Verification Not Approved',
            'Your verification request was not approved. Reason: ' || COALESCE(NEW.rejection_reason, 'Please contact support for details.'),
            'warning'
        FROM worker_profiles wp WHERE wp.id = NEW.worker_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 14: TRIGGERS
-- ============================================================================

-- Update worker rating after feedback
CREATE TRIGGER trigger_update_worker_rating
    AFTER INSERT OR UPDATE ON feedbacks
    FOR EACH ROW
    EXECUTE FUNCTION update_worker_rating();

-- Auto-create profile on user creation
CREATE TRIGGER trigger_auto_create_profile
    AFTER INSERT ON app_users
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_profile();

-- Update timestamps on jobs
CREATE TRIGGER trigger_update_jobs_timestamp
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamps();

-- Update timestamps on profiles
CREATE TRIGGER trigger_update_profiles_timestamp
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamps();

-- Update timestamps on worker_profiles
CREATE TRIGGER trigger_update_worker_profiles_timestamp
    BEFORE UPDATE ON worker_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamps();

-- Update application count
CREATE TRIGGER trigger_update_application_count
    AFTER INSERT OR DELETE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION update_application_count();

-- Handle verification approval
CREATE TRIGGER trigger_verification_status_change
    AFTER UPDATE ON verification_requests
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION update_worker_on_verification();

-- ============================================================================
-- SECTION 15: ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- APP_USERS POLICIES
-- -----------------------------------------------------------------------------
-- Users can view their own data
CREATE POLICY "Users can view own data"
    ON app_users FOR SELECT
    USING (auth.uid() = auth_user_id);

-- Users can update their own data
CREATE POLICY "Users can update own data"
    ON app_users FOR UPDATE
    USING (auth.uid() = auth_user_id)
    WITH CHECK (auth.uid() = auth_user_id);

-- Admins can view all users
CREATE POLICY "Admins can view all users"
    ON app_users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM app_users au
            WHERE au.auth_user_id = auth.uid()
            AND au.role = 'admin'
        )
    );

-- -----------------------------------------------------------------------------
-- PROFILES POLICIES
-- -----------------------------------------------------------------------------
-- Anyone can view profiles (public info)
CREATE POLICY "Profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM app_users au
            WHERE au.id = profiles.user_id
            AND au.auth_user_id = auth.uid()
        )
    );

-- -----------------------------------------------------------------------------
-- WORKER_PROFILES POLICIES
-- -----------------------------------------------------------------------------
-- Public can view verified worker profiles
CREATE POLICY "Anyone can view worker profiles"
    ON worker_profiles FOR SELECT
    USING (true);

-- Workers can update their own profile
CREATE POLICY "Workers can update own profile"
    ON worker_profiles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM app_users au
            WHERE au.id = worker_profiles.user_id
            AND au.auth_user_id = auth.uid()
        )
    );

-- -----------------------------------------------------------------------------
-- CUSTOMER_PROFILES POLICIES
-- -----------------------------------------------------------------------------
-- Users can view customer profiles
CREATE POLICY "Anyone can view customer profiles"
    ON customer_profiles FOR SELECT
    USING (true);

-- Customers can update their own profile
CREATE POLICY "Customers can update own profile"
    ON customer_profiles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM app_users au
            WHERE au.id = customer_profiles.user_id
            AND au.auth_user_id = auth.uid()
        )
    );

-- -----------------------------------------------------------------------------
-- SKILLS POLICIES
-- -----------------------------------------------------------------------------
-- Anyone can view skills
CREATE POLICY "Skills are viewable by everyone"
    ON skills FOR SELECT
    USING (true);

-- Only admins can manage skills
CREATE POLICY "Admins can manage skills"
    ON skills FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM app_users au
            WHERE au.auth_user_id = auth.uid()
            AND au.role = 'admin'
        )
    );

-- -----------------------------------------------------------------------------
-- WORKER_SKILLS POLICIES
-- -----------------------------------------------------------------------------
-- Anyone can view worker skills
CREATE POLICY "Worker skills are viewable by everyone"
    ON worker_skills FOR SELECT
    USING (true);

-- Workers can manage their own skills
CREATE POLICY "Workers can manage own skills"
    ON worker_skills FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM worker_profiles wp
            JOIN app_users au ON wp.user_id = au.id
            WHERE wp.id = worker_skills.worker_id
            AND au.auth_user_id = auth.uid()
        )
    );

-- -----------------------------------------------------------------------------
-- JOBS POLICIES
-- -----------------------------------------------------------------------------
-- Anyone can view open jobs
CREATE POLICY "Open jobs are viewable by everyone"
    ON jobs FOR SELECT
    USING (status = 'open' OR
        EXISTS (
            SELECT 1 FROM customer_profiles cp
            JOIN app_users au ON cp.user_id = au.id
            WHERE cp.id = jobs.customer_id
            AND au.auth_user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM worker_profiles wp
            JOIN app_users au ON wp.user_id = au.id
            WHERE wp.id = jobs.assigned_worker_id
            AND au.auth_user_id = auth.uid()
        )
    );

-- Customers can create jobs
CREATE POLICY "Customers can create jobs"
    ON jobs FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM customer_profiles cp
            JOIN app_users au ON cp.user_id = au.id
            WHERE cp.id = jobs.customer_id
            AND au.auth_user_id = auth.uid()
            AND au.role = 'customer'
        )
    );

-- Customers can update their own jobs
CREATE POLICY "Customers can update own jobs"
    ON jobs FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM customer_profiles cp
            JOIN app_users au ON cp.user_id = au.id
            WHERE cp.id = jobs.customer_id
            AND au.auth_user_id = auth.uid()
        )
    );

-- Customers can delete their own open jobs
CREATE POLICY "Customers can delete own open jobs"
    ON jobs FOR DELETE
    USING (
        status = 'open' AND
        EXISTS (
            SELECT 1 FROM customer_profiles cp
            JOIN app_users au ON cp.user_id = au.id
            WHERE cp.id = jobs.customer_id
            AND au.auth_user_id = auth.uid()
        )
    );

-- -----------------------------------------------------------------------------
-- JOB_SKILLS POLICIES
-- -----------------------------------------------------------------------------
-- Anyone can view job skills
CREATE POLICY "Job skills are viewable by everyone"
    ON job_skills FOR SELECT
    USING (true);

-- Job owners can manage job skills
CREATE POLICY "Job owners can manage job skills"
    ON job_skills FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM jobs j
            JOIN customer_profiles cp ON j.customer_id = cp.id
            JOIN app_users au ON cp.user_id = au.id
            WHERE j.id = job_skills.job_id
            AND au.auth_user_id = auth.uid()
        )
    );

-- -----------------------------------------------------------------------------
-- APPLICATIONS POLICIES
-- -----------------------------------------------------------------------------
-- Workers can view their own applications
CREATE POLICY "Workers can view own applications"
    ON applications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM worker_profiles wp
            JOIN app_users au ON wp.user_id = au.id
            WHERE wp.id = applications.worker_id
            AND au.auth_user_id = auth.uid()
        )
    );

-- Customers can view applications for their jobs
CREATE POLICY "Customers can view applications for their jobs"
    ON applications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM jobs j
            JOIN customer_profiles cp ON j.customer_id = cp.id
            JOIN app_users au ON cp.user_id = au.id
            WHERE j.id = applications.job_id
            AND au.auth_user_id = auth.uid()
        )
    );

-- Workers can create applications
CREATE POLICY "Workers can create applications"
    ON applications FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM worker_profiles wp
            JOIN app_users au ON wp.user_id = au.id
            WHERE wp.id = applications.worker_id
            AND au.auth_user_id = auth.uid()
            AND au.role = 'worker'
            AND wp.verified = true
        )
    );

-- Customers can update application status
CREATE POLICY "Customers can update application status"
    ON applications FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM jobs j
            JOIN customer_profiles cp ON j.customer_id = cp.id
            JOIN app_users au ON cp.user_id = au.id
            WHERE j.id = applications.job_id
            AND au.auth_user_id = auth.uid()
        )
    );

-- -----------------------------------------------------------------------------
-- SAVED_JOBS POLICIES
-- -----------------------------------------------------------------------------
-- Workers can view their saved jobs
CREATE POLICY "Workers can view own saved jobs"
    ON saved_jobs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM worker_profiles wp
            JOIN app_users au ON wp.user_id = au.id
            WHERE wp.id = saved_jobs.worker_id
            AND au.auth_user_id = auth.uid()
        )
    );

-- Workers can manage their saved jobs
CREATE POLICY "Workers can manage own saved jobs"
    ON saved_jobs FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM worker_profiles wp
            JOIN app_users au ON wp.user_id = au.id
            WHERE wp.id = saved_jobs.worker_id
            AND au.auth_user_id = auth.uid()
        )
    );

-- -----------------------------------------------------------------------------
-- VERIFICATION_REQUESTS POLICIES
-- -----------------------------------------------------------------------------
-- Workers can view their own verification requests
CREATE POLICY "Workers can view own verification requests"
    ON verification_requests FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM worker_profiles wp
            JOIN app_users au ON wp.user_id = au.id
            WHERE wp.id = verification_requests.worker_id
            AND au.auth_user_id = auth.uid()
        )
    );

-- Workers can submit verification requests
CREATE POLICY "Workers can submit verification requests"
    ON verification_requests FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM worker_profiles wp
            JOIN app_users au ON wp.user_id = au.id
            WHERE wp.id = verification_requests.worker_id
            AND au.auth_user_id = auth.uid()
            AND au.role = 'worker'
        )
    );

-- Admins can view all verification requests
CREATE POLICY "Admins can view all verification requests"
    ON verification_requests FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM app_users au
            WHERE au.auth_user_id = auth.uid()
            AND au.role = 'admin'
        )
    );

-- Admins can update verification requests
CREATE POLICY "Admins can update verification requests"
    ON verification_requests FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM app_users au
            WHERE au.auth_user_id = auth.uid()
            AND au.role = 'admin'
        )
    );

-- -----------------------------------------------------------------------------
-- FEEDBACKS POLICIES
-- -----------------------------------------------------------------------------
-- Anyone can view public feedbacks
CREATE POLICY "Public feedbacks are viewable"
    ON feedbacks FOR SELECT
    USING (is_public = true);

-- Customers can create feedback for their completed jobs
CREATE POLICY "Customers can create feedback"
    ON feedbacks FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM jobs j
            JOIN customer_profiles cp ON j.customer_id = cp.id
            JOIN app_users au ON cp.user_id = au.id
            WHERE j.id = feedbacks.job_id
            AND j.status = 'completed'
            AND cp.id = feedbacks.customer_id
            AND au.auth_user_id = auth.uid()
        )
    );

-- Workers can respond to their feedbacks
CREATE POLICY "Workers can respond to feedback"
    ON feedbacks FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM worker_profiles wp
            JOIN app_users au ON wp.user_id = au.id
            WHERE wp.id = feedbacks.worker_id
            AND au.auth_user_id = auth.uid()
        )
    )
    WITH CHECK (
        -- Only allow updating worker_response field
        (OLD.worker_response IS DISTINCT FROM NEW.worker_response)
        AND (OLD.rating = NEW.rating)
        AND (OLD.demerit_points = NEW.demerit_points)
        AND (OLD.feedback_text = NEW.feedback_text)
    );

-- -----------------------------------------------------------------------------
-- NOTIFICATIONS POLICIES
-- -----------------------------------------------------------------------------
-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM app_users au
            WHERE au.id = notifications.user_id
            AND au.auth_user_id = auth.uid()
        )
    );

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM app_users au
            WHERE au.id = notifications.user_id
            AND au.auth_user_id = auth.uid()
        )
    );

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
    ON notifications FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM app_users au
            WHERE au.id = notifications.user_id
            AND au.auth_user_id = auth.uid()
        )
    );

-- -----------------------------------------------------------------------------
-- ADMIN_LOGS POLICIES
-- -----------------------------------------------------------------------------
-- Only admins can view admin logs
CREATE POLICY "Admins can view admin logs"
    ON admin_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM app_users au
            WHERE au.auth_user_id = auth.uid()
            AND au.role = 'admin'
        )
    );

-- Only admins can create admin logs
CREATE POLICY "Admins can create admin logs"
    ON admin_logs FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM app_users au
            WHERE au.auth_user_id = auth.uid()
            AND au.role = 'admin'
        )
    );

-- ============================================================================
-- SECTION 16: HELPER FUNCTIONS FOR API
-- ============================================================================

-- -----------------------------------------------------------------------------
-- GET_USER_ID_FROM_AUTH FUNCTION
-- -----------------------------------------------------------------------------
-- Helper to get app_users.id from Supabase auth.uid()
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_user_id_from_auth()
RETURNS UUID AS $$
    SELECT id FROM app_users WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- SEARCH_WORKERS FUNCTION
-- -----------------------------------------------------------------------------
-- Full-text search for workers by name and skills
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION search_workers(
    search_query TEXT DEFAULT NULL,
    skill_filter TEXT DEFAULT NULL,
    city_filter TEXT DEFAULT NULL,
    min_rating NUMERIC DEFAULT NULL,
    verified_only BOOLEAN DEFAULT false,
    page_number INTEGER DEFAULT 1,
    page_size INTEGER DEFAULT 10
)
RETURNS TABLE (
    worker_profile_id UUID,
    user_id UUID,
    full_name TEXT,
    avatar_url TEXT,
    city TEXT,
    bio TEXT,
    experience_years INTEGER,
    hourly_rate NUMERIC,
    verified BOOLEAN,
    average_rating NUMERIC,
    reputation_score NUMERIC,
    jobs_completed INTEGER,
    skills TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        wsv.worker_profile_id,
        wsv.user_id,
        wsv.full_name,
        wsv.avatar_url,
        wsv.city,
        wsv.bio,
        wsv.experience_years,
        wsv.hourly_rate,
        wsv.verified,
        wsv.average_rating,
        wsv.reputation_score,
        wsv.jobs_completed,
        wsv.skills
    FROM worker_search_view wsv
    WHERE
        (search_query IS NULL OR
            wsv.full_name ILIKE '%' || search_query || '%' OR
            wsv.bio ILIKE '%' || search_query || '%' OR
            EXISTS (SELECT 1 FROM unnest(wsv.skills) s WHERE s ILIKE '%' || search_query || '%')
        )
        AND (skill_filter IS NULL OR skill_filter = ANY(wsv.skills))
        AND (city_filter IS NULL OR wsv.city ILIKE '%' || city_filter || '%')
        AND (min_rating IS NULL OR wsv.average_rating >= min_rating)
        AND (NOT verified_only OR wsv.verified = true)
    ORDER BY wsv.reputation_score DESC, wsv.average_rating DESC
    LIMIT page_size
    OFFSET (page_number - 1) * page_size;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- SEARCH_JOBS FUNCTION
-- -----------------------------------------------------------------------------
-- Full-text search for jobs
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION search_jobs(
    search_query TEXT DEFAULT NULL,
    skill_filter TEXT DEFAULT NULL,
    city_filter TEXT DEFAULT NULL,
    min_budget NUMERIC DEFAULT NULL,
    max_budget NUMERIC DEFAULT NULL,
    status_filter job_status DEFAULT 'open',
    page_number INTEGER DEFAULT 1,
    page_size INTEGER DEFAULT 10
)
RETURNS TABLE (
    job_id UUID,
    title TEXT,
    description TEXT,
    budget NUMERIC,
    location TEXT,
    city TEXT,
    status job_status,
    is_urgent BOOLEAN,
    application_count INTEGER,
    created_at TIMESTAMPTZ,
    customer_name TEXT,
    skills TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        j.id AS job_id,
        j.title,
        j.description,
        j.budget,
        j.location,
        j.city,
        j.status,
        j.is_urgent,
        j.application_count,
        j.created_at,
        p.full_name AS customer_name,
        COALESCE(
            ARRAY_AGG(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL),
            ARRAY[]::TEXT[]
        ) AS skills
    FROM jobs j
    JOIN customer_profiles cp ON j.customer_id = cp.id
    JOIN profiles p ON cp.user_id = p.user_id
    LEFT JOIN job_skills js ON j.id = js.job_id
    LEFT JOIN skills s ON js.skill_id = s.id
    WHERE
        (status_filter IS NULL OR j.status = status_filter)
        AND (search_query IS NULL OR
            j.title ILIKE '%' || search_query || '%' OR
            j.description ILIKE '%' || search_query || '%'
        )
        AND (skill_filter IS NULL OR EXISTS (
            SELECT 1 FROM job_skills js2
            JOIN skills s2 ON js2.skill_id = s2.id
            WHERE js2.job_id = j.id AND s2.name ILIKE '%' || skill_filter || '%'
        ))
        AND (city_filter IS NULL OR j.city ILIKE '%' || city_filter || '%')
        AND (min_budget IS NULL OR j.budget >= min_budget)
        AND (max_budget IS NULL OR j.budget <= max_budget)
    GROUP BY j.id, j.title, j.description, j.budget, j.location, j.city,
             j.status, j.is_urgent, j.application_count, j.created_at, p.full_name
    ORDER BY j.is_urgent DESC, j.created_at DESC
    LIMIT page_size
    OFFSET (page_number - 1) * page_size;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 17: SAMPLE DATA FOR TESTING (Optional)
-- ============================================================================
-- Uncomment and run this section to populate test data

/*
-- NOTE: This requires Supabase Auth users to exist first
-- For testing without auth, you can temporarily disable the auth_user_id reference

-- Insert test admin
INSERT INTO app_users (email, role, is_email_verified, password_hash)
VALUES ('admin@workerfinder.com', 'admin', true, 'test_hash');

-- Insert test customers
INSERT INTO app_users (email, role, is_email_verified)
VALUES
    ('customer1@test.com', 'customer', true),
    ('customer2@test.com', 'customer', true);

-- Insert test workers
INSERT INTO app_users (email, role, is_email_verified)
VALUES
    ('worker1@test.com', 'worker', true),
    ('worker2@test.com', 'worker', true),
    ('worker3@test.com', 'worker', true);
*/

-- ============================================================================
-- SCHEMA COMPLETE
-- ============================================================================
--
-- This schema provides:
-- ✔ Hybrid authentication support (Supabase Auth + future custom auth)
-- ✔ Complete user management (customers, workers, admins)
-- ✔ Skills-based job matching system
-- ✔ Worker verification workflow
-- ✔ Job posting and application system
-- ✔ Feedback and reputation system with automated calculations
-- ✔ Notification system
-- ✔ Admin activity logging
-- ✔ Row Level Security for all tables
-- ✔ Performance-optimized indexes
-- ✔ Automated triggers for data consistency
-- ✔ Search functions for workers and jobs
--
-- Next Steps:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Set up Supabase Storage buckets for images
-- 3. Configure Supabase Auth settings
-- 4. Update frontend API to use Supabase client
--
-- ============================================================================
