"use client"

import { Routes, Route, Navigate } from "react-router-dom"
import Login from "./pages/Login.jsx"
import Register from "./pages/Register.jsx"
import ForgotPassword from "./pages/ForgotPassword.jsx"
import Dashboard from "./pages/Dashboard.jsx"
import AdminDashboard from "./pages/AdminDashboard.jsx"
import Profile from "./pages/Profile.jsx"
import UserProfile from "./pages/UserProfile.jsx"
import SearchPage from "./pages/SearchPage.jsx"
import ExplorePage from "./pages/ExplorePage.jsx"
import Navbar from "./components/Navbar.jsx"
import { useAuth } from "./contexts/AuthContext.jsx"
import { useEffect } from "react"
import ProfileFollowers from "./pages/ProfileFollowers.jsx"
import MyPosts from "./pages/MyPosts";

function App() {
  const { currentUser, isAdmin } = useAuth()

  // Handle admin redirects
  useEffect(() => {
    if (currentUser && isAdmin) {
      // If admin is on a non-admin page, redirect to admin dashboard
      if (!window.location.pathname.includes("/admin") && window.location.pathname !== "/admin-dashboard") {
        window.location.href = "/admin-dashboard"
      }
    }
  }, [currentUser, isAdmin])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Only show navbar for non-admin users */}
      {!(currentUser && isAdmin) && <Navbar />}

      <div className={`${currentUser && isAdmin ? "" : "container mx-auto py-8 px-4"}`}>
        <Routes>
          <Route
            path="/login"
            element={
              currentUser ? isAdmin ? <Navigate to="/admin-dashboard" /> : <Navigate to="/dashboard" /> : <Login />
            }
          />
          <Route
            path="/register"
            element={
              currentUser ? isAdmin ? <Navigate to="/admin-dashboard" /> : <Navigate to="/dashboard" /> : <Register />
            }
          />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/dashboard"
            element={
              currentUser ? isAdmin ? <Navigate to="/admin-dashboard" /> : <Dashboard /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/admin-dashboard"
            element={
              currentUser ? isAdmin ? <AdminDashboard /> : <Navigate to="/dashboard" /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/profile"
            element={
              currentUser ? isAdmin ? <Navigate to="/admin-dashboard" /> : <Profile /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/profile/:userId"
            element={
              currentUser ? isAdmin ? <Navigate to="/admin-dashboard" /> : <UserProfile /> : <Navigate to="/login" />
            }
          />
          {/* Add the new route for followers/following */}
          <Route
            path="/profile/:userId/:type"
            element={
              currentUser ? (
                isAdmin ? (
                  <Navigate to="/admin-dashboard" />
                ) : (
                  <ProfileFollowers />
                )
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/search"
            element={
              currentUser ? isAdmin ? <Navigate to="/admin-dashboard" /> : <SearchPage /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/explore"
            element={
              currentUser ? isAdmin ? <Navigate to="/admin-dashboard" /> : <ExplorePage /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/"
            element={
              currentUser ? (
                isAdmin ? (
                  <Navigate to="/admin-dashboard" />
                ) : (
                  <Navigate to="/dashboard" />
                )
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          {/* Catch-all route - 404 */}
          <Route
            path="*"
            element={
              <div className="text-center p-10">
                <h2 className="text-2xl mb-4">Page Not Found</h2>
                <p>The page you're looking for doesn't exist or you don't have permission to view it.</p>
              </div>
            }
          />
          <Route
  path="/my-posts"
  element={
    currentUser ? (
      isAdmin ? (
        <Navigate to="/admin-dashboard" />
      ) : (
        <MyPosts />
      )
    ) : (
      <Navigate to="/login" />
    )
  }
/>
        </Routes>
      </div>
    </div>
  )
}

export default App
