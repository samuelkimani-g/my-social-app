import { addDoc, collection, serverTimestamp } from "firebase/firestore"
import { db } from "../firebase/firebase-config"
import { APP_CONFIG } from "../config/env"

/**
 * Logs administrative actions for audit purposes
 * @param {string} action - The action being performed
 * @param {string} adminId - The ID of the admin performing the action
 * @param {object} details - Additional details about the action
 */
export async function logAdminAction(action, adminId, details = {}) {
  if (!APP_CONFIG.adminLogging) return

  try {
    await addDoc(collection(db, "admin_logs"), {
      action,
      adminId,
      details,
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent,
    })

    console.log(`Admin action logged: ${action}`)
  } catch (error) {
    console.error("Error logging admin action:", error)
  }
}

/**
 * Logs security events such as unauthorized access attempts
 */
export async function logSecurityEvent(event, userId = null, details = {}) {
  try {
    await addDoc(collection(db, "security_logs"), {
      event,
      userId,
      details,
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent,
      ipAddress: "Collected server-side", // This would be populated in a server context
    })

    console.log(`Security event logged: ${event}`)
  } catch (error) {
    console.error("Error logging security event:", error)
  }
}
