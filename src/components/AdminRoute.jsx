"use client"

import { Navigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext.jsx"
import { logSecurityEvent } from "../services/logService"
import { useEffect } from "react"

export default function AdminRoute({ children }) {
  const { currentUser, isAdmin } = useAuth()

  useEffect(() => {
    // Log unauthorized access attempts
    if (currentUser && !isAdmin) {
      logSecurityEvent("unauthorized_admin_access", currentUser.uid, {
        path: window.location.pathname,
      })
    }
  }, [currentUser, isAdmin])

  return currentUser && isAdmin ? children : <Navigate to="/dashboard" />
}
