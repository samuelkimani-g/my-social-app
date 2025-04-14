"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext.jsx"
import { getAllUsers, toggleUserBan, searchUsers } from "../services/userService"
import { getAllPostsForAdmin, permanentlyDeletePost, deletePost } from "../services/postService"
import { getAdminLogs, getSecurityLogs, logAdminAction } from "../services/logService"
import { useLocation, useNavigate } from "react-router-dom"
import AdminSidebar from "../components/AdminSidebar"
import {
  ShieldCheck,
  Users,
  FileText,
  Ban,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Search,
  LineChart,
  User,
  BarChart2,
  RefreshCw,
  Flag,
  ChevronRight,
} from "lucide-react"

export default function AdminDashboard() {
  const { currentUser, isAdmin } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("dashboard")
  const [users, setUsers] = useState([])
  const [posts, setPosts] = useState([])
  const [adminLogs, setAdminLogs] = useState([])
  const [securityLogs, setSecurityLogs] = useState([])
  const [lastVisibleUser, setLastVisibleUser] = useState(null)
  const [lastVisiblePost, setLastVisiblePost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [userFilter, setUserFilter] = useState("all") // all, banned, admins, highActivity
  const [postFilter, setPostFilter] = useState("all") // all, deleted, flagged
  const [analyticsData, setAnalyticsData] = useState({
    totalUsers: 0,
    totalPosts: 0,
    bannedUsers: 0,
    deletedPosts: 0,
    newUsersToday: 0,
    postsToday: 0,
  })

  // Parse tab from URL query params
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const tab = params.get("tab")
    if (tab) {
      setActiveTab(tab)
    } else {
      setActiveTab("dashboard")
    }
  }, [location.search])

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

        // Calculate analytics
        const analytics = { ...analyticsData }
        analytics.totalUsers = usersList.length
        analytics.bannedUsers = usersList.filter((user) => user.isBanned).length

        // Get today's users
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        analytics.newUsersToday = usersList.filter((user) => {
          if (!user.createdAt) return false
          const creationDate = user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt)
          return creationDate >= today
        }).length

        setAnalyticsData(analytics)
      } catch (userError) {
        console.error("Error loading users:", userError)
        setError("Failed to load users data")
      }

      // Load posts with error handling
      try {
        const { posts: postsList, lastVisible: lastPost } = await getAllPostsForAdmin()
        setPosts(postsList || [])
        setLastVisiblePost(lastPost)

        // Update analytics
        const postAnalytics = { ...analyticsData }
        postAnalytics.totalPosts = postsList.length
        postAnalytics.deletedPosts = postsList.filter((post) => post.isDeleted).length

        // Get today's posts
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        postAnalytics.postsToday = postsList.filter((post) => {
          if (!post.timestamp) return false
          const postDate = post.timestamp.toDate ? post.timestamp.toDate() : new Date(post.timestamp)
          return postDate >= today
        }).length

        setAnalyticsData(postAnalytics)
      } catch (postError) {
        console.error("Error loading posts:", postError)
        setError("Failed to load posts data")
      }

      // Load admin logs
      try {
        const logs = await getAdminLogs()
        setAdminLogs(logs || [])
      } catch (logError) {
        console.error("Error loading admin logs:", logError)
      }

      // Load security logs
      try {
        const logs = await getSecurityLogs()
        setSecurityLogs(logs || [])
      } catch (logError) {
        console.error("Error loading security logs:", logError)
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
      const { posts: newPosts, lastVisible } = await getAllPostsForAdmin(lastVisiblePost)
      setPosts([...posts, ...(newPosts || [])])
      setLastVisiblePost(lastVisible)
      setLoading(false)
    } catch (error) {
      console.error("Error loading more posts:", error)
      setError("Failed to load more posts")
      setLoading(false)
    }
  }

  // In the handleBanUser function, add logging and better error handling
  const handleBanUser = async (userId, currentStatus) => {
    try {
      setLoading(true)
      console.log(`Attempting to ${currentStatus ? "unban" : "ban"} user: ${userId}`)

      const success = await toggleUserBan(userId, !currentStatus)

      if (success) {
        // Log the admin action
        await logAdminAction(!currentStatus ? "user_banned" : "user_unbanned", currentUser.uid, {
          targetUserId: userId,
        })

        setUsers(users.map((user) => (user.id === userId ? { ...user, isBanned: !currentStatus } : user)))

        // Add to local logs for immediate display
        const targetUser = users.find((user) => user.id === userId)
        setAdminLogs([
          {
            id: Date.now().toString(),
            action: !currentStatus ? "user_banned" : "user_unbanned",
            adminId: currentUser.uid,
            details: {
              targetUserId: userId,
              targetUserEmail: targetUser?.email,
              userName: targetUser?.username,
            },
            timestamp: { seconds: Date.now() / 1000 },
          },
          ...adminLogs,
        ])

        console.log(`Successfully ${currentStatus ? "unbanned" : "banned"} user: ${userId}`)
      } else {
        setError(`Failed to ${currentStatus ? "unban" : "ban"} user. Please try again.`)
        console.error(`Failed to toggle ban status for user: ${userId}`)
      }
      setLoading(false)
    } catch (error) {
      console.error("Error toggling user ban:", error)
      setError(`Error: ${error.message || "Failed to update user status"}`)
      setLoading(false)
    }
  }

  // Improve the handleDeletePost function with better error handling
  const handleDeletePost = async (postId, permanent = false) => {
    try {
      setLoading(true)
      console.log(`Attempting to ${permanent ? "permanently delete" : "soft-delete"} post: ${postId}`)

      const success = permanent ? await permanentlyDeletePost(postId) : await deletePost(postId)

      if (success) {
        // Log the admin action
        await logAdminAction(permanent ? "post_permanently_deleted" : "post_deleted", currentUser.uid, { postId })

        if (permanent) {
          setPosts(posts.filter((post) => post.id !== postId))
        } else {
          setPosts(posts.map((post) => (post.id === postId ? { ...post, isDeleted: true } : post)))
        }

        // Add to local logs for immediate display
        setAdminLogs([
          {
            id: Date.now().toString(),
            action: permanent ? "post_permanently_deleted" : "post_deleted",
            adminId: currentUser.uid,
            details: { postId, permanent },
            timestamp: { seconds: Date.now() / 1000 },
          },
          ...adminLogs,
        ])

        console.log(`Successfully ${permanent ? "permanently deleted" : "soft-deleted"} post: ${postId}`)
      } else {
        setError(`Failed to delete post. Please try again.`)
        console.error(`Failed to delete post: ${postId}`)
      }
      setLoading(false)
    } catch (error) {
      console.error("Error deleting post:", error)
      setError(`Error: ${error.message || "Failed to delete post"}`)
      setLoading(false)
    }
  }

  const filterUsers = () => {
    // First apply search term filter
    const filteredUsers = users.filter(
      (user) =>
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    // Then apply type filter
    switch (userFilter) {
      case "banned":
        return filteredUsers.filter((user) => user.isBanned)
      case "admins":
        return filteredUsers.filter((user) => user.role === "admin")
      case "highActivity":
        return filteredUsers.sort((a, b) => (b.postsCount || 0) - (a.postsCount || 0))
      default:
        return filteredUsers
    }
  }

  const filterPosts = () => {
    // First apply search term filter
    const filteredPosts = posts.filter((post) => post.content?.toLowerCase().includes(searchTerm.toLowerCase()))

    // Then apply type filter
    switch (postFilter) {
      case "deleted":
        return filteredPosts.filter((post) => post.isDeleted)
      case "flagged":
        return filteredPosts.filter((post) => post.flagged)
      default:
        return filteredPosts
    }
  }

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A"

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000)
      return date.toLocaleString()
    } catch (error) {
      return "Invalid date"
    }
  }

  const handleSearchUsers = async () => {
    if (!searchTerm.trim()) return

    try {
      setLoading(true)
      const searchResults = await searchUsers(searchTerm)
      setUsers(searchResults)
      setLastVisibleUser(null) // Can't load more after search
      setLoading(false)
    } catch (error) {
      console.error("Error searching users:", error)
      setError("Failed to search users")
      setLoading(false)
    }
  }

  const resetSearch = () => {
    setSearchTerm("")
    loadInitialData()
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    navigate(`/admin-dashboard${tab !== "dashboard" ? `?tab=${tab}` : ""}`)
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
    <div className="min-h-screen bg-gray-100">
      <AdminSidebar />

      <div className="lg:ml-64 transition-all duration-300 p-6">
        {/* Admin Header */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
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
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                {error}
              </div>
            )}

            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Total Users</p>
                    <p className="text-2xl font-bold">{analyticsData.totalUsers}</p>
                  </div>
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-xs text-green-500">+{analyticsData.newUsersToday} today</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Total Posts</p>
                    <p className="text-2xl font-bold">{analyticsData.totalPosts}</p>
                  </div>
                  <div className="bg-indigo-100 p-2 rounded-full">
                    <FileText className="h-5 w-5 text-indigo-600" />
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-xs text-green-500">+{analyticsData.postsToday} today</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Enforcements</p>
                    <p className="text-2xl font-bold">{analyticsData.bannedUsers + analyticsData.deletedPosts}</p>
                  </div>
                  <div className="bg-red-100 p-2 rounded-full">
                    <Ban className="h-5 w-5 text-red-600" />
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-xs text-gray-500">
                    {analyticsData.bannedUsers} banned users | {analyticsData.deletedPosts} removed posts
                  </p>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6 flex flex-col sm:flex-row gap-2">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder={`Search ${activeTab === "users" ? "users" : activeTab === "posts" ? "posts" : "logs"}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchUsers()}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSearchUsers}
                  className="bg-cohere-accent text-white py-2 px-4 rounded-md hover:bg-opacity-90"
                >
                  Search
                </button>
                <button
                  onClick={resetSearch}
                  className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Users Tab */}
          {activeTab === "users" && (
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-gray-800">User Management</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Filter:</span>
                  <select
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                    className="text-sm border border-gray-300 rounded-md p-1"
                  >
                    <option value="all">All Users</option>
                    <option value="banned">Banned Users</option>
                    <option value="admins">Admin Users</option>
                    <option value="highActivity">High Activity</option>
                  </select>
                </div>
              </div>
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
                        Activity
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
                        <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                          Loading users...
                        </td>
                      </tr>
                    ) : filterUsers().length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex flex-col">
                              <span>Posts: {user.postsCount || 0}</span>
                              <span>Followers: {user.followersCount || 0}</span>
                            </div>
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

              {lastVisibleUser && filterUsers().length >= 10 && (
                <div className="p-4 border-t border-gray-200 text-center">
                  <button
                    onClick={loadMoreUsers}
                    disabled={loading}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 inline-flex items-center"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-purple-500 rounded-full"></div>
                        Loading...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Load More
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Posts Tab */}
          {activeTab === "posts" && (
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-gray-800">Post Management</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Filter:</span>
                  <select
                    value={postFilter}
                    onChange={(e) => setPostFilter(e.target.value)}
                    className="text-sm border border-gray-300 rounded-md p-1"
                  >
                    <option value="all">All Posts</option>
                    <option value="deleted">Deleted Posts</option>
                    <option value="flagged">Flagged Posts</option>
                  </select>
                </div>
              </div>
              <div className="space-y-4">
                {loading && posts.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">Loading posts...</div>
                ) : filterPosts().length === 0 ? (
                  <div className="text-center py-4 text-gray-500">No posts found</div>
                ) : (
                  filterPosts().map((post) => (
                    <div
                      key={post.id}
                      className={`bg-white p-4 border rounded-lg ${
                        post.isDeleted
                          ? "border-red-200 bg-red-50"
                          : post.flagged
                            ? "border-yellow-200 bg-yellow-50"
                            : "border-gray-200"
                      }`}
                    >
                      <div className="flex justify-between">
                        <div className="text-sm text-gray-500 flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          Author ID: {post.authorId || "Unknown"}
                          {post.isDeleted && (
                            <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">
                              Deleted
                            </span>
                          )}
                          {post.flagged && (
                            <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                              Flagged
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {post.timestamp ? formatTimestamp(post.timestamp) : "No timestamp"}
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
                        <div className="flex space-x-2">
                          {!post.isDeleted ? (
                            <button
                              onClick={() => handleDeletePost(post.id, false)}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDeletePost(post.id, true)}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remove Permanently
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {lastVisiblePost && filterPosts().length >= 10 && (
                <div className="p-4 border-t border-gray-200 text-center">
                  <button
                    onClick={loadMorePosts}
                    disabled={loading}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 inline-flex items-center"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-purple-500 rounded-full"></div>
                        Loading...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Load More
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Logs Tab */}
          {activeTab === "logs" && (
            <div className="p-4">
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-gray-800">Admin Action Logs</h3>
                  <span className="text-sm text-gray-500">{adminLogs.length} entries</span>
                </div>
                <div className="overflow-x-auto bg-gray-50 rounded-lg border border-gray-200">
                  {adminLogs.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No admin logs found</div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Time
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Admin
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Action
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Details
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {adminLogs.map((log) => (
                          <tr key={log.id}>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                              {formatTimestamp(log.timestamp)}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{log.adminId}</td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  log.action.includes("ban")
                                    ? "bg-red-100 text-red-800"
                                    : log.action.includes("delete")
                                      ? "bg-orange-100 text-orange-800"
                                      : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {log.action}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              {log.details ? JSON.stringify(log.details) : "No details"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-gray-800">Security Logs</h3>
                  <span className="text-sm text-gray-500">{securityLogs.length} entries</span>
                </div>
                <div className="overflow-x-auto bg-gray-50 rounded-lg border border-gray-200">
                  {securityLogs.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No security logs found</div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Time
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Event
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Details
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {securityLogs.map((log) => (
                          <tr key={log.id}>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                              {formatTimestamp(log.timestamp)}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                {log.event}
                              </span>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                              {log.userId || "Anonymous"}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              {log.details ? JSON.stringify(log.details) : "No details"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === "analytics" && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* User Growth Chart (Placeholder) */}
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <h4 className="text-sm font-semibold mb-4">User Growth</h4>
                  <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                    <LineChart className="h-12 w-12 text-gray-400" />
                    <span className="ml-2 text-gray-500">User growth visualization would appear here</span>
                  </div>
                </div>

                {/* Content Activity Chart (Placeholder) */}
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <h4 className="text-sm font-semibold mb-4">Content Activity</h4>
                  <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                    <BarChart2 className="h-12 w-12 text-gray-400" />
                    <span className="ml-2 text-gray-500">Content activity visualization would appear here</span>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <h4 className="text-sm font-semibold mb-4">Key Metrics</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Avg. Posts per User</span>
                      <span className="font-semibold">
                        {analyticsData.totalUsers
                          ? (analyticsData.totalPosts / analyticsData.totalUsers).toFixed(1)
                          : "0"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Content Removal Rate</span>
                      <span className="font-semibold">
                        {analyticsData.totalPosts
                          ? ((analyticsData.deletedPosts / analyticsData.totalPosts) * 100).toFixed(1) + "%"
                          : "0%"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">User Ban Rate</span>
                      <span className="font-semibold">
                        {analyticsData.totalUsers
                          ? ((analyticsData.bannedUsers / analyticsData.totalUsers) * 100).toFixed(1) + "%"
                          : "0%"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <h4 className="text-sm font-semibold mb-4">Recent Platform Activity</h4>
                  <div className="space-y-3">
                    {adminLogs.slice(0, 5).map((log, index) => (
                      <div key={index} className="flex items-start">
                        <div className="bg-gray-100 p-2 rounded-full mr-3">
                          {log.action.includes("ban") ? (
                            <Ban className="h-4 w-4 text-red-500" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-orange-500" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{log.action}</p>
                          <p className="text-xs text-gray-500">{formatTimestamp(log.timestamp)}</p>
                        </div>
                      </div>
                    ))}
                    {adminLogs.length === 0 && <p className="text-sm text-gray-500 text-center">No recent activity</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Dashboard Tab (Default) */}
          {activeTab === "dashboard" && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm col-span-2">
                  <h3 className="text-lg font-semibold mb-4">Platform Overview</h3>
                  <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                    <BarChart2 className="h-12 w-12 text-gray-400" />
                    <span className="ml-2 text-gray-500">Platform activity visualization would appear here</span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => handleTabChange("users")}
                      className="w-full flex items-center justify-between p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                    >
                      <div className="flex items-center">
                        <Users className="h-5 w-5 mr-2" />
                        <span>Manage Users</span>
                      </div>
                      <ChevronRight className="h-5 w-5" />
                    </button>

                    <button
                      onClick={() => handleTabChange("posts")}
                      className="w-full flex items-center justify-between p-3 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100"
                    >
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 mr-2" />
                        <span>Moderate Content</span>
                      </div>
                      <ChevronRight className="h-5 w-5" />
                    </button>

                    <button
                      onClick={() => handleTabChange("flagged")}
                      className="w-full flex items-center justify-between p-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100"
                    >
                      <div className="flex items-center">
                        <Flag className="h-5 w-5 mr-2" />
                        <span>Review Flagged Content</span>
                      </div>
                      <div className="flex items-center">
                        <span className="bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded-full mr-2">
                          3
                        </span>
                        <ChevronRight className="h-5 w-5" />
                      </div>
                    </button>

                    <button
                      onClick={() => handleTabChange("analytics")}
                      className="w-full flex items-center justify-between p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
                    >
                      <div className="flex items-center">
                        <BarChart2 className="h-5 w-5 mr-2" />
                        <span>View Analytics</span>
                      </div>
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Recent User Activity</h3>
                    <button
                      onClick={() => handleTabChange("users")}
                      className="text-sm text-cohere-accent hover:underline"
                    >
                      View All
                    </button>
                  </div>
                  <div className="space-y-3">
                    {users.slice(0, 5).map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                            {user.profilePic ? (
                              <img
                                src={user.profilePic || "/placeholder.svg"}
                                alt={user.username}
                                className="h-8 w-8 rounded-full"
                              />
                            ) : (
                              <span className="text-gray-500">{user.username?.charAt(0).toUpperCase() || "U"}</span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{user.username || "Unknown"}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.isBanned ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                          }`}
                        >
                          {user.isBanned ? "Banned" : "Active"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Recent Content</h3>
                    <button
                      onClick={() => handleTabChange("posts")}
                      className="text-sm text-cohere-accent hover:underline"
                    >
                      View All
                    </button>
                  </div>
                  <div className="space-y-3">
                    {posts.slice(0, 5).map((post) => (
                      <div key={post.id} className="p-2 hover:bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start">
                          <p className="text-sm text-gray-500">
                            {post.authorId ? `Author: ${post.authorId.substring(0, 8)}...` : "Unknown author"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {post.timestamp ? formatTimestamp(post.timestamp) : "No timestamp"}
                          </p>
                        </div>
                        <p className="text-sm mt-1 line-clamp-2">{post.content || "No content"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
