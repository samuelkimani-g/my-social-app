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

    const postsRef = collection(db, "posts")
    const newPost = await addDoc(postsRef, {
      ...postData,
      likesCount: 0,
      commentsCount: 0,
      isDeleted: false,
      timestamp: serverTimestamp(),
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

    return { id: newPost.id }
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

    if (lastVisible) {
      postsQuery = query(
        collection(db, "posts"),
        where("isDeleted", "==", false),
        orderBy("timestamp", "desc"),
        startAfter(lastVisible),
        limit(limitCount),
      )
    } else {
      postsQuery = query(
        collection(db, "posts"),
        where("isDeleted", "==", false),
        orderBy("timestamp", "desc"),
        limit(limitCount),
      )
    }

    const postsSnapshot = await getDocs(postsQuery)
    console.log("Posts query returned", postsSnapshot.docs.length, "documents")

    const lastVisibleDoc = postsSnapshot.docs.length > 0 ? postsSnapshot.docs[postsSnapshot.docs.length - 1] : null

    const posts = postsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

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

    const lastVisibleDoc = postsSnapshot.docs.length > 0 ? postsSnapshot.docs[postsSnapshot.docs.length - 1] : null

    const posts = postsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return { posts, lastVisible: lastVisibleDoc }
  } catch (error) {
    console.error("Error getting followed posts:", error)
    return { posts: [], lastVisible: null }
  }
}

// Delete post (admin or author)
export const deletePost = async (postId) => {
  try {
    console.log("Deleting post:", postId)
    const postRef = doc(db, "posts", postId)
    await updateDoc(postRef, { isDeleted: true })
    console.log("Post marked as deleted")
    return true
  } catch (error) {
    console.error("Error deleting post:", error)
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
