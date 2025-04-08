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
import { auth } from "../firebase/firebase-config.js"

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password)
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  function logout() {
    localStorage.removeItem(`admin_${currentUser?.uid}`)
    return signOut(auth)
  }

  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email)
  }

  function googleSignIn() {
    const provider = new GoogleAuthProvider()
    return signInWithPopup(auth, provider)
  }

  function updateUserProfile(displayName, photoURL) {
    return updateProfile(currentUser, {
      displayName: displayName,
      photoURL: photoURL,
    })
  }

  // Function to set admin status
  function setAdminStatus(userId, adminStatus) {
    if (adminStatus) {
      localStorage.setItem(`admin_${userId}`, "true")
    } else {
      localStorage.removeItem(`admin_${userId}`)
    }

    // If this is the current user, update the isAdmin state
    if (currentUser && currentUser.uid === userId) {
      setIsAdmin(adminStatus)
    }

    return adminStatus // Return the status for easier checking
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      if (user) {
        // Check if user is admin based on email or stored admin status
        const userIsAdmin = user.email === "admin@gmail.com" || localStorage.getItem(`admin_${user.uid}`) === "true"
        setIsAdmin(userIsAdmin)
        console.log("User authenticated, admin status:", userIsAdmin)
      } else {
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
    setAdminStatus,
  }

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>
}
