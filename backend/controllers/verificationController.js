/**
 * ──────────────────────────────────────────────────────────────
 *  Verification Controller
 *  Handles worker ID verification requests and admin approval.
 * ──────────────────────────────────────────────────────────────
 */

const fs = require('fs');
const path = require('path');
const { workers, generateId } = require('../models/mockData');
const { sendResponse, validateFields } = require('../utils/helpers');
const { createNotification } = require('./notificationController');

// Path to verification requests data file
const verificationsFilePath = path.join(__dirname, '../data/verificationRequests.json');

/**
 * Helper: Read verifications from JSON file
 */
const readVerifications = () => {
  try {
    if (!fs.existsSync(verificationsFilePath)) {
      fs.writeFileSync(verificationsFilePath, '[]');
      return [];
    }
    const data = fs.readFileSync(verificationsFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading verifications file:', error);
    return [];
  }
};

/**
 * Helper: Write verifications to JSON file
 */
const writeVerifications = (verifications) => {
  try {
    fs.writeFileSync(verificationsFilePath, JSON.stringify(verifications, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing verifications file:', error);
    return false;
  }
};

/**
 * POST /api/verification/submit
 * Worker submits verification details.
 */
const submitVerification = (req, res) => {
  const { cnicNumber, mobileNumber, address } = req.body;

  // Validate required fields
  const { valid, missing } = validateFields(req.body, ['cnicNumber', 'mobileNumber', 'address']);
  if (!valid) {
    return sendResponse(res, 400, false, `Missing required fields: ${missing.join(', ')}`);
  }

  // Find the worker profile
  const worker = workers.find(w => w.userId === req.user.id);
  if (!worker) {
    return sendResponse(res, 404, false, 'Worker profile not found.');
  }

  // Check if worker is approved first
  if (worker.status !== 'approved') {
    return sendResponse(res, 400, false, 'Your profile must be approved before submitting verification.');
  }

  // Check if already verified
  if (worker.verified === true) {
    return sendResponse(res, 400, false, 'Your account is already verified.');
  }

  const verifications = readVerifications();

  // Check for existing pending request
  const existingRequest = verifications.find(
    v => v.workerId === worker.id && v.status === 'pending'
  );
  if (existingRequest) {
    return sendResponse(res, 400, false, 'You already have a pending verification request.');
  }

  // Get uploaded file paths from multer
  const idFrontImage = req.files?.idFront?.[0]?.filename || null;
  const idBackImage = req.files?.idBack?.[0]?.filename || null;

  if (!idFrontImage || !idBackImage) {
    return sendResponse(res, 400, false, 'Both ID card front and back images are required.');
  }

  // Create verification request
  const verificationRequest = {
    id: generateId('verification'),
    workerId: worker.id,
    workerUserId: req.user.id,
    workerName: worker.name,
    workerEmail: worker.email,
    cnicNumber: cnicNumber.trim(),
    mobileNumber: mobileNumber.trim(),
    address: address.trim(),
    idFrontImage,
    idBackImage,
    status: 'pending',
    submittedAt: new Date().toISOString(),
    reviewedAt: null,
    reviewedBy: null
  };

  verifications.push(verificationRequest);

  if (writeVerifications(verifications)) {
    // Update worker with mobile number
    const workerIndex = workers.findIndex(w => w.id === worker.id);
    if (workerIndex !== -1) {
      workers[workerIndex].mobileNumber = mobileNumber.trim();
    }

    // Notify admin about new verification request
    createNotification(
      'admin-001', // Default admin ID
      `New verification request from ${worker.name}`,
      'info',
      { verificationId: verificationRequest.id, workerId: worker.id }
    );

    sendResponse(res, 201, true, 'Verification request submitted successfully.', {
      verification: verificationRequest
    });
  } else {
    sendResponse(res, 500, false, 'Failed to submit verification request.');
  }
};

/**
 * GET /api/verification/status
 * Get worker's own verification status.
 */
const getWorkerVerificationStatus = (req, res) => {
  const worker = workers.find(w => w.userId === req.user.id);
  if (!worker) {
    return sendResponse(res, 404, false, 'Worker profile not found.');
  }

  const verifications = readVerifications();
  const myVerifications = verifications.filter(v => v.workerId === worker.id);
  const latestVerification = myVerifications.sort(
    (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)
  )[0] || null;

  sendResponse(res, 200, true, 'Verification status retrieved.', {
    isVerified: worker.verified === true,
    latestRequest: latestVerification,
    history: myVerifications
  });
};

/**
 * GET /api/verification/requests (Admin only)
 * Get all verification requests.
 */
const getAllVerificationRequests = (req, res) => {
  const { status } = req.query;
  const verifications = readVerifications();

  let filtered = verifications;
  if (status && ['pending', 'approved', 'rejected'].includes(status)) {
    filtered = verifications.filter(v => v.status === status);
  }

  // Sort by submission date (newest first)
  filtered.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

  sendResponse(res, 200, true, 'Verification requests retrieved.', {
    requests: filtered,
    counts: {
      total: verifications.length,
      pending: verifications.filter(v => v.status === 'pending').length,
      approved: verifications.filter(v => v.status === 'approved').length,
      rejected: verifications.filter(v => v.status === 'rejected').length
    }
  });
};

/**
 * GET /api/verification/request/:id (Admin only)
 * Get a specific verification request.
 */
const getVerificationRequest = (req, res) => {
  const { id } = req.params;
  const verifications = readVerifications();
  const request = verifications.find(v => v.id === id);

  if (!request) {
    return sendResponse(res, 404, false, 'Verification request not found.');
  }

  // Get worker details
  const worker = workers.find(w => w.id === request.workerId);

  sendResponse(res, 200, true, 'Verification request retrieved.', {
    request,
    worker: worker ? {
      id: worker.id,
      name: worker.name,
      email: worker.email,
      skill: worker.skill,
      experience: worker.experience,
      location: worker.location,
      status: worker.status
    } : null
  });
};

/**
 * PUT /api/verification/approve/:id (Admin only)
 * Approve a verification request.
 */
const approveVerification = (req, res) => {
  const { id } = req.params;
  const verifications = readVerifications();
  const index = verifications.findIndex(v => v.id === id);

  if (index === -1) {
    return sendResponse(res, 404, false, 'Verification request not found.');
  }

  if (verifications[index].status !== 'pending') {
    return sendResponse(res, 400, false, 'This request has already been reviewed.');
  }

  // Update verification status
  verifications[index].status = 'approved';
  verifications[index].reviewedAt = new Date().toISOString();
  verifications[index].reviewedBy = req.user.id;

  // Update worker as verified
  const workerIndex = workers.findIndex(w => w.id === verifications[index].workerId);
  if (workerIndex !== -1) {
    workers[workerIndex].verified = true;
    workers[workerIndex].verifiedAt = new Date().toISOString();
    workers[workerIndex].cnicNumber = verifications[index].cnicNumber;
    workers[workerIndex].mobileNumber = verifications[index].mobileNumber;
    workers[workerIndex].verificationAddress = verifications[index].address;
  }

  if (writeVerifications(verifications)) {
    // Notify worker
    createNotification(
      verifications[index].workerUserId,
      'Congratulations! Your ID verification has been approved. Customers can now see your contact number.',
      'success',
      { verificationId: id }
    );

    sendResponse(res, 200, true, 'Verification approved successfully.', {
      verification: verifications[index]
    });
  } else {
    sendResponse(res, 500, false, 'Failed to approve verification.');
  }
};

/**
 * PUT /api/verification/reject/:id (Admin only)
 * Reject a verification request.
 */
const rejectVerification = (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const verifications = readVerifications();
  const index = verifications.findIndex(v => v.id === id);

  if (index === -1) {
    return sendResponse(res, 404, false, 'Verification request not found.');
  }

  if (verifications[index].status !== 'pending') {
    return sendResponse(res, 400, false, 'This request has already been reviewed.');
  }

  // Update verification status
  verifications[index].status = 'rejected';
  verifications[index].reviewedAt = new Date().toISOString();
  verifications[index].reviewedBy = req.user.id;
  verifications[index].rejectionReason = reason || 'Verification details could not be validated.';

  if (writeVerifications(verifications)) {
    // Notify worker
    createNotification(
      verifications[index].workerUserId,
      `Your ID verification was rejected. Reason: ${verifications[index].rejectionReason}`,
      'warning',
      { verificationId: id }
    );

    sendResponse(res, 200, true, 'Verification rejected.', {
      verification: verifications[index]
    });
  } else {
    sendResponse(res, 500, false, 'Failed to reject verification.');
  }
};

/**
 * DELETE /api/verification/request/:id (Admin only)
 * Delete a verification request.
 */
const deleteVerificationRequest = (req, res) => {
  const { id } = req.params;
  const verifications = readVerifications();
  const index = verifications.findIndex(v => v.id === id);

  if (index === -1) {
    return sendResponse(res, 404, false, 'Verification request not found.');
  }

  verifications.splice(index, 1);

  if (writeVerifications(verifications)) {
    sendResponse(res, 200, true, 'Verification request deleted.');
  } else {
    sendResponse(res, 500, false, 'Failed to delete verification request.');
  }
};

module.exports = {
  submitVerification,
  getWorkerVerificationStatus,
  getAllVerificationRequests,
  getVerificationRequest,
  approveVerification,
  rejectVerification,
  deleteVerificationRequest,
  readVerifications
};
