"use client"

import { createContext, useContext, useState, useEffect } from "react"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { auth, db } from "../firebase/firebase-config.js"
import { ADMIN_EMAILS } from "../config/env.js"

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  async function signup(email, password) {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)

      // Check if the email is in the admin list (case insensitive)
      const isAdminEmail = ADMIN_EMAILS.some((adminEmail) => adminEmail.toLowerCase() === email.toLowerCase())

      // Create or update user document with admin status if applicable
      const userRef = doc(db, "users", result.user.uid)
      await setDoc(
        userRef,
        {
          username: email.split("@")[0],
          email: email.toLowerCase(),
          profilePic: result.user.photoURL || "",
          bio: "",
          followersCount: 0,
          followingCount: 0,
          postsCount: 0,
          isBanned: false,
          role: isAdminEmail ? "admin" : "user",
          createdAt: new Date(),
        },
        { merge: true },
      )

      // Log admin creation for audit purposes
      if (isAdminEmail) {
        console.log(`Admin user created: ${email}`)
      }

      return result
    } catch (error) {
      console.error("Error during signup:", error)
      throw error
    }
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  function logout() {
    return signOut(auth)
  }

  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email)
  }

  async function googleSignIn() {
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)

      // Check if the email is in the admin list (case insensitive)
      const isAdminEmail = ADMIN_EMAILS.some(
        (adminEmail) => adminEmail.toLowerCase() === result.user.email.toLowerCase(),
      )

      // Create or update user document with admin status if applicable
      const userRef = doc(db, "users", result.user.uid)
      const userDoc = await getDoc(userRef)

      if (!userDoc.exists()) {
        await setDoc(userRef, {
          username: result.user.email.split("@")[0],
          email: result.user.email.toLowerCase(),
          profilePic: result.user.photoURL || "",
          bio: "",
          followersCount: 0,
          followingCount: 0,
          postsCount: 0,
          isBanned: false,
          role: isAdminEmail ? "admin" : "user",
          createdAt: new Date(),
        })

        // Log admin creation for audit purposes
        if (isAdminEmail) {
          console.log(`Admin user created via Google: ${result.user.email}`)
        }
      }

      return result
    } catch (error) {
      console.error("Error during Google sign in:", error)
      throw error
    }
  }

  function updateUserProfile(displayName, photoURL) {
    return updateProfile(currentUser, {
      displayName: displayName,
      photoURL: photoURL,
    })
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user)

        // Check if user is admin in Firestore
        try {
          const userRef = doc(db, "users", user.uid)
          const userDoc = await getDoc(userRef)

          if (userDoc.exists()) {
            const userData = userDoc.data()
            const userIsAdmin = userData.role === "admin"
            setIsAdmin(userIsAdmin)
            console.log("User authenticated, admin status:", userIsAdmin)
          } else {
            setIsAdmin(false)
          }
        } catch (error) {
          console.error("Error checking admin status:", error)
          setIsAdmin(false)
        }
      } else {
        setCurrentUser(null)
        setIsAdmin(false)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = {
    currentUser,
    isAdmin,
    signup,
    login,
    logout,
    resetPassword,
    googleSignIn,
    updateUserProfile,
  }

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>
}
