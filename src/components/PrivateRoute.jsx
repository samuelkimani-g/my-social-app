"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { Edit2 } from "lucide-react"
import EditPostModal from "./EditPostModal"

export default function PostInteractions({ post, onUpdate }) {
  const { currentUser } = useAuth()
  const [isCurrentUserAuthor, setIsCurrentUserAuthor] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    if (currentUser && post && post.authorId === currentUser.uid) {
      setIsCurrentUserAuthor(true)
    } else {
      setIsCurrentUserAuthor(false)
    }
  }, [currentUser, post])

  const handleEdit = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setShowEditModal(true)
  }

  const handlePostUpdate = (updatedPost) => {
    if (onUpdate) {
      onUpdate(updatedPost)
    }
    setShowEditModal(false)
  }

  return (
    <div className="flex items-center justify-between border-t border-gray-200 pt-3 mt-3">
      <div className="flex space-x-4">
        {/* Like button */}
        <button className="flex items-center text-gray-500 hover:text-blue-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
            />
          </svg>
          <span>Like</span>
        </button>

        {/* Comment button */}
        <button className="flex items-center text-gray-500 hover:text-blue-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
            />
          </svg>
          <span>Comment</span>
        </button>
      </div>

      {/* Show edit button only if current user is the author */}
      {isCurrentUserAuthor && (
        <button onClick={handleEdit} className="flex items-center text-gray-500 hover:text-blue-600">
          <Edit2 className="h-5 w-5 mr-1" />
          <span>Edit</span>
        </button>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <EditPostModal post={post} onClose={() => setShowEditModal(false)} onUpdate={handlePostUpdate} />
      )}
    </div>
  )
}
