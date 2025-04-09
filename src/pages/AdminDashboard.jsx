"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext.jsx"
import { getAllUsers, toggleUserBan } from "../services/userService"
import { getAllPosts, deletePost } from "../services/postService"
import { ShieldCheck, Users, FileText, Ban, Trash2, CheckCircle, AlertTriangle, Search } from "lucide-react"
import { logAdminAction } from "../services/logService"

export default function AdminDashboard() {
  const { currentUser, isAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState("users")
  const [users, setUsers] = useState([])
  const [posts, setPosts] = useState([])
  const [lastVisibleUser, setLastVisibleUser] = useState(null)
  const [lastVisiblePost, setLastVisiblePost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    // Check if user is admin before loading data
    if (currentUser && isAdmin) {
      loadInitialData()
    } else if (currentUser && !isAdmin) {
      setError("You do not have permission to access this page")
      setLoading(false)
    }
  }, [currentUser, isAdmin])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      console.log("Loading admin dashboard data...")

      // Load users with error handling
      try {
        const { users: usersList, lastVisible: lastUser } = await getAllUsers()
        setUsers(usersList || [])
        setLastVisibleUser(lastUser)
      } catch (userError) {
        console.error("Error loading users:", userError)
        setError("Failed to load users data")
      }

      // Load posts with error handling
      try {
        const { posts: postsList, lastVisible: lastPost } = await getAllPosts()
        setPosts(postsList || [])
        setLastVisiblePost(lastPost)
      } catch (postError) {
        console.error("Error loading posts:", postError)
        setError("Failed to load posts data")
      }

      setLoading(false)
    } catch (error) {
      console.error("Error in loadInitialData:", error)
      setError("Failed to load dashboard data")
      setLoading(false)
    }
  }

  const loadMoreUsers = async () => {
    if (!lastVisibleUser) return

    try {
      setLoading(true)
      const { users: newUsers, lastVisible } = await getAllUsers(lastVisibleUser)
      setUsers([...users, ...(newUsers || [])])
      setLastVisibleUser(lastVisible)
      setLoading(false)
    } catch (error) {
      console.error("Error loading more users:", error)
      setError("Failed to load more users")
      setLoading(false)
    }
  }

  const loadMorePosts = async () => {
    if (!lastVisiblePost) return

    try {
      setLoading(true)
      const { posts: newPosts, lastVisible } = await getAllPosts(lastVisiblePost)
      setPosts([...posts, ...(newPosts || [])])
      setLastVisiblePost(lastVisible)
      setLoading(false)
    } catch (error) {
      console.error("Error loading more posts:", error)
      setError("Failed to load more posts")
      setLoading(false)
    }
  }

  const handleBanUser = async (userId, currentStatus) => {
    try {
      const success = await toggleUserBan(userId, !currentStatus)

      if (success) {
        // Log the admin action
        await logAdminAction(!currentStatus ? "user_banned" : "user_unbanned", currentUser.uid, {
          targetUserId: userId,
        })

        setUsers(users.map((user) => (user.id === userId ? { ...user, isBanned: !currentStatus } : user)))
      } else {
        setError("Failed to update user status")
      }
    } catch (error) {
      console.error("Error toggling user ban:", error)
      setError("Failed to update user status")
    }
  }

  const handleDeletePost = async (postId) => {
    try {
      const success = await deletePost(postId)

      if (success) {
        // Log the admin action
        await logAdminAction("post_deleted", currentUser.uid, { postId })

        setPosts(posts.filter((post) => post.id !== postId))
      } else {
        setError("Failed to delete post")
      }
    } catch (error) {
      console.error("Error deleting post:", error)
      setError("Failed to delete post")
    }
  }

  const filterUsers = () => {
    if (!searchTerm) return users

    return users.filter(
      (user) =>
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }

  const filterPosts = () => {
    if (!searchTerm) return posts

    return posts.filter((post) => post.content?.toLowerCase().includes(searchTerm.toLowerCase()))
  }

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mr-4" />
            <h2 className="text-2xl font-bold text-gray-800">Access Denied</h2>
          </div>
          <p className="text-center mt-4 text-gray-600">You do not have permission to access the admin dashboard.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
          <ShieldCheck className="mr-2 h-6 w-6 text-purple-600" />
          Admin Dashboard
        </h2>

        <div className="bg-cohere-primary p-4 rounded-lg mb-6 border border-cohere-accent">
          <p className="text-cohere-light flex items-center">
            <ShieldCheck className="mr-2 h-5 w-5 text-cohere-accent" />
            Welcome, Admin {currentUser?.displayName || currentUser?.email}!
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>
        )}

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder={`Search ${activeTab === "users" ? "users" : "posts"}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex -mb-px">
            <button
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === "users"
                  ? "border-cohere-accent text-cohere-accent"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("users")}
            >
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Users
              </div>
            </button>
            <button
              className={`ml-8 py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === "posts"
                  ? "border-cohere-accent text-cohere-accent"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("posts")}
            >
              <div className="flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Posts
              </div>
            </button>
          </nav>
        </div>

        {/* Users Tab */}
        {activeTab === "users" && (
          <div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      User
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Email
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Role
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading && users.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                        Loading users...
                      </td>
                    </tr>
                  ) : filterUsers().length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filterUsers().map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              {user.profilePic ? (
                                <img
                                  src={user.profilePic || "/placeholder.svg"}
                                  alt={user.username}
                                  className="h-10 w-10 rounded-full"
                                />
                              ) : (
                                <span className="text-gray-500">{user.username?.charAt(0).toUpperCase() || "U"}</span>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.username || "Unknown"}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{user.email || "No email"}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.role === "admin" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {user.role || "user"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.isBanned ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                            }`}
                          >
                            {user.isBanned ? "Banned" : "Active"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleBanUser(user.id, user.isBanned)}
                            className={`inline-flex items-center px-3 py-1 border border-transparent text-xs leading-4 font-medium rounded-md ${
                              user.isBanned
                                ? "text-green-700 bg-green-100 hover:bg-green-200"
                                : "text-red-700 bg-red-100 hover:bg-red-200"
                            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500`}
                            disabled={user.role === "admin"}
                          >
                            {user.isBanned ? (
                              <>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Unban
                              </>
                            ) : (
                              <>
                                <Ban className="h-4 w-4 mr-1" />
                                Ban
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {lastVisibleUser && (
              <div className="mt-4 text-center">
                <button
                  onClick={loadMoreUsers}
                  disabled={loading}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  {loading ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Posts Tab */}
        {activeTab === "posts" && (
          <div>
            <div className="space-y-4">
              {loading && posts.length === 0 ? (
                <div className="text-center py-4 text-gray-500">Loading posts...</div>
              ) : filterPosts().length === 0 ? (
                <div className="text-center py-4 text-gray-500">No posts found</div>
              ) : (
                filterPosts().map((post) => (
                  <div key={post.id} className="bg-white p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between">
                      <div className="text-sm text-gray-500">Author ID: {post.authorId || "Unknown"}</div>
                      <div className="text-sm text-gray-500">
                        {post.timestamp ? new Date(post.timestamp.seconds * 1000).toLocaleString() : "No timestamp"}
                      </div>
                    </div>
                    <div className="mt-2">{post.content || "No content"}</div>
                    {post.imageUrl && (
                      <div className="mt-2">
                        <img src={post.imageUrl || "/placeholder.svg"} alt="Post" className="max-h-64 rounded" />
                      </div>
                    )}
                    <div className="mt-2 flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        Likes: {post.likesCount || 0} | Comments: {post.commentsCount || 0}
                      </div>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {lastVisiblePost && (
              <div className="mt-4 text-center">
                <button
                  onClick={loadMorePosts}
                  disabled={loading}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  {loading ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
