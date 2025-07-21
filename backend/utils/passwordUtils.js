const bcrypt = require('bcryptjs');
const crypto = require('crypto');

/**
 * Password utility functions for the Maybunga Healthcare System
 */

/**
 * Hash a password using bcrypt
 * @param {String} password - Plain text password
 * @param {Number} saltRounds - Number of salt rounds (default: 12)
 * @returns {Promise<String>} Hashed password
 */
const hashPassword = async (password, saltRounds = 12) => {
  try {
    if (!password || typeof password !== 'string') {
      throw new Error('Password must be a non-empty string');
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    // Use environment variable for salt rounds if available
    const rounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || saltRounds;
    
    const hashedPassword = await bcrypt.hash(password, rounds);
    return hashedPassword;
  } catch (error) {
    throw new Error(`Password hashing failed: ${error.message}`);
  }
};

/**
 * Compare a plain text password with a hashed password
 * @param {String} password - Plain text password
 * @param {String} hashedPassword - Hashed password from database
 * @returns {Promise<Boolean>} True if passwords match
 */
const comparePassword = async (password, hashedPassword) => {
  try {
    if (!password || !hashedPassword) {
      throw new Error('Both password and hashedPassword are required');
    }

    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error) {
    throw new Error(`Password comparison failed: ${error.message}`);
  }
};

/**
 * Validate password strength
 * @param {String} password - Plain text password
 * @returns {Object} Validation result with isValid and errors
 */
const validatePasswordStrength = (password) => {
  const errors = [];
  
  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
    return { isValid: false, errors };
  }

  // Minimum length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  // Maximum length check (to prevent DoS attacks)
  if (password.length > 128) {
    errors.push('Password cannot exceed 128 characters');
  }

  // Must contain at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Must contain at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Must contain at least one number
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Must contain at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check for common patterns
  const commonPatterns = [
    /(.)\1{2,}/, // Three or more repeated characters
    /123456|654321|abcdef|qwerty|password|admin/i, // Common sequences
  ];

  commonPatterns.forEach(pattern => {
    if (pattern.test(password)) {
      errors.push('Password contains common patterns and is not secure');
    }
  });

  return {
    isValid: errors.length === 0,
    errors: errors,
    strength: calculatePasswordStrength(password)
  };
};

/**
 * Calculate password strength score
 * @param {String} password - Plain text password
 * @returns {Object} Strength score and level
 */
const calculatePasswordStrength = (password) => {
  let score = 0;
  
  if (!password) return { score: 0, level: 'very_weak' };

  // Length scoring
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  // Character type scoring
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;

  // Complexity bonus
  const uniqueChars = new Set(password).size;
  if (uniqueChars >= password.length * 0.7) score += 1; // High character diversity

  // Penalty for common patterns
  if (/(.)\1{2,}/.test(password)) score -= 1; // Repeated characters
  if (/123456|654321|abcdef|qwerty|password|admin/i.test(password)) score -= 2; // Common patterns

  // Ensure score is within bounds
  score = Math.max(0, Math.min(8, score));

  // Determine strength level
  let level;
  if (score <= 2) level = 'very_weak';
  else if (score <= 4) level = 'weak';
  else if (score <= 6) level = 'medium';
  else if (score <= 7) level = 'strong';
  else level = 'very_strong';

  return { score, level };
};

/**
 * Generate a secure random password
 * @param {Number} length - Password length (default: 12)
 * @param {Object} options - Password generation options
 * @returns {String} Generated password
 */
const generateSecurePassword = (length = 12, options = {}) => {
  const defaultOptions = {
    includeLowercase: true,
    includeUppercase: true,
    includeNumbers: true,
    includeSpecialChars: true,
    excludeSimilar: true, // Exclude similar looking characters (0, O, l, 1, etc.)
    excludeAmbiguous: true // Exclude ambiguous characters
  };

  const config = { ...defaultOptions, ...options };

  let charset = '';
  
  if (config.includeLowercase) {
    charset += config.excludeSimilar ? 'abcdefghijkmnpqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz';
  }
  
  if (config.includeUppercase) {
    charset += config.excludeSimilar ? 'ABCDEFGHJKLMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  }
  
  if (config.includeNumbers) {
    charset += config.excludeSimilar ? '23456789' : '0123456789';
  }
  
  if (config.includeSpecialChars) {
    charset += config.excludeAmbiguous ? '!@#$%^&*-_=+' : '!@#$%^&*()_+-=[]{}|;:,.<>?';
  }

  if (charset.length === 0) {
    throw new Error('At least one character type must be included');
  }

  let password = '';
  
  // Ensure at least one character from each selected type
  const types = [];
  if (config.includeLowercase) types.push(config.excludeSimilar ? 'abcdefghijkmnpqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz');
  if (config.includeUppercase) types.push(config.excludeSimilar ? 'ABCDEFGHJKLMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  if (config.includeNumbers) types.push(config.excludeSimilar ? '23456789' : '0123456789');
  if (config.includeSpecialChars) types.push(config.excludeAmbiguous ? '!@#$%^&*-_=+' : '!@#$%^&*()_+-=[]{}|;:,.<>?');

  // Add one character from each type
  types.forEach(type => {
    const randomIndex = crypto.randomInt(0, type.length);
    password += type[randomIndex];
  });

  // Fill the rest with random characters from the full charset
  for (let i = password.length; i < length; i++) {
    const randomIndex = crypto.randomInt(0, charset.length);
    password += charset[randomIndex];
  }

  // Shuffle the password to randomize the order
  return password.split('').sort(() => crypto.randomInt(0, 3) - 1).join('');
};

/**
 * Generate a password reset token
 * @returns {String} Secure random token
 */
const generatePasswordResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash a password reset token
 * @param {String} token - Plain reset token
 * @returns {String} Hashed token
 */
const hashPasswordResetToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Check if password has been breached (placeholder function)
 * In a real implementation, this would check against a breach database
 * @param {String} password - Plain text password
 * @returns {Promise<Boolean>} True if password has been breached
 */
const isPasswordBreached = async (password) => {
  // This is a placeholder. In a real implementation, you would:
  // 1. Hash the password with SHA-1
  // 2. Take the first 5 characters of the hash
  // 3. Query the HaveIBeenPwned API with those 5 characters
  // 4. Check if the full hash appears in the response
  
  // For now, we'll just check against a list of common passwords
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', 'monkey'
  ];
  
  return commonPasswords.includes(password.toLowerCase());
};

/**
 * Validate password against user information to prevent personal info in passwords
 * @param {String} password - Plain text password
 * @param {Object} userInfo - User information object
 * @returns {Object} Validation result
 */
const validatePasswordAgainstUserInfo = (password, userInfo = {}) => {
  const errors = [];
  const passwordLower = password.toLowerCase();
  
  // Check against username
  if (userInfo.username && passwordLower.includes(userInfo.username.toLowerCase())) {
    errors.push('Password cannot contain your username');
  }
  
  // Check against email
  if (userInfo.email) {
    const emailParts = userInfo.email.toLowerCase().split('@');
    if (passwordLower.includes(emailParts[0])) {
      errors.push('Password cannot contain your email address');
    }
  }
  
  // Check against first and last name
  if (userInfo.firstName && passwordLower.includes(userInfo.firstName.toLowerCase())) {
    errors.push('Password cannot contain your first name');
  }
  
  if (userInfo.lastName && passwordLower.includes(userInfo.lastName.toLowerCase())) {
    errors.push('Password cannot contain your last name');
  }
  
  // Check against birth date
  if (userInfo.dateOfBirth) {
    const birthDate = new Date(userInfo.dateOfBirth);
    const year = birthDate.getFullYear().toString();
    const month = (birthDate.getMonth() + 1).toString().padStart(2, '0');
    const day = birthDate.getDate().toString().padStart(2, '0');
    
    if (passwordLower.includes(year) || passwordLower.includes(month + day)) {
      errors.push('Password cannot contain your birth date information');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

module.exports = {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
  calculatePasswordStrength,
  generateSecurePassword,
  generatePasswordResetToken,
  hashPasswordResetToken,
  isPasswordBreached,
  validatePasswordAgainstUserInfo
};
