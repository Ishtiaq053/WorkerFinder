/**
 * ──────────────────────────────────────────────────────────────
 *  Skills Controller
 *  Centralized skill management for consistent skill matching
 *  across the entire application.
 * ──────────────────────────────────────────────────────────────
 */

const fs = require('fs');
const path = require('path');
const { sendResponse } = require('../utils/helpers');

// Path to skills data file
const skillsFilePath = path.join(__dirname, '../data/skills.json');

/**
 * Helper: Read skills from JSON file
 */
const readSkills = () => {
  try {
    if (!fs.existsSync(skillsFilePath)) {
      // Create default skills file if it doesn't exist
      const defaultSkills = [
        "Plumbing",
        "Electrical",
        "Carpentry",
        "Painting",
        "Construction",
        "Driving",
        "Gardening",
        "Mechanic",
        "Cleaning",
        "Mason",
        "Welder",
        "General Labour"
      ];
      fs.writeFileSync(skillsFilePath, JSON.stringify(defaultSkills, null, 2));
      return defaultSkills;
    }
    const data = fs.readFileSync(skillsFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading skills file:', error);
    return [];
  }
};

/**
 * Helper: Write skills to JSON file
 */
const writeSkills = (skills) => {
  try {
    fs.writeFileSync(skillsFilePath, JSON.stringify(skills, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing skills file:', error);
    return false;
  }
};

/**
 * GET /api/skills
 * Get all available skills.
 */
const getAllSkills = (req, res) => {
  const skills = readSkills();
  sendResponse(res, 200, true, 'Skills retrieved successfully.', { skills });
};

/**
 * Validate if a skill (or array of skills) exists in the system.
 * @param {string|string[]} skillInput - Skill name or comma-separated skills or array
 * @returns {Object} { valid: boolean, invalidSkills: string[] }
 */
const validateSkill = (skillInput) => {
  const skills = readSkills();
  const skillsLower = skills.map(s => s.toLowerCase());
  
  let inputSkills = [];
  
  if (Array.isArray(skillInput)) {
    inputSkills = skillInput;
  } else if (typeof skillInput === 'string') {
    inputSkills = skillInput.split(',').map(s => s.trim()).filter(Boolean);
  }
  
  const invalidSkills = inputSkills.filter(s => !skillsLower.includes(s.toLowerCase()));
  
  return {
    valid: invalidSkills.length === 0,
    invalidSkills
  };
};

/**
 * POST /api/skills/validate
 * Validate skill(s) against the system.
 */
const validateSkillEndpoint = (req, res) => {
  const { skill, skills: skillsArray } = req.body;
  
  const input = skillsArray || skill;
  
  if (!input) {
    return sendResponse(res, 400, false, 'Please provide skill or skills to validate.');
  }
  
  const result = validateSkill(input);
  
  if (result.valid) {
    sendResponse(res, 200, true, 'All skills are valid.', { valid: true });
  } else {
    sendResponse(res, 400, false, `Invalid skills: ${result.invalidSkills.join(', ')}`, {
      valid: false,
      invalidSkills: result.invalidSkills
    });
  }
};

/**
 * POST /api/skills (Admin only)
 * Add a new skill to the system.
 */
const addSkill = (req, res) => {
  const { skillName } = req.body;
  
  if (!skillName || !skillName.trim()) {
    return sendResponse(res, 400, false, 'Skill name is required.');
  }
  
  const skills = readSkills();
  const normalizedName = skillName.trim();
  
  // Check for duplicate (case-insensitive)
  if (skills.some(s => s.toLowerCase() === normalizedName.toLowerCase())) {
    return sendResponse(res, 409, false, 'This skill already exists.');
  }
  
  skills.push(normalizedName);
  
  if (writeSkills(skills)) {
    sendResponse(res, 201, true, 'Skill added successfully.', { skills });
  } else {
    sendResponse(res, 500, false, 'Failed to add skill.');
  }
};

/**
 * DELETE /api/skills/:skillName (Admin only)
 * Remove a skill from the system.
 */
const removeSkill = (req, res) => {
  const { skillName } = req.params;
  
  if (!skillName) {
    return sendResponse(res, 400, false, 'Skill name is required.');
  }
  
  const skills = readSkills();
  const index = skills.findIndex(s => s.toLowerCase() === skillName.toLowerCase());
  
  if (index === -1) {
    return sendResponse(res, 404, false, 'Skill not found.');
  }
  
  skills.splice(index, 1);
  
  if (writeSkills(skills)) {
    sendResponse(res, 200, true, 'Skill removed successfully.', { skills });
  } else {
    sendResponse(res, 500, false, 'Failed to remove skill.');
  }
};

/**
 * Match worker skills with job requirements.
 * @param {string} workerSkills - Comma-separated worker skills
 * @param {string} jobRequiredSkill - Required skill for the job
 * @returns {boolean} Whether the worker has the required skill
 */
const matchWorkerToJob = (workerSkills, jobRequiredSkill) => {
  if (!workerSkills || !jobRequiredSkill) return false;
  
  const workerSkillsArray = workerSkills.split(',').map(s => s.trim().toLowerCase());
  const requiredSkillLower = jobRequiredSkill.trim().toLowerCase();
  
  return workerSkillsArray.includes(requiredSkillLower);
};

module.exports = {
  getAllSkills,
  validateSkill,
  validateSkillEndpoint,
  addSkill,
  removeSkill,
  matchWorkerToJob,
  readSkills
};
