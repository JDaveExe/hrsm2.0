const jwt = require('jsonwebtoken');

// JWT configuration
const JWT_CONFIG = {
  accessTokenSecret: process.env.JWT_SECRET || 'your_access_token_secret',
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'your_refresh_token_secret',
  accessTokenExpiry: process.env.JWT_EXPIRES_IN || '15m',
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  issuer: 'maybunga-healthcare',
  audience: 'maybunga-healthcare-users'
};

/**
 * Generate access token for user
 * @param {Object} user - User object
 * @returns {String} JWT access token
 */
const generateAccessToken = (user) => {
  const payload = {
    userId: user._id,
    email: user.email,
    role: user.role,
    username: user.username
  };

  const options = {
    expiresIn: JWT_CONFIG.accessTokenExpiry,
    issuer: JWT_CONFIG.issuer,
    audience: JWT_CONFIG.audience,
    subject: user._id.toString()
  };

  return jwt.sign(payload, JWT_CONFIG.accessTokenSecret, options);
};

/**
 * Generate refresh token for user
 * @param {Object} user - User object
 * @returns {String} JWT refresh token
 */
const generateRefreshToken = (user) => {
  const payload = {
    userId: user._id,
    email: user.email,
    tokenType: 'refresh'
  };

  const options = {
    expiresIn: JWT_CONFIG.refreshTokenExpiry,
    issuer: JWT_CONFIG.issuer,
    audience: JWT_CONFIG.audience,
    subject: user._id.toString()
  };

  return jwt.sign(payload, JWT_CONFIG.refreshTokenSecret, options);
};

/**
 * Generate both access and refresh tokens
 * @param {Object} user - User object
 * @returns {Object} Object containing both tokens
 */
const generateTokens = (user) => {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user)
  };
};

/**
 * Verify access token
 * @param {String} token - JWT access token
 * @returns {Object} Decoded token payload
 */
const verifyAccessToken = (token) => {
  try {
    const options = {
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience
    };

    return jwt.verify(token, JWT_CONFIG.accessTokenSecret, options);
  } catch (error) {
    throw new Error(`Invalid access token: ${error.message}`);
  }
};

/**
 * Verify refresh token
 * @param {String} token - JWT refresh token
 * @returns {Object} Decoded token payload
 */
const verifyRefreshToken = (token) => {
  try {
    const options = {
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience
    };

    const decoded = jwt.verify(token, JWT_CONFIG.refreshTokenSecret, options);
    
    if (decoded.tokenType !== 'refresh') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    throw new Error(`Invalid refresh token: ${error.message}`);
  }
};

/**
 * Extract token from Authorization header
 * @param {String} authHeader - Authorization header value
 * @returns {String|null} Extracted token or null
 */
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
};

/**
 * Generate password reset token
 * @param {Object} user - User object
 * @returns {String} JWT password reset token
 */
const generatePasswordResetToken = (user) => {
  const payload = {
    userId: user._id,
    email: user.email,
    tokenType: 'password_reset',
    timestamp: Date.now()
  };

  const options = {
    expiresIn: '10m', // Password reset tokens expire in 10 minutes
    issuer: JWT_CONFIG.issuer,
    audience: JWT_CONFIG.audience,
    subject: user._id.toString()
  };

  return jwt.sign(payload, JWT_CONFIG.accessTokenSecret, options);
};

/**
 * Verify password reset token
 * @param {String} token - JWT password reset token
 * @returns {Object} Decoded token payload
 */
const verifyPasswordResetToken = (token) => {
  try {
    const options = {
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience
    };

    const decoded = jwt.verify(token, JWT_CONFIG.accessTokenSecret, options);
    
    if (decoded.tokenType !== 'password_reset') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    throw new Error(`Invalid password reset token: ${error.message}`);
  }
};

/**
 * Generate email verification token
 * @param {Object} user - User object
 * @returns {String} JWT email verification token
 */
const generateEmailVerificationToken = (user) => {
  const payload = {
    userId: user._id,
    email: user.email,
    tokenType: 'email_verification',
    timestamp: Date.now()
  };

  const options = {
    expiresIn: '24h', // Email verification tokens expire in 24 hours
    issuer: JWT_CONFIG.issuer,
    audience: JWT_CONFIG.audience,
    subject: user._id.toString()
  };

  return jwt.sign(payload, JWT_CONFIG.accessTokenSecret, options);
};

/**
 * Verify email verification token
 * @param {String} token - JWT email verification token
 * @returns {Object} Decoded token payload
 */
const verifyEmailVerificationToken = (token) => {
  try {
    const options = {
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience
    };

    const decoded = jwt.verify(token, JWT_CONFIG.accessTokenSecret, options);
    
    if (decoded.tokenType !== 'email_verification') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    throw new Error(`Invalid email verification token: ${error.message}`);
  }
};

/**
 * Check if token is expired
 * @param {String} token - JWT token
 * @returns {Boolean} True if token is expired
 */
const isTokenExpired = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) return true;
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
};

/**
 * Get token expiry time
 * @param {String} token - JWT token
 * @returns {Date|null} Expiry date or null if invalid
 */
const getTokenExpiry = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) return null;
    
    return new Date(decoded.exp * 1000);
  } catch (error) {
    return null;
  }
};

/**
 * Decode token without verification (for debugging)
 * @param {String} token - JWT token
 * @returns {Object|null} Decoded token or null
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token, { complete: true });
  } catch (error) {
    return null;
  }
};

module.exports = {
  JWT_CONFIG,
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  extractTokenFromHeader,
  generatePasswordResetToken,
  verifyPasswordResetToken,
  generateEmailVerificationToken,
  verifyEmailVerificationToken,
  isTokenExpired,
  getTokenExpiry,
  decodeToken
};
