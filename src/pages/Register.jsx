"use client"

import { useState, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext.jsx"
import { Mail, Lock, AlertCircle, ShieldCheck } from "lucide-react"

export default function Register() {
  const emailRef = useRef()
  const passwordRef = useRef()
  const passwordConfirmRef = useRef()
  const { signup, setAdminStatus } = useAuth()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [isAdmin, setIsAdmin] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()

    if (passwordRef.current.value !== passwordConfirmRef.current.value) {
      return setError("Passwords do not match")
    }

    try {
      setError("")
      setLoading(true)
      const result = await signup(emailRef.current.value, passwordRef.current.value)

      console.log("User registered:", result.user.uid)

      // Set admin status if checkbox is checked
      if (isAdmin) {
        const adminSet = setAdminStatus(result.user.uid, true)
        console.log("Admin status set:", adminSet)

        // Force a small delay to ensure admin status is set before redirect
        setTimeout(() => {
          navigate("/admin-dashboard")
        }, 100)
      } else {
        navigate("/dashboard")
      }
    } catch (error) {
      setError("Failed to create an account: " + error.message)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Sign Up</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 flex items-center">
            <AlertCircle className="mr-2" size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-gray-700 mb-1">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                type="email"
                ref={emailRef}
                required
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                type="password"
                ref={passwordRef}
                required
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password-confirm" className="block text-gray-700 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password-confirm"
                type="password"
                ref={passwordConfirmRef}
                required
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Confirm your password"
              />
            </div>
          </div>

          <div className="flex items-center mb-4">
            <input
              id="admin-checkbox"
              type="checkbox"
              checked={isAdmin}
              onChange={(e) => setIsAdmin(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="admin-checkbox" className="ml-2 flex items-center text-sm text-gray-700">
              <span>Register as Admin</span>
              {isAdmin && <ShieldCheck className="ml-1 h-4 w-4 text-purple-600" />}
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full ${
              isAdmin ? "bg-purple-600 hover:bg-purple-700" : "bg-blue-500 hover:bg-blue-600"
            } text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              isAdmin ? "focus:ring-purple-500" : "focus:ring-blue-500"
            }`}
          >
            {loading ? "Signing Up..." : isAdmin ? "Sign Up as Admin" : "Sign Up"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 hover:text-blue-500">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
