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
  startAfter,
  serverTimestamp,
  increment,
} from "firebase/firestore"

// Create a new post
export const createPost = async (postData) => {
  try {
    console.log("Creating post with data:", postData)

    // Validate required fields
    if (!postData.authorId) {
      console.error("Author ID is required")
      return null
    }

    // Create a timestamp now to use in both the database and return value
    const now = serverTimestamp()
    const clientTimestamp = { seconds: Date.now() / 1000, nanoseconds: 0 }

    const postsRef = collection(db, "posts")
    const newPost = await addDoc(postsRef, {
      ...postData,
      likesCount: 0,
      commentsCount: 0,
      isDeleted: false,
      timestamp: now,
    })

    console.log("Post created with ID:", newPost.id)

    // Update user's post count
    try {
      const userRef = doc(db, "users", postData.authorId)
      const userSnapshot = await getDoc(userRef)

      if (userSnapshot.exists()) {
        const userData = userSnapshot.data()
        await updateDoc(userRef, {
          postsCount: (userData.postsCount || 0) + 1,
        })
        console.log("Updated user post count")
      } else {
        console.log("User document not found, couldn't update post count")
      }
    } catch (userError) {
      console.error("Error updating user post count:", userError)
      // Continue even if updating user post count fails
    }

    // Return both the ID and a normalized post object with a client-side timestamp
    // that can be used immediately without waiting for the server timestamp
    return {
      id: newPost.id,
      ...postData,
      likesCount: 0,
      commentsCount: 0,
      isDeleted: false,
      timestamp: clientTimestamp,
    }
  } catch (error) {
    console.error("Error creating post:", error)
    return null
  }
}

// Get post by ID
export const getPostById = async (postId) => {
  try {
    console.log("Getting post by ID:", postId)
    const postRef = doc(db, "posts", postId)
    const postSnapshot = await getDoc(postRef)

    if (postSnapshot.exists()) {
      const postData = { id: postSnapshot.id, ...postSnapshot.data() }
      console.log("Post data retrieved:", postData)
      return postData
    } else {
      console.log("Post not found")
      return null
    }
  } catch (error) {
    console.error("Error getting post:", error)
    return null
  }
}

// Get all posts (for feed or admin)
export const getAllPosts = async (lastVisible = null, limitCount = 10) => {
  try {
    console.log("Getting all posts, lastVisible:", lastVisible ? "yes" : "no")

    let postsQuery

    // Use a simpler query that doesn't require a composite index
    if (lastVisible) {
      postsQuery = query(
        collection(db, "posts"),
        orderBy("timestamp", "desc"),
        startAfter(lastVisible),
        limit(limitCount),
      )
    } else {
      postsQuery = query(collection(db, "posts"), orderBy("timestamp", "desc"), limit(limitCount))
    }

    const postsSnapshot = await getDocs(postsQuery)
    console.log("Posts query returned", postsSnapshot.docs.length, "documents")

    if (postsSnapshot.empty) {
      console.log("No posts found in the database")
      return { posts: [], lastVisible: null }
    }

    const lastVisibleDoc = postsSnapshot.docs.length > 0 ? postsSnapshot.docs[postsSnapshot.docs.length - 1] : null

    const posts = postsSnapshot.docs
      .map((doc) => {
        const data = doc.data()
        // Filter out deleted posts on the client side instead of in the query
        if (data.isDeleted) return null

        // Ensure timestamp is properly formatted
        const timestamp = data.timestamp ? data.timestamp : { seconds: Date.now() / 1000 }

        return {
          id: doc.id,
          ...data,
          timestamp,
        }
      })
      .filter((post) => post !== null) // Remove deleted posts

    console.log("Returning posts:", posts.length)
    return { posts, lastVisible: lastVisibleDoc }
  } catch (error) {
    console.error("Error getting posts:", error)
    return { posts: [], lastVisible: null }
  }
}

// Get posts from followed users
export const getFollowedPosts = async (userId, followingIds, lastVisible = null, limitCount = 10) => {
  try {
    console.log("Getting followed posts for user:", userId, "following:", followingIds)

    // If no following IDs, return empty result
    if (!followingIds || followingIds.length === 0) {
      console.log("No following IDs provided, returning empty result")
      return { posts: [], lastVisible: null }
    }

    // Include user's own posts and followed users' posts
    const idsToQuery = [...followingIds, userId].slice(0, 10) // Firestore "in" query limited to 10 values
    console.log("IDs to query:", idsToQuery)

    let postsQuery

    if (lastVisible) {
      postsQuery = query(
        collection(db, "posts"),
        where("authorId", "in", idsToQuery),
        where("isDeleted", "==", false),
        orderBy("timestamp", "desc"),
        startAfter(lastVisible),
        limit(limitCount),
      )
    } else {
      postsQuery = query(
        collection(db, "posts"),
        where("authorId", "in", idsToQuery),
        where("isDeleted", "==", false),
        orderBy("timestamp", "desc"),
        limit(limitCount),
      )
    }

    const postsSnapshot = await getDocs(postsQuery)
    console.log("Followed posts query returned", postsSnapshot.docs.length, "documents")

    if (postsSnapshot.empty) {
      console.log("No followed posts found")
      return { posts: [], lastVisible: null }
    }

    const lastVisibleDoc = postsSnapshot.docs.length > 0 ? postsSnapshot.docs[postsSnapshot.docs.length - 1] : null

    const posts = postsSnapshot.docs.map((doc) => {
      const data = doc.data()
      // Ensure timestamp is properly formatted
      const timestamp = data.timestamp ? data.timestamp : { seconds: Date.now() / 1000 }

      return {
        id: doc.id,
        ...data,
        timestamp,
      }
    })

    console.log("Processed followed posts:", posts)
    return { posts, lastVisible: lastVisibleDoc }
  } catch (error) {
    console.error("Error getting followed posts:", error)
    return { posts: [], lastVisible: null }
  }
}

// Delete post (admin or author)
export const deletePost = async (postId) => {
  try {
    console.log("Soft deleting post:", postId)
    const postRef = doc(db, "posts", postId)

    // Get the post data first to verify it exists
    const postSnapshot = await getDoc(postRef)
    if (!postSnapshot.exists()) {
      console.error("Post not found:", postId)
      return false
    }

    // Update the post with deletion flags
    await updateDoc(postRef, {
      isDeleted: true,
      deletedAt: serverTimestamp(),
      deletionReason: "Admin removed",
    })

    console.log("Post marked as deleted successfully")
    return true
  } catch (error) {
    console.error("Error deleting post:", error)
    return false
  }
}

// Permanently delete post (admin only)
export const permanentlyDeletePost = async (postId) => {
  try {
    console.log("Permanently deleting post:", postId)
    const postRef = doc(db, "posts", postId)

    // Get post data for author's post count update
    const postSnapshot = await getDoc(postRef)
    if (!postSnapshot.exists()) {
      console.error("Post not found for permanent deletion:", postId)
      return false
    }

    const postData = postSnapshot.data()

    // Update author's post count
    if (postData.authorId) {
      const authorRef = doc(db, "users", postData.authorId)
      const authorSnapshot = await getDoc(authorRef)
      if (authorSnapshot.exists()) {
        const authorData = authorSnapshot.data()
        await updateDoc(authorRef, {
          postsCount: Math.max((authorData.postsCount || 0) - 1, 0),
        })
        console.log("Updated author post count for user:", postData.authorId)
      }
    }

    // Mark the post as permanently deleted
    // Note: In a real app, you might want to actually delete the document
    // but for audit purposes, we're just marking it
    await updateDoc(postRef, {
      isDeleted: true,
      deletedAt: serverTimestamp(),
      permanentlyDeleted: true,
      deletionReason: "Admin permanent removal",
    })

    console.log("Post permanently deleted")
    return true
  } catch (error) {
    console.error("Error permanently deleting post:", error)
    return false
  }
}

// Search posts by content
export const searchPosts = async (searchTerm, limitCount = 10) => {
  try {
    console.log("Searching posts with term:", searchTerm)

    // Firebase doesn't support native LIKE queries, so we'll get recent posts and filter
    // In a production app, you'd use a more scalable approach like Algolia
    const postsQuery = query(
      collection(db, "posts"),
      where("isDeleted", "==", false),
      orderBy("timestamp", "desc"),
      limit(100), // Limit to prevent loading too many posts
    )

    const postsSnapshot = await getDocs(postsQuery)
    console.log("Search query returned", postsSnapshot.docs.length, "documents")

    const filteredPosts = postsSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((post) => post.content && post.content.toLowerCase().includes(searchTerm.toLowerCase()))
      .slice(0, limitCount)

    console.log("Filtered to", filteredPosts.length, "matching posts")
    return filteredPosts
  } catch (error) {
    console.error("Error searching posts:", error)
    return []
  }
}

// Get all posts for admin (including deleted ones)
export const getAllPostsForAdmin = async (lastVisible = null, limitCount = 20) => {
  try {
    let postsQuery

    if (lastVisible) {
      postsQuery = query(
        collection(db, "posts"),
        orderBy("timestamp", "desc"),
        startAfter(lastVisible),
        limit(limitCount),
      )
    } else {
      postsQuery = query(collection(db, "posts"), orderBy("timestamp", "desc"), limit(limitCount))
    }

    const postsSnapshot = await getDocs(postsQuery)
    const lastVisibleDoc = postsSnapshot.docs.length > 0 ? postsSnapshot.docs[postsSnapshot.docs.length - 1] : null

    const posts = postsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return { posts, lastVisible: lastVisibleDoc }
  } catch (error) {
    console.error("Error getting posts for admin:", error)
    return { posts: [], lastVisible: null }
  }
}

// Get reported or flagged posts
export const getFlaggedPosts = async (limitCount = 20) => {
  try {
    const postsQuery = query(
      collection(db, "posts"),
      where("flagged", "==", true),
      orderBy("timestamp", "desc"),
      limit(limitCount),
    )

    const postsSnapshot = await getDocs(postsQuery)

    const posts = postsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return posts
  } catch (error) {
    console.error("Error getting flagged posts:", error)
    return []
  }
}

// Flag a post for review
export const flagPostForReview = async (postId, userId, reason) => {
  try {
    const postRef = doc(db, "posts", postId)
    const flagRef = collection(db, "flags")

    // Add flag record
    await addDoc(flagRef, {
      postId,
      userId,
      reason,
      timestamp: serverTimestamp(),
      status: "pending", // pending, reviewed, dismissed
    })

    // Mark post as flagged
    await updateDoc(postRef, {
      flagged: true,
      flagCount: increment(1),
    })

    return true
  } catch (error) {
    console.error("Error flagging post:", error)
    return false
  }
}
