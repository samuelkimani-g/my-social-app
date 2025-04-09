"use client"

import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { logSecurityEvent } from "../services/logService"

/**
 * Custom hook to protect admin routes on the client side
 * This is an additional layer of protection beyond server-side checks
 */
export function useAdminProtection() {
  const { currentUser, isAdmin } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const checkAdminAccess = async () => {
      // If user isn't logged in or isn't an admin, redirect
      if (!currentUser || !isAdmin) {
        // Log unauthorized access attempt
        if (currentUser && !isAdmin) {
          await logSecurityEvent("unauthorized_admin_access", currentUser.uid, {
            path: window.location.pathname,
          })
        }

        // Redirect to dashboard
        navigate("/dashboard")
      }
    }

    checkAdminAccess()
  }, [currentUser, isAdmin, navigate])

  return { isAdminAuthorized: !!currentUser && isAdmin }
}
