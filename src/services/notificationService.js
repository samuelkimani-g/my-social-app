import { db } from "../firebase/firebase-config"
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore"

/**
 * Create a new notification
 * @param {Object} notificationData - The notification data
 * @param {string} notificationData.userId - The user ID who will receive the notification
 * @param {string} notificationData.type - The notification type (e.g., 'follow', 'like', 'comment')
 * @param {string} notificationData.fromUserId - The user ID who triggered the notification
 * @param {Object} notificationData.data - Additional data related to the notification
 */
export const createNotification = async (notificationData) => {
  try {
    const { userId, type, fromUserId, data = {} } = notificationData

    if (!userId || !type || !fromUserId) {
      console.error("Missing required notification fields", { userId, type, fromUserId })
      return null
    }

    // Don't create notifications for self-actions
    if (userId === fromUserId) {
      console.log("Skipping self-notification")
      return { id: "self-notification-skipped" }
    }

    // Get the from user's data for display purposes
    const fromUserRef = doc(db, "users", fromUserId)
    const fromUserSnap = await getDoc(fromUserRef)
    const fromUserData = fromUserSnap.exists() ? fromUserSnap.data() : {}

    // Check if a similar notification already exists recently (within 1 hour)
    // to prevent duplicate notifications
    const oneHourAgo = new Date()
    oneHourAgo.setHours(oneHourAgo.getHours() - 1)

    const recentNotificationsQuery = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      where("type", "==", type),
      where("fromUserId", "==", fromUserId),
      where("createdAt", ">=", oneHourAgo),
    )

    const recentNotificationsSnapshot = await getDocs(recentNotificationsQuery)

    if (!recentNotificationsSnapshot.empty) {
      console.log("Similar notification already exists recently, skipping")
      return { id: recentNotificationsSnapshot.docs[0].id }
    }

    const notificationRef = collection(db, "notifications")
    const newNotification = await addDoc(notificationRef, {
      userId,
      type,
      fromUserId,
      fromUserName: fromUserData.username || "A user",
      fromUserPic: fromUserData.profilePic || "",
      data,
      read: false,
      createdAt: serverTimestamp(),
    })

    console.log(`Created ${type} notification for user ${userId} from ${fromUserId}`)
    return { id: newNotification.id }
  } catch (error) {
    console.error("Error creating notification:", error)
    return null
  }
}

/**
 * Get notifications for a user
 * @param {string} userId - The user ID
 * @param {number} limitCount - Maximum number of notifications to retrieve
 * @returns {Array} - Array of notification objects
 */
export const getUserNotifications = async (userId, limitCount = 20) => {
  try {
    const notificationsQuery = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(limitCount),
    )

    const notificationsSnapshot = await getDocs(notificationsQuery)

    return notificationsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error("Error getting notifications:", error)
    return []
  }
}

/**
 * Mark a notification as read
 * @param {string} notificationId - The notification ID
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const notificationRef = doc(db, "notifications", notificationId)
    await updateDoc(notificationRef, { read: true })
    return true
  } catch (error) {
    console.error("Error marking notification as read:", error)
    return false
  }
}

/**
 * Mark all notifications as read for a user
 * @param {string} userId - The user ID
 */
export const markAllNotificationsAsRead = async (userId) => {
  try {
    const notificationsQuery = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      where("read", "==", false),
    )

    const notificationsSnapshot = await getDocs(notificationsQuery)

    const updatePromises = notificationsSnapshot.docs.map((doc) => updateDoc(doc.ref, { read: true }))

    await Promise.all(updatePromises)
    return true
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    return false
  }
}
