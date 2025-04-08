"use client"

import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext.jsx"
import { useState } from "react"
import { LogOut, Menu, X, ShieldCheck, User } from "lucide-react"

export default function Navbar() {
  const { currentUser, logout, isAdmin } = useAuth()
  const [error, setError] = useState("")
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  async function handleLogout() {
    setError("")
    try {
      await logout()
    } catch {
      setError("Failed to log out")
    }
  }

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-xl font-bold text-gray-800 flex items-center">
            Firebase Auth
            {isAdmin && <ShieldCheck className="ml-2 h-5 w-5 text-purple-600" />}
          </Link>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-4">
            {currentUser ? (
              <>
                <Link to="/dashboard" className="text-gray-600 hover:text-gray-900 flex items-center">
                  <User size={16} className="mr-1" />
                  Dashboard
                </Link>
                {isAdmin && (
                  <Link to="/admin-dashboard" className="text-gray-600 hover:text-gray-900 flex items-center">
                    <ShieldCheck size={16} className="mr-1 text-purple-600" />
                    Admin
                  </Link>
                )}
                <Link to="/profile" className="text-gray-600 hover:text-gray-900">
                  Profile
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-gray-900">
                  Login
                </Link>
                <Link to="/register" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-3">
              {currentUser ? (
                <>
                  <Link
                    to="/dashboard"
                    className="text-gray-600 hover:text-gray-900 py-2 flex items-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User size={16} className="mr-1" />
                    Dashboard
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin-dashboard"
                      className="text-gray-600 hover:text-gray-900 py-2 flex items-center"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <ShieldCheck size={16} className="mr-1 text-purple-600" />
                      Admin
                    </Link>
                  )}
                  <Link
                    to="/profile"
                    className="text-gray-600 hover:text-gray-900 py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout()
                      setIsMenuOpen(false)
                    }}
                    className="flex items-center gap-1 text-gray-600 hover:text-gray-900 py-2"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-600 hover:text-gray-900 py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md inline-block"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      {error && <div className="bg-red-100 text-red-700 p-2 text-center">{error}</div>}
    </nav>
  )
}
