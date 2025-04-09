"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext.jsx"
import { getAllUsers } from "../services/userService"
import { followUser, unfollowUser, checkIsFollowing } from "../services/followService"
import { User, UserPlus, UserMinus, RefreshCw } from "lucide-react"

export default function ExplorePage() {
  const { currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [lastVisible, setLastVisible] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [followStatus, setFollowStatus] = useState({})
  const [followLoading, setFollowLoading] = useState({})

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)

      const { users: usersList, lastVisible: lastUser } = await getAllUsers()
      setUsers(usersList)
      setLastVisible(lastUser)

      // Check follow status for each user
      if (currentUser) {
        const statusObj = {}

        for (const user of usersList) {
          if (user.id !== currentUser.uid) {
            statusObj[user.id] = await checkIsFollowing(currentUser.uid, user.id)
          }
        }

        setFollowStatus(statusObj)
      }

      setLoading(false)
    } catch (error) {
      console.error("Error loading users:", error)
      setError("Failed to load users")
      setLoading(false)
    }
  }

  const loadMoreUsers = async () => {
    if (!lastVisible) return

    try {
      setLoading(true)

      const { users: newUsers, lastVisible: lastUser } = await getAllUsers(lastVisible)

      // Check follow status for each new user
      if (currentUser) {
        const statusObj = { ...followStatus }

        for (const user of newUsers) {
          if (user.id !== currentUser.uid) {
            statusObj[user.id] = await checkIsFollowing(currentUser.uid, user.id)
          }
        }

        setFollowStatus(statusObj)
      }

      setUsers([...users, ...newUsers])
      setLastVisible(lastUser)
      setLoading(false)
    } catch (error) {
      console.error("Error loading more users:", error)
      setError("Failed to load more users")
      setLoading(false)
    }
  }

  const handleFollow = async (userId) => {
    if (!currentUser) return

    try {
      setFollowLoading((prev) => ({ ...prev, [userId]: true }))

      if (followStatus[userId]) {
        const result = await unfollowUser(currentUser.uid, userId)
        if (result.success) {
          setFollowStatus((prev) => ({ ...prev, [userId]: false }))

          // Update user's followers count in the list
          setUsers((prev) =>
            prev.map((user) =>
              user.id === userId ? { ...user, followersCount: Math.max((user.followersCount || 0) - 1, 0) } : user,
            ),
          )
        } else {
          setError(result.message || "Failed to unfollow user")
        }
      } else {
        const result = await followUser(currentUser.uid, userId)
        if (result.success) {
          setFollowStatus((prev) => ({ ...prev, [userId]: true }))

          // Update user's followers count in the list
          setUsers((prev) =>
            prev.map((user) =>
              user.id === userId ? { ...user, followersCount: (user.followersCount || 0) + 1 } : user,
            ),
          )
        } else {
          setError(result.message || "Failed to follow user")
        }
      }

      setFollowLoading((prev) => ({ ...prev, [userId]: false }))
    } catch (error) {
      console.error("Error following/unfollowing user:", error)
      setError("Failed to update follow status")
      setFollowLoading((prev) => ({ ...prev, [userId]: false }))
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Explore Users</h2>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>
          )}

          <p className="text-gray-600 mb-4">Discover new people to follow and connect with.</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-medium text-gray-800">People You Might Like</h3>
        </div>

        <div className="divide-y divide-gray-200">
          {loading && users.length === 0 ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No users found</div>
          ) : (
            <>
              {users
                .filter((user) => !currentUser || user.id !== currentUser.uid) // Filter out current user
                .map((user) => (
                  <div key={user.id} className="p-4 flex flex-col sm:flex-row sm:items-center">
                    <div className="flex items-center mb-4 sm:mb-0">
                      <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                        {user.profilePic ? (
                          <img
                            src={user.profilePic || "/placeholder.svg"}
                            alt={user.username}
                            className="h-12 w-12 rounded-full"
                          />
                        ) : (
                          <User className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">{user.username}</h4>
                        <p className="text-sm text-gray-500">
                          {user.followersCount || 0} {user.followersCount === 1 ? "follower" : "followers"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center ml-0 sm:ml-auto space-x-3">
                      {currentUser && (
                        <button
                          onClick={() => handleFollow(user.id)}
                          disabled={followLoading[user.id]}
                          className={`flex items-center px-3 py-1 rounded-md text-sm ${
                            followStatus[user.id]
                              ? "bg-red-100 text-red-700 hover:bg-red-200"
                              : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                          }`}
                        >
                          {followLoading[user.id] ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-1"></div>
                          ) : followStatus[user.id] ? (
                            <UserMinus className="h-4 w-4 mr-1" />
                          ) : (
                            <UserPlus className="h-4 w-4 mr-1" />
                          )}
                          {followStatus[user.id] ? "Unfollow" : "Follow"}
                        </button>
                      )}

                      <Link
                        to={`/profile/${user.id}`}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                      >
                        View Profile
                      </Link>
                    </div>
                  </div>
                ))}

              {lastVisible && (
                <div className="p-4 text-center">
                  <button
                    onClick={loadMoreUsers}
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
            </>
          )}
        </div>
      </div>
    </div>
  )
}
