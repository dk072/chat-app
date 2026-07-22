import rateLimit from 'express-rate-limit';

// Strict limiter for Auth endpoints (login/register) to prevent brute-force password attacks
export const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // Max 5 login/register attempts per minute per IP
  message: {
    message: 'Too many authentication attempts. Please wait 1 minute before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Standard limiter for general chat & user API endpoints to prevent spamming
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Max 100 requests per minute
  message: {
    message: 'Too many requests. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
