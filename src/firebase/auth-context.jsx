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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      if (user) {
        // Check if user is admin based on email or stored admin status
        const isUserAdmin = user.email === "admin@gmail.com" || localStorage.getItem(`admin_${user.uid}`) === "true"
        setIsAdmin(isUserAdmin)
      } else {
        setIsAdmin(false)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  // Add this function to the AuthContext to set admin status
  function setAdminStatus(userId, isAdmin) {
    if (isAdmin) {
      localStorage.setItem(`admin_${userId}`, "true")
    } else {
      localStorage.removeItem(`admin_${userId}`)
    }
  }

  // Update the value object to include the new setAdminStatus function
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
