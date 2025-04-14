"use client"

import { useState, useRef, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext.jsx"
import { getUserById, updateUserProfile } from "../services/userService"
import { uploadImage } from "../services/imageUploadService"
import { User, Mail, Camera, AlertCircle, CheckCircle, MapPin } from "lucide-react"
import { Link } from "react-router-dom"

export default function Profile() {
  const { currentUser, updateUserProfile: updateAuthProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [userData, setUserData] = useState(null)
  const [displayName, setDisplayName] = useState("")
  const [photoFile, setPhotoFile] = useState(null)
  const [previewURL, setPreviewURL] = useState("")
  const [bio, setBio] = useState("")
  const [location, setLocation] = useState("")
  const fileInputRef = useRef()

  useEffect(() => {
    const loadUserData = async () => {
      if (currentUser) {
        try {
          console.log("Loading user data for profile page...")
          setLoading(true)
          const user = await getUserById(currentUser.uid)
          if (user) {
            console.log("User data loaded:", user)
            setUserData(user)
            setDisplayName(user.username || "")
            setBio(user.bio || "")
            setLocation(user.location || "")
            setPreviewURL(user.profilePic || "")
          } else {
            setError("Failed to load user data")
          }
          setLoading(false)
        } catch (error) {
          console.error("Error loading user data:", error)
          setError("Failed to load user data")
          setLoading(false)
        }
      }
    }

    loadUserData()
  }, [currentUser])

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit")
      return
    }

    // Check file type
    if (!file.type.match("image.*")) {
      setError("Only image files are allowed")
      return
    }

    setError("") // Clear any previous errors
    setPhotoFile(file)
    console.log("Photo file selected:", file.name)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewURL(reader.result)
      console.log("Preview URL created")
    }
    reader.onerror = () => {
      console.error("Error creating preview")
      setError("Failed to preview image")
    }
    reader.readAsDataURL(file)
  }

  async function handleSubmit(e) {
    e.preventDefault()

    try {
      setError("")
      setMessage("")
      setLoading(true)

      let profilePicURL = userData?.profilePic || ""

      // Upload new profile picture if changed
      if (photoFile) {
        try {
          // Use the third-party image upload service instead of Firebase Storage
          profilePicURL = await uploadImage(photoFile)
          console.log("New profile picture URL set:", profilePicURL)
        } catch (uploadError) {
          console.error("Error in profile photo upload:", uploadError)
          throw new Error("Failed to upload profile picture: " + uploadError.message)
        }
      }

      // Prepare update data
      const updateData = {
        username: displayName,
        bio,
        location,
        updatedAt: new Date(),
      }

      // Only include profilePic in update if we have a URL
      if (profilePicURL) {
        updateData.profilePic = profilePicURL
      }

      // Update Firestore user document first
      const firestoreUpdateSuccess = await updateUserProfile(currentUser.uid, updateData)
      if (!firestoreUpdateSuccess) {
        throw new Error("Failed to update profile in database")
      }
      console.log("Firestore profile updated successfully")

      // Update Firebase Auth profile
      if (currentUser) {
        try {
          await updateAuthProfile(displayName, profilePicURL)
          console.log("Auth profile updated successfully")
        } catch (authError) {
          console.error("Error updating auth profile:", authError)
          // Continue even if auth profile update fails
        }
      }

      // Update local state with new values
      setUserData((prev) => ({
        ...prev,
        username: displayName,
        profilePic: profilePicURL,
        bio,
        location,
        updatedAt: new Date(),
      }))

      setPhotoFile(null) // Reset the file after successful upload
      setMessage("Profile updated successfully!")

      // Force a reload of the current user in AuthContext
      if (currentUser && currentUser.reload) {
        await currentUser.reload()
      }

      setLoading(false)
    } catch (error) {
      console.error("Profile update error:", error)
      setError(error.message || "Failed to update profile")
      setLoading(false)
    }
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
            <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-100 mb-2 border-2 border-cohere-accent">
              {previewURL ? (
                <img
                  src={previewURL || "/placeholder.svg"}
                  alt="Profile"
                  className="h-full w-full object-cover transition-opacity duration-300"
                  onError={(e) => {
                    console.error("Image failed to load:", previewURL)
                    e.target.src = "/placeholder.svg"
                  }}
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <User size={48} className="text-gray-400" />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              className="absolute bottom-0 right-0 bg-cohere-accent hover:bg-opacity-90 text-white rounded-full p-2 shadow-md transition-transform duration-200 hover:scale-110"
              title="Change profile photo"
            >
              <Camera size={16} />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
          </div>
          <p className="text-sm text-gray-500 mt-1">Click the camera icon to change your photo</p>
          {photoFile && <div className="mt-2 text-xs text-cohere-accent">New photo selected: {photoFile.name}</div>}
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
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cohere-accent"
                placeholder="Enter your name"
              />
            </div>
          </div>

          <div>
            <label htmlFor="bio" className="block text-gray-700 mb-1">
              Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cohere-accent"
              placeholder="Tell us about yourself"
              rows={3}
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-gray-700 mb-1">
              Location
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cohere-accent"
                placeholder="Your location"
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
            className="w-full bg-cohere-accent hover:opacity-90 text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-cohere-accent focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Updating Profile...
              </div>
            ) : (
              "Update Profile"
            )}
          </button>
        </form>
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Your Network</h3>

          <div className="flex justify-between">
            <Link
              to={`/profile/${currentUser?.uid}/followers`}
              className="flex-1 bg-gray-50 hover:bg-gray-100 p-4 rounded-lg text-center mr-2"
            >
              <p className="text-xl font-bold">{userData?.followersCount || 0}</p>
              <p className="text-gray-600">Followers</p>
            </Link>

            <Link
              to={`/profile/${currentUser?.uid}/following`}
              className="flex-1 bg-gray-50 hover:bg-gray-100 p-4 rounded-lg text-center ml-2"
            >
              <p className="text-xl font-bold">{userData?.followingCount || 0}</p>
              <p className="text-gray-600">Following</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
