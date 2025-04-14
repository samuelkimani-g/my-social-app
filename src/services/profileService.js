import { db, storage } from "../firebase/firebase-config"
import { doc, updateDoc } from "firebase/firestore"
import { ref, uploadString, getDownloadURL } from "firebase/storage"

// Upload profile photo using data URL instead of file upload
export const uploadProfilePhotoAsDataUrl = async (userId, dataUrl) => {
  try {
    console.log("Starting profile photo upload with data URL")
    if (!dataUrl || !userId) return null

    // Remove the data URL prefix to get just the base64 data
    const base64Data = dataUrl.split(",")[1]

    // Create a reference to the storage location
    const storageRef = ref(storage, `profile_pics/${userId}/${Date.now()}_profile.jpg`)

    // Upload the data URL string
    await uploadString(storageRef, base64Data, "base64")
    console.log("Profile photo uploaded successfully via data URL")

    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef)
    console.log("Profile photo URL retrieved:", downloadURL)

    return downloadURL
  } catch (error) {
    console.error("Error uploading profile photo:", error)
    throw error
  }
}

// Update user profile without photo upload
export const updateProfileWithoutPhoto = async (userId, userData) => {
  try {
    if (!userId) {
      console.error("userId is required for profile update")
      return false
    }

    console.log("Updating user profile without photo:", userData)

    // Update the user document with new data
    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, userData)

    console.log("User profile updated in Firestore:", userId)
    return true
  } catch (error) {
    console.error("Error updating user profile:", error)
    throw error
  }
}
