// This file centralizes environment configuration

// Admin emails that should automatically be granted admin privileges
export const ADMIN_EMAILS = ["wambui@gmail.com", "gichsammy4@gmail.com"]

// Function to check if an email should be an admin
export function isAdminEmail(email) {
  if (!email) return false

  return ADMIN_EMAILS.some((adminEmail) => adminEmail.toLowerCase() === email.toLowerCase())
}

// App configuration
export const APP_CONFIG = {
  name: "Cohere",
  tagline: "Connect & Unite",
  adminLogging: true, // Whether to log admin actions
}
