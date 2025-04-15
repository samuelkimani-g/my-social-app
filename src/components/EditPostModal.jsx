"use client"

import { useState, useRef } from "react"
import { X } from "lucide-react"
import { editPost, uploadImageExternal } from "../services/postService"

export default function EditPostModal({ post, onClose, onUpdate }) {
  const [editedContent, setEditedContent] = useState(post?.content || "")
  const [editImage, setEditImage] = useState(null)
  const [editImagePreview, setEditImagePreview] = useState(post?.imageUrl || null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error, setError] = useState("")
  const fileInputRef = useRef(null)

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

  // Handle saving edits
  const handleSave = async () => {
    if (!post) return

    try {
      setError("")
      let imageUrl = post.imageUrl

      // If there's a new image to upload
      if (editImage) {
        setUploadingImage(true)

        try {
          // Use external image upload service (IMGBB)
          imageUrl = await uploadImageExternal(editImage)
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
      const success = await editPost(post.id, {
        content: editedContent.trim(),
        imageUrl,
      })

      if (success) {
        // Update local state via callback
        onUpdate({
          ...post,
          content: editedContent.trim(),
          imageUrl,
          isEdited: true,
          editTimestamp: new Date(), // This is just for UI, the server timestamp is set in Firestore
        })
        onClose()
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Edit Post</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-3 mb-4 min-h-[150px] focus:outline-none focus:ring-2 focus:ring-cohere-accent"
            placeholder="What's on your mind?"
          ></textarea>

          {/* Image preview and controls during edit */}
          {editImagePreview && (
            <div className="relative mb-4">
              <img
                src={editImagePreview || "/placeholder.svg"}
                alt="Post"
                className="rounded max-h-80 w-auto mx-auto"
              />
              <button
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 bg-gray-800 bg-opacity-60 text-white p-1 rounded-full hover:bg-opacity-80"
                aria-label="Remove image"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Error message */}
          {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

          <div className="flex gap-3 justify-between">
            <button
              onClick={() => fileInputRef.current?.click()}
              type="button"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
              disabled={uploadingImage}
            >
              {editImagePreview ? "Change Image" : "Add Image"}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                disabled={uploadingImage}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
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
                  "Save Changes"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
