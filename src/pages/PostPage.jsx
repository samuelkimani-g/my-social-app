"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { getPostById, editPost, uploadImageExternal } from "../services/postService"
import { getUserById } from "../services/userService"
import { User, ArrowLeft, Edit2, X } from "lucide-react"
import PostInteractions from "../components/PostInteractions"

export default function PostPage() {
  const { postId } = useParams()
  const { currentUser } = useAuth()
  const [post, setPost] = useState(null)
  const [author, setAuthor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  // Edit state
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState("")
  const [editImage, setEditImage] = useState(null)
  const [editImagePreview, setEditImagePreview] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    const loadPost = async () => {
      if (!postId) return

      try {
        setLoading(true)
        setError("")

        const postData = await getPostById(postId)
        if (!postData) {
          setError("Post not found")
          setLoading(false)
          return
        }

        setPost(postData)
        setEditedContent(postData.content || "")

        // Get author data
        if (postData.authorId) {
          const authorData = await getUserById(postData.authorId)
          setAuthor(authorData)
        }

        setLoading(false)
      } catch (err) {
        console.error("Error loading post:", err)
        setError("Failed to load post")
        setLoading(false)
      }
    }

    loadPost()
  }, [postId])

  // Handle image file change
  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB")
      return
    }

    // Check file type
    if (!file.type.match("image.*")) {
      setError("Please select an image file")
      return
    }

    setEditImage(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setEditImagePreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  // Handle starting edit mode
  const handleStartEdit = () => {
    setIsEditing(true)
    setEditedContent(post.content || "")
    setEditImagePreview(post.imageUrl || null)
  }

  // Handle canceling edit mode
  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditImage(null)
    setEditImagePreview(post.imageUrl || null)
    setError("")
  }

  // Handle saving edits
  const handleSaveEdit = async () => {
    if (!post || !currentUser) return
    if (currentUser.uid !== post.authorId) return

    try {
      setError("")
      let imageUrl = post.imageUrl

      // If there's a new image to upload
      if (editImage) {
        setUploadingImage(true)

        try {
          // Use external image upload service (IMGBB)
          // Note: You would need to get your API key from environment variables or configuration
          const apiKey = process.env.REACT_APP_IMGBB_API_KEY || "YOUR_IMGBB_API_KEY"
          imageUrl = await uploadImageExternal(editImage, apiKey)
        } catch (err) {
          console.error("Error uploading image:", err)
          setError("Failed to upload image. Please try again.")
          setUploadingImage(false)
          return
        }

        setUploadingImage(false)
      }

      // If user removed the image
      if (editImagePreview === null && post.imageUrl) {
        imageUrl = null
      }

      // Update post in Firestore
      const success = await editPost(postId, {
        content: editedContent.trim(),
        imageUrl,
      })

      if (success) {
        // Update local state to reflect changes
        setPost({
          ...post,
          content: editedContent.trim(),
          imageUrl,
          isEdited: true,
          editTimestamp: new Date(), // This is just for UI, the server timestamp is set in Firestore
        })
        setIsEditing(false)
        setEditImage(null)
      } else {
        setError("Failed to update post. Please try again.")
      }
    } catch (err) {
      console.error("Error saving edit:", err)
      setError("An error occurred while saving. Please try again.")
    }
  }

  // Handle removing image during edit
  const handleRemoveImage = () => {
    setEditImage(null)
    setEditImagePreview(null)
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8 text-center my-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cohere-accent mx-auto"></div>
        <p className="mt-4 text-gray-700 font-medium">Loading post...</p>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8 text-center my-6">
        <div className="text-red-500 mb-4">{error || "Post not found"}</div>
        <Link to="/dashboard" className="text-cohere-accent hover:underline">
          Return to Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto my-6">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center">
          <button onClick={() => navigate(-1)} className="mr-2 p-1 rounded-full hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h2 className="text-xl font-semibold">Post</h2>
        </div>

        <div className="p-4">
          {/* Post author info */}
          <div className="flex items-center mb-4">
            <Link to={`/profile/${post.authorId}`} className="flex items-center">
              <div className="h-12 w-12 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden mr-3">
                {author?.profilePic ? (
                  <img
                    src={author.profilePic || "/placeholder.svg"}
                    alt={author.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-400" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{author?.username || "Unknown User"}</h3>
                <p className="text-sm text-gray-500">
                  {post.timestamp ? new Date(post.timestamp.seconds * 1000).toLocaleString() : "Recently"}
                  {post.isEdited && <span className="ml-2 text-xs italic">(edited)</span>}
                </p>
              </div>
            </Link>

            {/* Edit button - only visible to post author */}
            {currentUser && currentUser.uid === post.authorId && !isEditing && (
              <button
                onClick={handleStartEdit}
                className="ml-auto p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                aria-label="Edit post"
              >
                <Edit2 className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Post content - edit mode or display mode */}
          {isEditing ? (
            <div className="mb-4">
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 mb-3 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-cohere-accent"
                placeholder="What's on your mind?"
              ></textarea>

              {/* Image preview and controls during edit */}
              {editImagePreview && (
                <div className="relative mb-4">
                  <img src={editImagePreview || "/placeholder.svg"} alt="Post" className="rounded max-h-80 w-auto" />
                  <button
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-gray-800 bg-opacity-60 text-white p-1 rounded-full hover:bg-opacity-80"
                    aria-label="Remove image"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}

              {/* Image upload button */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  disabled={uploadingImage}
                >
                  {editImagePreview ? "Change Image" : "Add Image"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />

                {/* Error message */}
                {error && <p className="text-red-500 text-sm mt-1 w-full">{error}</p>}

                {/* Edit action buttons */}
                <div className="flex gap-2 ml-auto">
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    disabled={uploadingImage}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-4 py-2 bg-cohere-accent text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    disabled={uploadingImage || editedContent.trim() === ""}
                  >
                    {uploadingImage ? (
                      <span className="flex items-center">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Saving...
                      </span>
                    ) : (
                      "Save"
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Regular post content display */}
              <p className="text-gray-800 mb-4 text-lg whitespace-pre-wrap">{post.content}</p>

              {post.imageUrl && (
                <div className="mb-4">
                  <img
                    src={post.imageUrl || "/placeholder.svg"}
                    alt="Post"
                    className="rounded max-h-96 w-auto mx-auto"
                  />
                </div>
              )}
            </>
          )}

          {/* Post interactions (like/comment) - only shown when not in edit mode */}
          {!isEditing && (
            <PostInteractions
              post={{
                ...post,
                authorName: author?.username,
                authorPic: author?.profilePic,
              }}
              onUpdate={(updatedPost) => setPost({ ...post, ...updatedPost })}
            />
          )}
        </div>
      </div>
    </div>
  )
}
