"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { getUserPosts, deletePost } from "../services/postService"
import { Link } from "react-router-dom"
import { User, RefreshCw, ArrowLeft, Edit2, Trash2 } from "lucide-react"
import PostInteractions from "./PostInteractions"
import EditPostModal from "./EditPostModal"

export default function UserPosts() {
  const { currentUser } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [lastVisible, setLastVisible] = useState(null)
  const [editingPost, setEditingPost] = useState(null)

  useEffect(() => {
    if (currentUser) {
      loadUserPosts()
    }
  }, [currentUser])

  const loadUserPosts = async () => {
    try {
      setLoading(true)
      setError("")

      // Get posts for the current user
      const result = await getUserPosts(currentUser.uid)

      if (result) {
        setPosts(result.posts || [])
        setLastVisible(result.lastVisible)
      } else {
        setPosts([])
      }

      setLoading(false)
    } catch (error) {
      console.error("Error loading user posts:", error)
      setError("Failed to load your posts. Please try again.")
      setLoading(false)
    }
  }

  const loadMorePosts = async () => {
    if (!lastVisible) return

    try {
      setLoading(true)

      const result = await getUserPosts(currentUser.uid, lastVisible)

      if (result) {
        setPosts([...posts, ...result.posts])
        setLastVisible(result.lastVisible)
      }

      setLoading(false)
    } catch (error) {
      console.error("Error loading more posts:", error)
      setError("Failed to load more posts")
      setLoading(false)
    }
  }

  const handleDeletePost = async (postId) => {
    if (!currentUser) return

    try {
      setLoading(true)

      const success = await deletePost(postId)

      if (success) {
        // Remove the deleted post from the list
        setPosts(posts.filter((post) => post.id !== postId))
      } else {
        setError("Failed to delete post")
      }

      setLoading(false)
    } catch (error) {
      console.error("Error deleting post:", error)
      setError("Failed to delete post: " + error.message)
      setLoading(false)
    }
  }

  const handleEditPost = (post) => {
    setEditingPost(post)
  }

  const handleUpdatePost = (updatedPost) => {
    // Update the post in the list
    setPosts(posts.map((post) => (post.id === updatedPost.id ? { ...post, ...updatedPost } : post)))
    setEditingPost(null)
  }

  const closeEditModal = () => {
    setEditingPost(null)
  }

  if (loading && posts.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cohere-accent mx-auto"></div>
          <p className="mt-4 text-gray-500 font-medium">Loading your posts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center mb-6">
        <Link to="/dashboard" className="mr-4 p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold">Your Posts</h1>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>
      )}

      {posts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto flex items-center justify-center">
            <User className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-700">No posts yet</h3>
          <p className="text-gray-500 mt-2">You haven't created any posts yet.</p>
          <Link
            to="/dashboard"
            className="mt-4 inline-block bg-cohere-accent hover:opacity-90 text-white py-2 px-4 rounded-md"
          >
            Create a Post
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                      {currentUser?.photoURL ? (
                        <img
                          src={currentUser.photoURL || "/placeholder.svg"}
                          alt={currentUser.displayName || "User"}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{currentUser?.displayName || "You"}</p>
                      <p className="text-xs text-gray-500">
                        {post.timestamp ? new Date(post.timestamp.seconds * 1000).toLocaleString() : "Just now"}
                        {post.isEdited && <span className="ml-2 italic">(edited)</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button onClick={() => handleEditPost(post)} className="p-1 text-blue-500 hover:bg-blue-50 rounded">
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <p className="text-gray-800 mb-3">{post.content}</p>

                {post.imageUrl && (
                  <div className="mb-3">
                    <img
                      src={post.imageUrl || "/placeholder.svg"}
                      alt="Post"
                      className="rounded max-h-96 w-auto mx-auto"
                    />
                  </div>
                )}

                <Link to={`/post/${post.id}`} className="text-sm text-cohere-accent hover:underline">
                  View Post
                </Link>

                <PostInteractions post={post} onUpdate={loadUserPosts} />
              </div>
            </div>
          ))}

          {lastVisible && (
            <div className="text-center">
              <button
                onClick={loadMorePosts}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cohere-accent flex items-center mx-auto"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cohere-accent mr-2"></div>
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Load More
              </button>
            </div>
          )}
        </div>
      )}

      {/* Edit Post Modal */}
      {editingPost && <EditPostModal post={editingPost} onClose={closeEditModal} onUpdate={handleUpdatePost} />}
    </div>
  )
}
