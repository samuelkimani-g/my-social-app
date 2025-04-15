"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { getPostComments, createComment, deleteComment, editComment } from "../services/commentService"
import { getUserById } from "../services/userService"
import { User, Send, Trash2, Edit2, X, Check } from "lucide-react"

export default function Comments({ postId, onCommentCountChange }) {
  const { currentUser } = useAuth()
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [editingComment, setEditingComment] = useState(null)
  const [editText, setEditText] = useState("")
  const [commentAuthors, setCommentAuthors] = useState({})

  useEffect(() => {
    if (postId) {
      loadComments()
    }
  }, [postId])

  const loadComments = async () => {
    try {
      setLoading(true)
      setError("")

      const commentsData = await getPostComments(postId)
      setComments(commentsData)

      // Load author data for each comment
      const authorIds = [...new Set(commentsData.map((comment) => comment.userId))]
      const authorsData = {}

      await Promise.all(
        authorIds.map(async (authorId) => {
          const userData = await getUserById(authorId)
          if (userData) {
            authorsData[authorId] = {
              username: userData.username || "Unknown User",
              profilePic: userData.profilePic || null,
            }
          }
        }),
      )

      setCommentAuthors(authorsData)
      setLoading(false)
    } catch (error) {
      console.error("Error loading comments:", error)
      setError("Failed to load comments")
      setLoading(false)
    }
  }

  const handleSubmitComment = async (e) => {
    e.preventDefault()

    if (!commentText.trim()) return
    if (!currentUser) {
      setError("You must be logged in to comment")
      return
    }

    try {
      setLoading(true)
      setError("")

      const result = await createComment({
        postId,
        userId: currentUser.uid,
        content: commentText,
      })

      if (result.success) {
        // Add the new comment to the list with author info
        const newComment = {
          id: result.commentId,
          postId,
          userId: currentUser.uid,
          content: commentText,
          createdAt: { seconds: Date.now() / 1000 },
        }

        // Make sure we have the current user's author info
        if (!commentAuthors[currentUser.uid]) {
          const userData = await getUserById(currentUser.uid)
          if (userData) {
            setCommentAuthors((prev) => ({
              ...prev,
              [currentUser.uid]: {
                username: userData.username || "You",
                profilePic: userData.profilePic || null,
              },
            }))
          }
        }

        setComments([...comments, newComment])
        setCommentText("")

        // Update comment count in parent component
        if (onCommentCountChange) {
          onCommentCountChange(comments.length + 1)
        }
      } else {
        setError(result.message || "Failed to post comment")
      }

      setLoading(false)
    } catch (error) {
      console.error("Error posting comment:", error)
      setError("Failed to post comment")
      setLoading(false)
    }
  }

  const handleDeleteComment = async (commentId) => {
    if (!currentUser) return

    try {
      setLoading(true)
      setError("")

      const success = await deleteComment(commentId)

      if (success) {
        const updatedComments = comments.filter((comment) => comment.id !== commentId)
        setComments(updatedComments)

        // Update comment count in parent component
        if (onCommentCountChange) {
          onCommentCountChange(updatedComments.length)
        }
      } else {
        setError("Failed to delete comment")
      }

      setLoading(false)
    } catch (error) {
      console.error("Error deleting comment:", error)
      setError("Failed to delete comment")
      setLoading(false)
    }
  }

  const handleEditComment = async (commentId) => {
    if (!editText.trim()) return
    if (!currentUser) return

    try {
      setLoading(true)
      setError("")

      const success = await editComment(commentId, editText)

      if (success) {
        const updatedComments = comments.map((comment) =>
          comment.id === commentId
            ? { ...comment, content: editText, editedAt: { seconds: Date.now() / 1000 } }
            : comment,
        )
        setComments(updatedComments)
        setEditingComment(null)
        setEditText("")
      } else {
        setError("Failed to edit comment")
      }

      setLoading(false)
    } catch (error) {
      console.error("Error editing comment:", error)
      setError("Failed to edit comment")
      setLoading(false)
    }
  }

  const startEditing = (comment) => {
    setEditingComment(comment.id)
    setEditText(comment.content)
  }

  const cancelEditing = () => {
    setEditingComment(null)
    setEditText("")
  }

  const formatCommentTime = (timestamp) => {
    if (!timestamp) return "Just now"

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000)
    const now = new Date()
    const diffMs = now - date
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)

    if (diffSec < 60) return "Just now"
    if (diffMin < 60) return `${diffMin}m ago`
    if (diffHour < 24) return `${diffHour}h ago`
    if (diffDay < 7) return `${diffDay}d ago`

    return date.toLocaleDateString()
  }

  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Comments</h3>

      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

      {/* Comment form */}
      {currentUser && (
        <form onSubmit={handleSubmitComment} className="mb-4 flex">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-cohere-accent"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !commentText.trim()}
            className="bg-cohere-accent text-white px-3 py-2 rounded-r-md hover:opacity-90 disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </form>
      )}

      {/* Comments list */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-2">No comments yet</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex space-x-2 text-sm">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                  {commentAuthors[comment.userId]?.profilePic ? (
                    <img
                      src={commentAuthors[comment.userId].profilePic || "/placeholder.svg"}
                      alt={commentAuthors[comment.userId]?.username || "User"}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </div>
              <div className="flex-1">
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-medium text-gray-800">
                        {commentAuthors[comment.userId]?.username || "Unknown User"}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">{formatCommentTime(comment.createdAt)}</span>
                      {comment.editedAt && <span className="text-xs text-gray-500 ml-1">(edited)</span>}
                    </div>
                    {currentUser && (currentUser.uid === comment.userId || currentUser.isAdmin) && (
                      <div className="flex space-x-1">
                        {editingComment !== comment.id && (
                          <>
                            <button
                              onClick={() => startEditing(comment)}
                              className="text-gray-400 hover:text-gray-600"
                              title="Edit"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-gray-400 hover:text-red-500"
                              title="Delete"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  {editingComment === comment.id ? (
                    <div className="mt-1">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-cohere-accent"
                        rows="2"
                      />
                      <div className="flex justify-end space-x-2 mt-1">
                        <button
                          onClick={cancelEditing}
                          className="text-xs flex items-center text-gray-500 hover:text-gray-700"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Cancel
                        </button>
                        <button
                          onClick={() => handleEditComment(comment.id)}
                          className="text-xs flex items-center text-cohere-accent hover:text-cohere-primary"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-800 mt-1">{comment.content}</p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
