/**
 * Security configuration for the app
 * NOTE: In a real Next.js app, these would be implemented in the next.config.js file and middleware
 * Since this is a client-side React app, these are placeholders for education purposes
 */

// Content Security Policy - this would be implemented as HTTP headers in a production app
export const CONTENT_SECURITY_POLICY = {
  "default-src": ["'self'"],
  "script-src": ["'self'", "'unsafe-inline'", "https://apis.google.com"],
  "style-src": ["'self'", "'unsafe-inline'"],
  "img-src": ["'self'", "data:", "https://storage.googleapis.com", "https://www.gravatar.com"],
  "connect-src": ["'self'", "https://firestore.googleapis.com", "https://identitytoolkit.googleapis.com"],
  "frame-src": ["'self'", "https://cohere-app.firebaseapp.com"],
  "font-src": ["'self'", "https://fonts.gstatic.com"],
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
  "frame-ancestors": ["'none'"],
  "upgrade-insecure-requests": [],
}

// Rate limiting configuration - these would be implemented in server middleware
export const RATE_LIMITS = {
  // General API rate limiting
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },
  // Auth-related endpoints
  auth: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // limit each IP to 10 requests per windowMs
  },
  // Admin endpoints
  admin: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // limit each IP to 30 requests per windowMs
  },
}

// Implement admin route detection
export function isAdminRoute(pathname) {
  return pathname.startsWith("/admin") || pathname === "/admin-dashboard"
}
