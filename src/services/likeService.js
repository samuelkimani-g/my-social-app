import { db } from "../firebase/firebase-config"
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore"
import { createNotification } from "./notificationService"

/**
 * Like a post
 * @param {string} userId - The user ID who is liking the post
 * @param {string} postId - The post ID being liked
 * @returns {Object} - Result object with success status
 */
export const likePost = async (userId, postId) => {
  try {
    // Check if already liked
    const likesQuery = query(collection(db, "likes"), where("userId", "==", userId), where("postId", "==", postId))

    const likeSnapshot = await getDocs(likesQuery)

    if (!likeSnapshot.empty) {
      return { success: false, message: "Post already liked" }
    }

    // Get post data to check author
    const postRef = doc(db, "posts", postId)
    const postSnapshot = await getDoc(postRef)

    if (!postSnapshot.exists()) {
      return { success: false, message: "Post not found" }
    }

    const postData = postSnapshot.data()
    const authorId = postData.authorId

    // Create like document
    await addDoc(collection(db, "likes"), {
      userId,
      postId,
      createdAt: serverTimestamp(),
    })

    // Update post's like count
    await updateDoc(postRef, {
      likesCount: (postData.likesCount || 0) + 1,
    })

    // Create notification for post author (if not self-like)
    if (userId !== authorId) {
      await createNotification({
        userId: authorId,
        type: "like",
        fromUserId: userId,
        data: { postId },
      })
    }

    return { success: true }
  } catch (error) {
    console.error("Error liking post:", error)
    return { success: false, message: "Failed to like post" }
  }
}

/**
 * Unlike a post
 * @param {string} userId - The user ID who is unliking the post
 * @param {string} postId - The post ID being unliked
 * @returns {Object} - Result object with success status
 */
export const unlikePost = async (userId, postId) => {
  try {
    // Find the like document
    const likesQuery = query(collection(db, "likes"), where("userId", "==", userId), where("postId", "==", postId))

    const likeSnapshot = await getDocs(likesQuery)

    if (likeSnapshot.empty) {
      return { success: false, message: "Post not liked" }
    }

    // Delete the like document
    await deleteDoc(doc(db, "likes", likeSnapshot.docs[0].id))

    // Update post's like count
    const postRef = doc(db, "posts", postId)
    const postSnapshot = await getDoc(postRef)

    if (postSnapshot.exists()) {
      const postData = postSnapshot.data()
      await updateDoc(postRef, {
        likesCount: Math.max((postData.likesCount || 0) - 1, 0),
      })
    }

    return { success: true }
  } catch (error) {
    console.error("Error unliking post:", error)
    return { success: false, message: "Failed to unlike post" }
  }
}

/**
 * Check if user has liked a post
 * @param {string} userId - The user ID
 * @param {string} postId - The post ID
 * @returns {boolean} - Whether the user has liked the post
 */
export const checkUserLikedPost = async (userId, postId) => {
  try {
    const likesQuery = query(collection(db, "likes"), where("userId", "==", userId), where("postId", "==", postId))

    const likeSnapshot = await getDocs(likesQuery)
    return !likeSnapshot.empty
  } catch (error) {
    console.error("Error checking like status:", error)
    return false
  }
}

/**
 * Get users who liked a post
 * @param {string} postId - The post ID
 * @returns {Array} - Array of user IDs who liked the post
 */
export const getPostLikes = async (postId) => {
  try {
    const likesQuery = query(collection(db, "likes"), where("postId", "==", postId))

    const likesSnapshot = await getDocs(likesQuery)
    return likesSnapshot.docs.map((doc) => doc.data().userId)
  } catch (error) {
    console.error("Error getting post likes:", error)
    return []
  }
}
