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
import PrivateRoute from "./components/PrivateRoute.jsx"
import AdminRoute from "./components/AdminRoute.jsx"
import { useAuth } from "./contexts/AuthContext.jsx"

function App() {
  const { currentUser, isAdmin } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto py-8 px-4">
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
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin-dashboard"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile/:userId"
            element={
              <PrivateRoute>
                <UserProfile />
              </PrivateRoute>
            }
          />
          <Route
            path="/search"
            element={
              <PrivateRoute>
                <SearchPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/explore"
            element={
              <PrivateRoute>
                <ExplorePage />
              </PrivateRoute>
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
        </Routes>
      </div>
    </div>
  )
}

export default App
