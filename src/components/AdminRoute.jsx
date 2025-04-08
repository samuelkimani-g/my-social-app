"use client"

import { Navigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext.jsx"

export default function AdminRoute({ children }) {
  const { currentUser, isAdmin } = useAuth()

  return currentUser && isAdmin ? children : <Navigate to="/dashboard" />
}
