"use client"

import { Navigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext.jsx"

export default function PrivateRoute({ children }) {
  const { currentUser } = useAuth()

  return currentUser ? children : <Navigate to="/login" />
}
