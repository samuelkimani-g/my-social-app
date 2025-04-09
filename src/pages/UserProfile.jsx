"use client"

import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext.jsx"
import { getUserById } from "../services/userService"
import { followUser, unfollowUser, checkIsFollowing } from "../services/followService"
import { User, Calendar, MapPin, Mail, UserPlus, UserMinus, RefreshCw } from "lucide-react"
import { db } from "../firebase"
import { collection, query, where, orderBy, limit, getDocs, startAfter } from "firebase/firestore"

export default function UserProfile() {
  const { userId } = useParams()
  const { currentUser } = useAuth()
  const [user, setUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [lastVisible, setLastVisible] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true)

        // Get user data
        const userData = await getUserById(userId)
        if (!userData) {
          setError("User not found")
          setLoading(false)
          return
        }

        setUser(userData)

        // Check if current user is following this user
        if (currentUser && currentUser.uid !== userId) {
          const followStatus = await checkIsFollowing(currentUser.uid, userId)
          setIsFollowing(followStatus)
        }

        // Get user's posts
        const postsQuery = query(
          collection(db, "posts"),
          where("authorId", "==", userId),
          where("isDeleted", "==", false),
          orderBy("timestamp", "desc"),
          limit(10),
        )

        const postsSnapshot = await getDocs(postsQuery)
        const lastVisibleDoc = postsSnapshot.docs[postsSnapshot.docs.length - 1]

        const postsData = postsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        setPosts(postsData)
        setLastVisible(lastVisibleDoc)
        setLoading(false)
      } catch (error) {
        console.error("Error loading user data:", error)
        setError("Failed to load user data")
        setLoading(false)
      }
    }

    if (userId) {
      loadUserData()
    }
  }, [userId, currentUser])

  const handleFollow = async () => {
    if (!currentUser) return

    try {
      setFollowLoading(true)

      if (isFollowing) {
        const result = await unfollowUser(currentUser.uid, userId)
        if (result.success) {
          setIsFollowing(false)
          setUser((prev) => ({
            ...prev,
            followersCount: Math.max((prev.followersCount || 0) - 1, 0),
          }))
        } else {
          setError(result.message || "Failed to unfollow user")
        }
      } else {
        const result = await followUser(currentUser.uid, userId)
        if (result.success) {
          setIsFollowing(true)
          setUser((prev) => ({
            ...prev,
            followersCount: (prev.followersCount || 0) + 1,
          }))
        } else {
          setError(result.message || "Failed to follow user")
        }
      }

      setFollowLoading(false)
    } catch (error) {
      console.error("Error following/unfollowing user:", error)
      setError("Failed to update follow status")
      setFollowLoading(false)
    }
  }

  const loadMorePosts = async () => {
    if (!lastVisible) return

    try {
      setLoading(true)

      const postsQuery = query(
        collection(db, "posts"),
        where("authorId", "==", userId),
        where("isDeleted", "==", false),
        orderBy("timestamp", "desc"),
        startAfter(lastVisible),
        limit(10),
      )

      const postsSnapshot = await getDocs(postsQuery)
      const lastVisibleDoc = postsSnapshot.docs[postsSnapshot.docs.length - 1]

      const newPosts = postsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      setPosts([...posts, ...newPosts])
      setLastVisible(lastVisibleDoc)
      setLoading(false)
    } catch (error) {
      console.error("Error loading more posts:", error)
      setError("Failed to load more posts")
      setLoading(false)
    }
  }

  if (loading && !user) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-gray-500">Loading profile...</p>
      </div>
    )
  }

  if (error && !user) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-red-500">{error}</p>
        <Link to="/dashboard" className="mt-4 inline-block text-blue-500 hover:underline">
          Return to Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>
      )}

      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-6">
          <div className="flex flex-col md:flex-row items-center md:items-start">
            <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-200 mb-4 md:mb-0 md:mr-6 flex-shrink-0">
              {user?.profilePic ? (
                <img
                  src={user.profilePic || "/placeholder.svg"}
                  alt={user.username}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <User size={48} className="text-gray-400" />
                </div>
              )}
            </div>

            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold text-gray-800">{user?.username}</h2>

              <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-2 text-sm text-gray-600">
                {user?.location && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{user.location}</span>
                  </div>
                )}

                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>
                    Joined {user?.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : "Recently"}
                  </span>
                </div>

                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-1" />
                  <span>{user?.email}</span>
                </div>
              </div>

              {user?.bio && <p className="mt-3 text-gray-700">{user.bio}</p>}

              <div className="flex justify-center md:justify-start gap-6 mt-4">
                <div className="text-center">
                  <p className="font-bold">{user?.postsCount || 0}</p>
                  <p className="text-gray-600 text-sm">Posts</p>
                </div>
                <div className="text-center">
                  <p className="font-bold">{user?.followersCount || 0}</p>
                  <p className="text-gray-600 text-sm">Followers</p>
                </div>
                <div className="text-center">
                  <p className="font-bold">{user?.followingCount || 0}</p>
                  <p className="text-gray-600 text-sm">Following</p>
                </div>
              </div>

              {currentUser && currentUser.uid !== userId && (
                <div className="mt-4">
                  <button
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={`flex items-center px-4 py-2 rounded-md ${
                      isFollowing
                        ? "bg-red-500 hover:bg-red-600 text-white"
                        : "bg-blue-500 hover:bg-blue-600 text-white"
                    }`}
                  >
                    {followLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : isFollowing ? (
                      <UserMinus className="h-4 w-4 mr-2" />
                    ) : (
                      <UserPlus className="h-4 w-4 mr-2" />
                    )}
                    {isFollowing ? "Unfollow" : "Follow"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* User Posts */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-medium text-gray-800">Posts</h3>
        </div>

        <div className="p-4">
          {loading && posts.length === 0 ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">This user hasn't posted anything yet.</div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <div key={post.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                      {user?.profilePic ? (
                        <img
                          src={user.profilePic || "/placeholder.svg"}
                          alt={user.username}
                          className="h-8 w-8 rounded-full"
                        />
                      ) : (
                        <User className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{user?.username}</p>
                      <p className="text-xs text-gray-500">
                        {post.timestamp ? new Date(post.timestamp.seconds * 1000).toLocaleString() : "Recently"}
                      </p>
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

                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{post.likesCount || 0} likes</span>
                    <span>{post.commentsCount || 0} comments</span>
                  </div>
                </div>
              ))}

              {lastVisible && (
                <div className="text-center">
                  <button
                    onClick={loadMorePosts}
                    disabled={loading}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center mx-auto"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Load More
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
