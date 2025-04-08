"use client"

import { useState, useRef } from "react"
import { useAuth } from "../contexts/AuthContext.jsx"
import { User, Mail, Camera, AlertCircle, CheckCircle } from "lucide-react"

export default function Profile() {
  const { currentUser, updateUserProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [displayName, setDisplayName] = useState(currentUser?.displayName || "")
  const [photoURL, setPhotoURL] = useState(currentUser?.photoURL || "")
  const [previewURL, setPreviewURL] = useState(currentUser?.photoURL || "")
  const fileInputRef = useRef()

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewURL(reader.result)
        setPhotoURL(reader.result) // In a real app, you'd upload to storage and get a URL
      }
      reader.readAsDataURL(file)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()

    try {
      setError("")
      setMessage("")
      setLoading(true)

      await updateUserProfile(displayName, photoURL)
      setMessage("Profile updated successfully!")
    } catch (error) {
      setError("Failed to update profile: " + error.message)
    }

    setLoading(false)
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Profile</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 flex items-center">
            <AlertCircle className="mr-2" size={18} />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 flex items-center">
            <CheckCircle className="mr-2" size={18} />
            <span>{message}</span>
          </div>
        )}

        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-100 mb-2">
              {previewURL ? (
                <img src={previewURL || "/placeholder.svg"} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <User size={48} className="text-gray-400" />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 shadow-md"
            >
              <Camera size={16} />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
          </div>
          <p className="text-sm text-gray-500 mt-1">Click the camera icon to change your photo</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="displayName" className="block text-gray-700 mb-1">
              Display Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your name"
              />
            </div>
          </div>

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
                value={currentUser?.email || ""}
                disabled
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Updating..." : "Update Profile"}
          </button>
        </form>
      </div>
    </div>
  )
}
