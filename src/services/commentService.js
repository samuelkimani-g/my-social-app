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
import { createNotification } from "./notificationService"

// Enhance the createComment function to include comment preview in notification
export const createComment = async (commentData) => {
  try {
    const { postId, userId, content } = commentData

    if (!postId || !userId || !content) {
      return { success: false, message: "Missing required fields" }
    }

    // Get post data to check author
    const postRef = doc(db, "posts", postId)
    const postSnapshot = await getDoc(postRef)

    if (!postSnapshot.exists()) {
      return { success: false, message: "Post not found" }
    }

    const postData = postSnapshot.data()
    const authorId = postData.authorId

    // Create comment document
    const commentRef = collection(db, "comments")
    const newComment = await addDoc(commentRef, {
      postId,
      userId,
      content,
      createdAt: serverTimestamp(),
      isDeleted: false,
    })

    // Update post's comment count
    await updateDoc(postRef, {
      commentsCount: (postData.commentsCount || 0) + 1,
    })

    // Create notification for post author (if not self-comment)
    if (userId !== authorId) {
      // Create a preview of the comment (first 50 characters)
      const commentPreview = content.length > 50 ? content.substring(0, 47) + "..." : content

      await createNotification({
        userId: authorId,
        type: "comment",
        fromUserId: userId,
        data: {
          postId,
          commentId: newComment.id,
          commentPreview,
        },
      })
    }

    return { success: true, commentId: newComment.id }
  } catch (error) {
    console.error("Error creating comment:", error)
    return { success: false, message: "Failed to create comment" }
  }
}

/**
 * Get comments for a post
 * @param {string} postId - The post ID
 * @param {number} limitCount - Maximum number of comments to retrieve
 * @returns {Array} - Array of comment objects
 */
export const getPostComments = async (postId, limitCount = 50) => {
  try {
    const commentsQuery = query(
      collection(db, "comments"),
      where("postId", "==", postId),
      where("isDeleted", "==", false),
      orderBy("createdAt", "asc"),
      limit(limitCount),
    )

    const commentsSnapshot = await getDocs(commentsQuery)

    return commentsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error("Error getting comments:", error)
    return []
  }
}

/**
 * Delete a comment
 * @param {string} commentId - The comment ID
 * @returns {boolean} - Whether the deletion was successful
 */
export const deleteComment = async (commentId) => {
  try {
    const commentRef = doc(db, "comments", commentId)
    const commentSnapshot = await getDoc(commentRef)

    if (!commentSnapshot.exists()) {
      return false
    }

    const commentData = commentSnapshot.data()

    // Soft delete the comment
    await updateDoc(commentRef, { isDeleted: true })

    // Update post's comment count
    const postRef = doc(db, "posts", commentData.postId)
    const postSnapshot = await getDoc(postRef)

    if (postSnapshot.exists()) {
      const postData = postSnapshot.data()
      await updateDoc(postRef, {
        commentsCount: Math.max((postData.commentsCount || 0) - 1, 0),
      })
    }

    return true
  } catch (error) {
    console.error("Error deleting comment:", error)
    return false
  }
}

/**
 * Edit a comment
 * @param {string} commentId - The comment ID
 * @param {string} newContent - The new comment content
 * @returns {boolean} - Whether the edit was successful
 */
export const editComment = async (commentId, newContent) => {
  try {
    if (!newContent.trim()) {
      return false
    }

    const commentRef = doc(db, "comments", commentId)
    await updateDoc(commentRef, {
      content: newContent,
      editedAt: serverTimestamp(),
    })

    return true
  } catch (error) {
    console.error("Error editing comment:", error)
    return false
  }
}
