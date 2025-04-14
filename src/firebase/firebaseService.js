import { db, auth, storage } from "./firebase-config"
import { collection, getDocs, query, limit } from "firebase/firestore"
import { connectFirestoreEmulator } from "firebase/firestore"

// Test Firestore connection
export const testFirestoreConnection = async () => {
  try {
    // Try to get a small amount of data to test the connection
    const testQuery = query(collection(db, "users"), limit(1))
    await getDocs(testQuery)
    console.log("Firestore connection successful")
    return true
  } catch (error) {
    console.error("Firestore connection error:", error)
    return false
  }
}

// Initialize Firebase services
export const initializeFirebaseServices = () => {
  if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === "true") {
    try {
      // Connect to Firestore emulator if available
      connectFirestoreEmulator(db, "localhost", 8080)
      console.log("Connected to Firestore emulator")
    } catch (error) {
      console.error("Failed to connect to emulators:", error)
    }
  }
  try {
    console.log("Firebase services initialized")
    return { db, auth, storage }
  } catch (error) {
    console.error("Error initializing Firebase services:", error)
    throw error
  }
}

// Export a function to check if Firebase is properly initialized
export const checkFirebaseInitialization = () => {
  if (!db || !auth || !storage) {
    console.error("Firebase not properly initialized")
    return false
  }
  return true
}
