import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  deleteDoc,
  increment,
  Timestamp,
} from "firebase/firestore"
import { db, auth } from "../firebase/firebase-config";
// Create a new post
export const createPost = async (postData) => {
  try {
    console.log("Creating post with data:", postData)

    // Get current user from localStorage
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error("No user found in localStorage")
      return null
    }

    // Create post document
    const postRef = collection(db, "posts")
    const newPost = {
      content: postData.content || "",
      authorId: currentUser.uid,
      timestamp: serverTimestamp(),
      likesCount: 0,
      commentsCount: 0,
      likes: [],
      isDeleted: false,
      imageUrl: postData.imageUrl || null,
      videoUrl: postData.videoUrl || null,
    }

    const docRef = await addDoc(postRef, newPost)
    console.log("Post created with ID:", docRef.id)

    // Update user's post count
    const userRef = doc(db, "users", currentUser.uid)
    await updateDoc(userRef, {
      postsCount: increment(1),
    })

    // Return the created post with its ID
    return {
      id: docRef.id,
      ...newPost,
      timestamp: Timestamp.now(), // Use current timestamp for immediate display
    }
  } catch (error) {
    console.error("Error creating post:", error)
    return null
  }
}
// Update a post
export const updatePost = async (postId, updatedData) => {
  try {
    const postRef = doc(db, "posts", postId);
    await updateDoc(postRef, {
      ...updatedData,
      updatedAt: serverTimestamp(),
    });
    console.log("Post updated successfully");
    return true;
  } catch (error) {
    console.error("Error editing post:", error);
    return false;
  }
};


// Get all posts
export const getAllPosts = async (lastVisible = null, limitCount = 10) => {
  try {
    console.log("Getting all posts")

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

    if (postsSnapshot.empty) {
      console.log("No posts found")
      return { posts: [], lastVisible: null }
    }

    const lastVisibleDoc = postsSnapshot.docs[postsSnapshot.docs.length - 1]

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

    console.log("Processed posts:", posts.length)
    return { posts, lastVisible: lastVisibleDoc }
  } catch (error) {
    console.error("Error getting all posts:", error)
    return { posts: [], lastVisible: null }
  }
}

// Add the getAllPostsForAdmin function after the getAllPosts function

// Get all posts for admin dashboard
export const getAllPostsForAdmin = async (lastVisible = null, limitCount = 20) => {
  try {
    console.log("Getting all posts for admin")

    // Get current user from localStorage
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.role !== "admin") {
      console.error("Unauthorized access to admin function")
      return { posts: [], lastVisible: null }
    }

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
      postsQuery = query(collection(db, "posts"), orderBy("timestamp", "desc"), limit(limitCount))
    }

    const postsSnapshot = await getDocs(postsQuery)
    console.log("Admin posts query returned", postsSnapshot.docs.length, "documents")

    if (postsSnapshot.empty) {
      console.log("No posts found")
      return { posts: [], lastVisible: null }
    }

    const lastVisibleDoc = postsSnapshot.docs[postsSnapshot.docs.length - 1]

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

    console.log("Processed admin posts:", posts.length)
    return { posts, lastVisible: lastVisibleDoc }
  } catch (error) {
    console.error("Error getting admin posts:", error)
    return { posts: [], lastVisible: null }
  }
}

// Get posts from followed users
export const getFollowedPosts = async (userId, followingIds, lastVisible = null, limitCount = 10) => {
  try {
    console.log("Getting posts for followed users:", followingIds)

    if (!followingIds || followingIds.length === 0) {
      console.log("No following IDs provided")
      return { posts: [], lastVisible: null }
    }

    let postsQuery

    if (lastVisible) {
      postsQuery = query(
        collection(db, "posts"),
        where("authorId", "in", followingIds),
        where("isDeleted", "==", false),
        orderBy("timestamp", "desc"),
        startAfter(lastVisible),
        limit(limitCount),
      )
    } else {
      postsQuery = query(
        collection(db, "posts"),
        where("authorId", "in", followingIds),
        where("isDeleted", "==", false),
        orderBy("timestamp", "desc"),
        limit(limitCount),
      )
    }

    const postsSnapshot = await getDocs(postsQuery)
    console.log("Followed posts query returned", postsSnapshot.docs.length, "documents")

    if (postsSnapshot.empty) {
      console.log("No posts found for followed users")
      return { posts: [], lastVisible: null }
    }

    const lastVisibleDoc = postsSnapshot.docs[postsSnapshot.docs.length - 1]

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

    console.log("Processed followed posts:", posts.length)
    return { posts, lastVisible: lastVisibleDoc }
  } catch (error) {
    console.error("Error getting followed posts:", error)
    return { posts: [], lastVisible: null }
  }
}
export const getPostsByUser = async (userId) => {
  const q = query(
    collection(db, "posts"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// Get a single post by ID
export const getPostById = async (postId) => {
  try {
    console.log("Getting post by ID:", postId)

    const postRef = doc(db, "posts", postId)
    const postSnapshot = await getDoc(postRef)

    if (!postSnapshot.exists()) {
      console.log("Post not found")
      return null
    }

    const postData = postSnapshot.data()

    // Check if post is deleted
    if (postData.isDeleted) {
      console.log("Post is deleted")
      return null
    }

    return {
      id: postSnapshot.id,
      ...postData,
      timestamp: postData.timestamp || { seconds: Date.now() / 1000 },
    }
  } catch (error) {
    console.error("Error getting post by ID:", error)
    return null
  }
}

// Get posts by user ID
export const getUserPosts = async (userId, lastVisible = null, limitCount = 10) => {
  try {
    console.log("Getting posts for user:", userId)

    let postsQuery

    if (lastVisible) {
      postsQuery = query(
        collection(db, "posts"),
        where("authorId", "==", userId),
        where("isDeleted", "==", false),
        orderBy("timestamp", "desc"),
        startAfter(lastVisible),
        limit(limitCount),
      )
    } else {
      postsQuery = query(
        collection(db, "posts"),
        where("authorId", "==", userId),
        where("isDeleted", "==", false),
        orderBy("timestamp", "desc"),
        limit(limitCount),
      )
    }

    const postsSnapshot = await getDocs(postsQuery)
    console.log("User posts query returned", postsSnapshot.docs.length, "documents")

    if (postsSnapshot.empty) {
      console.log("No posts found for this user")
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

    console.log("Processed user posts:", posts)
    return { posts, lastVisible: lastVisibleDoc }
  } catch (error) {
    console.error("Error getting user posts:", error)
    return { posts: [], lastVisible: null }
  }
}

// Edit a post
export const editPost = async (postId, updates) => {
  try {
    const postRef = doc(db, "posts", postId);
    const postSnapshot = await getDoc(postRef);
    const postData = postSnapshot.data();
    const currentUser = auth.currentUser; // Make sure to use auth.currentUser here

    if (postData.authorId !== currentUser?.uid && currentUser?.role !== "admin") {
      console.error("Not authorized to edit");
      return false;
    }

    await updateDoc(postRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error("Error editing post:", error);
    return false;
  }
};

// Delete a post
export const deletePost = async (postId) => {
  try {
    const postRef = doc(db, "posts", postId);
    const postSnapshot = await getDoc(postRef);
    const postData = postSnapshot.data();
    const currentUser = auth.currentUser;
    // Allow if user is author OR admin
    if (
      postData.authorId !== currentUser?.uid && 
      currentUser?.role !== "admin"
    ) {
      console.error("Not authorized");
      return false;
    }

    // Soft delete logic
    await updateDoc(postRef, {
      isDeleted: true,
      deletedAt: serverTimestamp(),
    });

    // Update post count (only for authors, not admins)
    if (postData.authorId === currentUser?.uid) {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, { postsCount: increment(-1) });
    }

    return true;
  } catch (error) {
    console.error("Error deleting post:", error);
    return false;
  }
};
// Hard delete a post (admin only)
export const hardDeletePost = async (postId) => {
  try {
    console.log("Hard deleting post:", postId)

    // First check if the post exists
    const postRef = doc(db, "posts", postId)
    const postSnapshot = await getDoc(postRef)

    if (!postSnapshot.exists()) {
      console.error("Post not found")
      return false
    }

    const postData = postSnapshot.data()
    const currentUser = auth.currentUser;

    // Security check - only allow admins to hard delete
    if (currentUser?.role !== "admin") {
      console.error("Not authorized to hard delete posts")
      return false
    }

    // Hard delete the post
    await deleteDoc(postRef)

    // Update user's post count
    const userRef = doc(db, "users", postData.authorId)
    await updateDoc(userRef, {
      postsCount: increment(-1),
    })

    console.log("Post hard deleted successfully")
    return true
  } catch (error) {
    console.error("Error hard deleting post:", error)
    return false
  }
}

// Add this function after the hardDeletePost function

// Permanently delete a post (admin only) - alias for hardDeletePost for compatibility
export const permanentlyDeletePost = async (postId) => {
  return hardDeletePost(postId)
}

// Like a post
export const likePost = async (userId, postId) => {
  try {
    console.log("Liking post:", postId, "by user:", userId)

    const postRef = doc(db, "posts", postId)
    const postSnapshot = await getDoc(postRef)

    if (!postSnapshot.exists()) {
      console.error("Post not found")
      return { success: false, message: "Post not found" }
    }

    const postData = postSnapshot.data()

    // Check if user already liked the post
    const likes = postData.likes || []
    if (likes.includes(userId)) {
      console.log("User already liked this post")
      return { success: false, message: "Already liked" }
    }

    // Add user to likes array and increment count
    await updateDoc(postRef, {
      likes: [...likes, userId],
      likesCount: increment(1),
    })

    console.log("Post liked successfully")
    return { success: true }
  } catch (error) {
    console.error("Error liking post:", error)
    return { success: false, message: error.message }
  }
}

// Unlike a post
export const unlikePost = async (userId, postId) => {
  try {
    console.log("Unliking post:", postId, "by user:", userId)

    const postRef = doc(db, "posts", postId)
    const postSnapshot = await getDoc(postRef)

    if (!postSnapshot.exists()) {
      console.error("Post not found")
      return { success: false, message: "Post not found" }
    }

    const postData = postSnapshot.data()

    // Check if user has liked the post
    const likes = postData.likes || []
    if (!likes.includes(userId)) {
      console.log("User hasn't liked this post")
      return { success: false, message: "Not liked yet" }
    }

    // Remove user from likes array and decrement count
    await updateDoc(postRef, {
      likes: likes.filter((id) => id !== userId),
      likesCount: increment(-1),
    })

    console.log("Post unliked successfully")
    return { success: true }
  } catch (error) {
    console.error("Error unliking post:", error)
    return { success: false, message: error.message }
  }
}

// Upload image to external service (IMGBB)
export const uploadImageExternal = async (imageFile) => {
  try {
    console.log("Uploading image to external service")

    // Create form data for the image upload
    const formData = new FormData()
    formData.append("image", imageFile)

    // Use a free image hosting service like ImgBB
    // Note: In a production app, you would use your own API key
    const response = await fetch("https://api.imgbb.com/1/upload?key=YOUR_IMGBB_API_KEY", {
      method: "POST",
      body: formData,
    })

    const data = await response.json()

    if (data.success) {
      console.log("Image uploaded successfully:", data.data.url)
      return data.data.url
    } else {
      console.error("Failed to upload image:", data)
      throw new Error("Image upload failed")
    }
  } catch (error) {
    console.error("Error uploading image:", error)
    throw error
  }
}

// Get trending posts
export const getTrendingPosts = async (limitCount = 10) => {
  try {
    console.log("Getting trending posts")

    // Query posts with high like counts
    const postsQuery = query(
      collection(db, "posts"),
      where("isDeleted", "==", false),
      orderBy("likesCount", "desc"),
      limit(limitCount),
    )

    const postsSnapshot = await getDocs(postsQuery)
    console.log("Trending posts query returned", postsSnapshot.docs.length, "documents")

    if (postsSnapshot.empty) {
      console.log("No trending posts found")
      return []
    }

    const posts = postsSnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp || { seconds: Date.now() / 1000 },
      }
    })

    console.log("Processed trending posts:", posts.length)
    return posts
  } catch (error) {
    console.error("Error getting trending posts:", error)
    return []
  }
}

// Search posts by content
export const searchPosts = async (searchTerm, limitCount = 20) => {
  try {
    console.log("Searching posts for:", searchTerm)

    // Get all non-deleted posts
    const postsQuery = query(
      collection(db, "posts"),
      where("isDeleted", "==", false),
      orderBy("timestamp", "desc"),
      limit(100), // Get a larger batch to filter through
    )

    const postsSnapshot = await getDocs(postsQuery)
    console.log("Search query returned", postsSnapshot.docs.length, "documents")

    if (postsSnapshot.empty) {
      console.log("No posts found for search")
      return []
    }

    // Filter posts by content containing the search term
    const searchTermLower = searchTerm.toLowerCase()
    const filteredPosts = postsSnapshot.docs
      .map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp || { seconds: Date.now() / 1000 },
        }
      })
      .filter((post) => post.content && post.content.toLowerCase().includes(searchTermLower))
      .slice(0, limitCount)

    console.log("Filtered search results:", filteredPosts.length)
    return filteredPosts
  } catch (error) {
    console.error("Error searching posts:", error)
    return []
  }
}

// Update post comment count
export const updatePostCommentCount = async (postId, increment) => {
  try {
    console.log("Updating comment count for post:", postId, "by:", increment)

    const postRef = doc(db, "posts", postId)
    await updateDoc(postRef, {
      commentsCount: increment,
    })

    console.log("Comment count updated successfully")
    return true
  } catch (error) {
    console.error("Error updating comment count:", error)
    return false
  }
}

// Report a post
export const reportPost = async (postId, userId, reason) => {
  try {
    console.log("Reporting post:", postId, "by user:", userId)

    // Create a report document
    const reportRef = collection(db, "reports")
    await addDoc(reportRef, {
      postId,
      reportedBy: userId,
      reason,
      timestamp: serverTimestamp(),
      status: "pending", // pending, reviewed, dismissed
    })

    console.log("Post reported successfully")
    return true
  } catch (error) {
    console.error("Error reporting post:", error)
    return false
  }
}

// Get reported posts (admin only)
export const getReportedPosts = async () => {
  try {
    console.log("Getting reported posts")

    const currentUser = auth.currentUser;

    // Security check - only allow admins
    if (currentUser?.role !== "admin") {
      console.error("Not authorized to view reported posts")
      return []
    }

    // Get all pending reports
    const reportsQuery = query(
      collection(db, "reports"),
      where("status", "==", "pending"),
      orderBy("timestamp", "desc"),
    )

    const reportsSnapshot = await getDocs(reportsQuery)
    console.log("Reports query returned", reportsSnapshot.docs.length, "documents")

    if (reportsSnapshot.empty) {
      console.log("No reports found")
      return []
    }

    // Get all reported posts
    const reportedPosts = []
    for (const reportDoc of reportsSnapshot.docs) {
      const reportData = reportDoc.data()

      // Get the post data
      const postRef = doc(db, "posts", reportData.postId)
      const postSnapshot = await getDoc(postRef)

      if (postSnapshot.exists()) {
        const postData = postSnapshot.data()
        reportedPosts.push({
          reportId: reportDoc.id,
          ...reportData,
          post: {
            id: postSnapshot.id,
            ...postData,
          },
        })
      }
    }

    console.log("Processed reported posts:", reportedPosts.length)
    return reportedPosts
  } catch (error) {
    console.error("Error getting reported posts:", error)
    return []
  }
}

