import { db } from "../firebase/firebase-config"
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
} from "firebase/firestore"

// Create a new user in Firestore
export const createUser = async (userId, userData) => {
  try {
    const userRef = doc(db, "users", userId)
    const userSnapshot = await getDoc(userRef)

    if (!userSnapshot.exists()) {
      await setDoc(userRef, {
        username: userData.email.split("@")[0], // Default username from email
        email: userData.email,
        profilePic: userData.photoURL || "",
        bio: "",
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
        isBanned: false,
        role: "user", // Default role
        createdAt: serverTimestamp(),
      })
    }
    return true
  } catch (error) {
    console.error("Error creating user:", error)
    return false
  }
}

// Improve the getUserById function to ensure fresh data
export const getUserById = async (userId) => {
  try {
    if (!userId) {
      console.error("getUserById called with null or undefined userId")
      return null
    }

    const userRef = doc(db, "users", userId)
    // Use getDoc with cache: 'reload' option to get fresh data
    const userSnapshot = await getDoc(userRef)

    if (userSnapshot.exists()) {
      return { id: userSnapshot.id, ...userSnapshot.data() }
    } else {
      return null
    }
  } catch (error) {
    console.error("Error getting user:", error)
    return null
  }
}

// Update the updateUserProfile function to ensure proper updating
export const updateUserProfile = async (userId, userData) => {
  try {
    if (!userId) {
      console.error("userId is required for profile update")
      return false
    }

    console.log("Updating user profile with data:", userData)

    // Get the current user data first
    const userRef = doc(db, "users", userId)
    const userSnapshot = await getDoc(userRef)

    if (!userSnapshot.exists()) {
      console.error("User document not found")
      return false
    }

    // Update the user document with new data
    await updateDoc(userRef, {
      ...userData,
      // Ensure updatedAt is always set
      updatedAt: serverTimestamp(),
    })

    console.log("User profile updated in Firestore:", userId)
    return true
  } catch (error) {
    console.error("Error updating user profile:", error)
    throw error // Re-throw to handle in the component
  }
}

// Get all users (for admin)
export const getAllUsers = async (lastVisible = null, limitCount = 10) => {
  try {
    let usersQuery

    if (lastVisible) {
      usersQuery = query(
        collection(db, "users"),
        orderBy("createdAt", "desc"),
        startAfter(lastVisible),
        limit(limitCount),
      )
    } else {
      usersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"), limit(limitCount))
    }

    const usersSnapshot = await getDocs(usersQuery)
    const lastVisibleDoc = usersSnapshot.docs[usersSnapshot.docs.length - 1] || null

    const users = usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return { users, lastVisible: lastVisibleDoc }
  } catch (error) {
    console.error("Error getting users:", error)
    return { users: [], lastVisible: null }
  }
}

// Ban/unban user
export const toggleUserBan = async (userId, isBanned) => {
  try {
    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, { isBanned })
    return true
  } catch (error) {
    console.error("Error toggling user ban:", error)
    return false
  }
}

// Check if user is admin
export const checkUserIsAdmin = async (userId) => {
  try {
    const userRef = doc(db, "users", userId)
    const userSnapshot = await getDoc(userRef)

    if (userSnapshot.exists()) {
      const userData = userSnapshot.data()
      return userData.role === "admin"
    }

    return false
  } catch (error) {
    console.error("Error checking admin status:", error)
    return false
  }
}

// Search users by username
export const searchUsers = async (searchTerm, limitCount = 10) => {
  try {
    // Firebase doesn't support native LIKE queries, so we'll get all users and filter
    // In a production app, you'd use a more scalable approach like Algolia
    const usersQuery = query(
      collection(db, "users"),
      orderBy("username"),
      limit(100), // Limit to prevent loading too many users
    )

    const usersSnapshot = await getDocs(usersQuery)

    const filteredUsers = usersSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((user) => user.username.toLowerCase().includes(searchTerm.toLowerCase()))
      .slice(0, limitCount)

    return filteredUsers
  } catch (error) {
    console.error("Error searching users:", error)
    return []
  }
}

// Get admin permissions
export const getAdminPermissions = async (userId) => {
  try {
    const adminRef = doc(db, "admins", userId)
    const adminSnapshot = await getDoc(adminRef)

    if (adminSnapshot.exists()) {
      return adminSnapshot.data().permissions || []
    }

    return []
  } catch (error) {
    console.error("Error getting admin permissions:", error)
    return []
  }
}
