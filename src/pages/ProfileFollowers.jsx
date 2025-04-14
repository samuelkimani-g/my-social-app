"use client"

import { useState, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext.jsx"
import { getUserById } from "../services/userService"
import { getFollowers, getFollowing, followUser, unfollowUser, checkIsFollowing } from "../services/followService"
import { User, ArrowLeft, UserPlus, UserMinus } from "lucide-react"

export default function ProfileFollowers() {
  const { userId, type } = useParams() // type can be "followers" or "following"
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [followers, setFollowers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [followStatus, setFollowStatus] = useState({})
  const [followLoading, setFollowLoading] = useState({})

  useEffect(() => {
    const loadData = async () => {
      if (!userId) return

      try {
        setLoading(true)
        setError("")

        // Get user data
        const userData = await getUserById(userId)
        if (!userData) {
          setError("User not found")
          setLoading(false)
          return
        }
        setUser(userData)

        // Get followers or following based on type
        let userList = []
        let userIds = []

        if (type === "followers") {
          userIds = await getFollowers(userId)
        } else if (type === "following") {
          userIds = await getFollowing(userId)
        } else {
          setError("Invalid type")
          setLoading(false)
          return
        }

        // Get user data for each follower/following
        const userDataPromises = userIds.map((id) => getUserById(id))
        const usersData = await Promise.all(userDataPromises)
        userList = usersData.filter((user) => user !== null)

        setFollowers(userList)

        // Check follow status for each user if current user is logged in
        if (currentUser) {
          const statusObj = {}
          for (const user of userList) {
            if (user.id !== currentUser.uid) {
              statusObj[user.id] = await checkIsFollowing(currentUser.uid, user.id)
            }
          }
          setFollowStatus(statusObj)
        }

        setLoading(false)
      } catch (error) {
        console.error("Error loading followers/following:", error)
        setError("Failed to load data")
        setLoading(false)
      }
    }

    loadData()
  }, [userId, type, currentUser])

  const handleFollow = async (targetUserId) => {
    if (!currentUser) return

    try {
      setFollowLoading((prev) => ({ ...prev, [targetUserId]: true }))

      if (followStatus[targetUserId]) {
        const result = await unfollowUser(currentUser.uid, targetUserId)
        if (result.success) {
          setFollowStatus((prev) => ({ ...prev, [targetUserId]: false }))
        } else {
          setError(result.message || "Failed to unfollow user")
        }
      } else {
        const result = await followUser(currentUser.uid, targetUserId)
        if (result.success) {
          setFollowStatus((prev) => ({ ...prev, [targetUserId]: true }))
        } else {
          setError(result.message || "Failed to follow user")
        }
      }

      setFollowLoading((prev) => ({ ...prev, [targetUserId]: false }))
    } catch (error) {
      console.error("Error following/unfollowing user:", error)
      setError("Failed to update follow status")
      setFollowLoading((prev) => ({ ...prev, [targetUserId]: false }))
    }
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex items-center">
        <button onClick={() => navigate(`/profile/${userId}`)} className="mr-2 p-1 rounded-full hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h2 className="text-xl font-semibold">
          {user?.username}'s {type === "followers" ? "Followers" : "Following"}
        </h2>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative m-4">{error}</div>
      )}

      {loading ? (
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cohere-accent mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading...</p>
        </div>
      ) : followers.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          {type === "followers"
            ? `${user?.username} doesn't have any followers yet.`
            : `${user?.username} isn't following anyone yet.`}
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {followers.map((follower) => (
            <li key={follower.id} className="p-4">
              <div className="flex items-center justify-between">
                <Link to={`/profile/${follower.id}`} className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                    {follower.profilePic ? (
                      <img
                        src={follower.profilePic || "/placeholder.svg"}
                        alt={follower.username}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-900">{follower.username}</h3>
                    <p className="text-sm text-gray-500 truncate max-w-xs">{follower.bio || "No bio available"}</p>
                  </div>
                </Link>

                {currentUser && currentUser.uid !== follower.id && (
                  <button
                    onClick={() => handleFollow(follower.id)}
                    disabled={followLoading[follower.id]}
                    className={`ml-4 flex items-center px-3 py-1 rounded-md text-sm ${
                      followStatus[follower.id]
                        ? "bg-red-100 text-red-700 hover:bg-red-200"
                        : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                    }`}
                  >
                    {followLoading[follower.id] ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    ) : followStatus[follower.id] ? (
                      <>
                        <UserMinus className="h-4 w-4 mr-1" />
                        Unfollow
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-1" />
                        Follow
                      </>
                    )}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
