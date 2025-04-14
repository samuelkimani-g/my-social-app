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
import { useNavigate } from "react-router-dom"

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

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
        // Redirect to admin dashboard
        navigate("/admin-dashboard")
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
          // Redirect to admin dashboard
          navigate("/admin-dashboard")
        }
      } else if (isAdminEmail) {
        // If existing user and is admin, redirect to admin dashboard
        navigate("/admin-dashboard")
      }

      return result
    } catch (error) {
      console.error("Error during Google sign in:", error)
      throw error
    }
  }

  async function updateUserProfile(displayName, photoURL) {
    if (isAdmin) {
      console.warn("Admin users should not update their profile through the regular interface")
      return Promise.reject(new Error("Admin profile updates are restricted"))
    }

    if (!currentUser) {
      return Promise.reject(new Error("No user is currently logged in"))
    }

    try {
      // Update the Auth profile
      await updateProfile(currentUser, {
        displayName: displayName || currentUser.displayName,
        photoURL: photoURL || currentUser.photoURL,
      })

      // Force refresh the current user to get the latest data
      await currentUser.reload()

      // Update the local state with the refreshed user
      const refreshedUser = auth.currentUser
      setCurrentUser(refreshedUser)

      console.log("Auth profile updated and refreshed successfully")
      return refreshedUser
    } catch (error) {
      console.error("Error updating auth profile:", error)
      throw error
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Set the current user immediately to avoid delays
        setCurrentUser(user)

        // Check if user is admin in Firestore
        try {
          const userRef = doc(db, "users", user.uid)
          const userDoc = await getDoc(userRef)

          if (userDoc.exists()) {
            const userData = userDoc.data()
            const userIsAdmin = userData.role === "admin"

            // Check if email is in admin list as a double verification
            const isAdminEmail = ADMIN_EMAILS.some(
              (adminEmail) => adminEmail.toLowerCase() === user.email.toLowerCase(),
            )

            // Only set as admin if both role is admin AND email is in admin list
            const confirmedAdmin = userIsAdmin && isAdminEmail
            setIsAdmin(confirmedAdmin)

            // If user is banned, log them out
            if (userData.isBanned) {
              console.log("Banned user attempted to log in:", user.email)
              await signOut(auth)
              alert("Your account has been suspended. Please contact an administrator.")
              setCurrentUser(null)
              setIsAdmin(false)
            } else if (confirmedAdmin) {
              // If user is admin, make sure they're in the admin dashboard
              if (window.location.pathname !== "/admin-dashboard" && !window.location.pathname.startsWith("/admin")) {
                navigate("/admin-dashboard")
              }
            }

            // Ensure Auth profile is in sync with Firestore
            if (userData.profilePic && userData.profilePic !== user.photoURL) {
              try {
                await updateProfile(user, {
                  photoURL: userData.profilePic,
                })
                // Refresh the current user
                setCurrentUser(auth.currentUser)
              } catch (profileError) {
                console.error("Error syncing profile photo:", profileError)
              }
            }

            console.log("User authenticated, admin status:", confirmedAdmin)
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
  }, [navigate])

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
