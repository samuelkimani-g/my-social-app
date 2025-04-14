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

// Follow a user
export const followUser = async (followerId, followeeId) => {
  try {
    // Check if already following
    const followsQuery = query(
      collection(db, "follows"),
      where("followerId", "==", followerId),
      where("followeeId", "==", followeeId),
    )

    const followSnapshot = await getDocs(followsQuery)

    if (!followSnapshot.empty) {
      return { success: false, message: "Already following this user" }
    }

    // Create follow relationship
    await addDoc(collection(db, "follows"), {
      followerId,
      followeeId,
      followedAt: serverTimestamp(),
    })

    // Update follower's following count
    const followerRef = doc(db, "users", followerId)
    const followerSnapshot = await getDoc(followerRef)

    if (followerSnapshot.exists()) {
      const followerData = followerSnapshot.data()
      await updateDoc(followerRef, {
        followingCount: (followerData.followingCount || 0) + 1,
      })
    }

    // Update followee's followers count
    const followeeRef = doc(db, "users", followeeId)
    const followeeSnapshot = await getDoc(followeeRef)

    if (followeeSnapshot.exists()) {
      const followeeData = followeeSnapshot.data()
      await updateDoc(followeeRef, {
        followersCount: (followeeData.followersCount || 0) + 1,
      })
    }

    // Create notification for the followee
    await createNotification({
      userId: followeeId,
      type: "follow",
      fromUserId: followerId,
      data: {},
    })

    return { success: true }
  } catch (error) {
    console.error("Error following user:", error)
    return { success: false, message: "Failed to follow user" }
  }
}

// Unfollow a user
export const unfollowUser = async (followerId, followeeId) => {
  try {
    // Find the follow document
    const followsQuery = query(
      collection(db, "follows"),
      where("followerId", "==", followerId),
      where("followeeId", "==", followeeId),
    )

    const followSnapshot = await getDocs(followsQuery)

    if (followSnapshot.empty) {
      return { success: false, message: "Not following this user" }
    }

    // Delete the follow document
    await deleteDoc(doc(db, "follows", followSnapshot.docs[0].id))

    // Update follower's following count
    const followerRef = doc(db, "users", followerId)
    const followerSnapshot = await getDoc(followerRef)

    if (followerSnapshot.exists()) {
      const followerData = followerSnapshot.data()
      await updateDoc(followerRef, {
        followingCount: Math.max((followerData.followingCount || 0) - 1, 0),
      })
    }

    // Update followee's followers count
    const followeeRef = doc(db, "users", followeeId)
    const followeeSnapshot = await getDoc(followeeRef)

    if (followeeSnapshot.exists()) {
      const followeeData = followeeSnapshot.data()
      await updateDoc(followeeRef, {
        followersCount: Math.max((followeeData.followersCount || 0) - 1, 0),
      })
    }

    return { success: true }
  } catch (error) {
    console.error("Error unfollowing user:", error)
    return { success: false, message: "Failed to unfollow user" }
  }
}

// Check if user is following another user
export const checkIsFollowing = async (followerId, followeeId) => {
  try {
    const followsQuery = query(
      collection(db, "follows"),
      where("followerId", "==", followerId),
      where("followeeId", "==", followeeId),
    )

    const followSnapshot = await getDocs(followsQuery)
    return !followSnapshot.empty
  } catch (error) {
    console.error("Error checking follow status:", error)
    return false
  }
}

// Get users that a user is following
export const getFollowing = async (userId) => {
  try {
    const followsQuery = query(collection(db, "follows"), where("followerId", "==", userId))

    const followSnapshot = await getDocs(followsQuery)

    return followSnapshot.docs.map((doc) => doc.data().followeeId)
  } catch (error) {
    console.error("Error getting following:", error)
    return []
  }
}

// Get users that follow a user
export const getFollowers = async (userId) => {
  try {
    const followsQuery = query(collection(db, "follows"), where("followeeId", "==", userId))

    const followSnapshot = await getDocs(followsQuery)

    return followSnapshot.docs.map((doc) => doc.data().followerId)
  } catch (error) {
    console.error("Error getting followers:", error)
    return []
  }
}
