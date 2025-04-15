"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { getUserNotifications, markAllNotificationsAsRead } from "../services/notificationService"
import { Link } from "react-router-dom"
import { User, Bell, Check, ArrowLeft } from "lucide-react"

export default function NotificationsPage() {
  const { currentUser } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (currentUser) {
      loadNotifications()
    }
  }, [currentUser])

  const loadNotifications = async () => {
    if (!currentUser) return

    try {
      setLoading(true)
      const notifs = await getUserNotifications(currentUser.uid, 50)

      // Sort notifications by date (newest first)
      notifs.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt.seconds * 1000) : new Date(0)
        const dateB = b.createdAt ? new Date(b.createdAt.seconds * 1000) : new Date(0)
        return dateB - dateA
      })

      setNotifications(notifs)
      setLoading(false)
    } catch (error) {
      console.error("Error loading notifications:", error)
      setError("Failed to load notifications")
      setLoading(false)
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!currentUser) return

    try {
      await markAllNotificationsAsRead(currentUser.uid)
      setNotifications(notifications.map((n) => ({ ...n, read: true })))
    } catch (error) {
      console.error("Error marking notifications as read:", error)
      setError("Failed to mark notifications as read")
    }
  }

  const formatNotificationTime = (timestamp) => {
    if (!timestamp) return "Just now"

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
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

  const getNotificationContent = (notification) => {
    switch (notification.type) {
      case "follow":
        return `${notification.fromUserName} started following you`
      case "like":
        return `${notification.fromUserName} liked your post`
      case "comment":
        return `${notification.fromUserName} commented on your post: "${notification.data?.commentPreview || ""}"`
      default:
        return `You have a new notification from ${notification.fromUserName}`
    }
  }

  const getNotificationLink = (notification) => {
    switch (notification.type) {
      case "follow":
        return `/profile/${notification.fromUserId}`
      case "like":
      case "comment":
        return notification.data?.postId ? `/post/${notification.data.postId}` : "/dashboard"
      default:
        return "/dashboard"
    }
  }

  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8 text-center">
        <h3 className="text-lg font-medium text-gray-700">Please log in to view notifications</h3>
        <Link
          to="/login"
          className="mt-6 inline-block bg-cohere-accent hover:opacity-90 text-white py-2 px-6 rounded-md"
        >
          Log In
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/dashboard" className="mr-2 p-1 rounded-full hover:bg-gray-100">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <h2 className="text-xl font-semibold flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Notifications
            </h2>
          </div>

          {notifications.some((n) => !n.read) && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-sm text-cohere-accent hover:text-cohere-primary flex items-center"
            >
              <Check size={16} className="mr-1" />
              Mark all as read
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 m-4 rounded relative">{error}</div>
        )}

        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cohere-accent mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto flex items-center justify-center">
                <Bell className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-700">No Notifications</h3>
              <p className="text-gray-500 mt-2">You don't have any notifications yet.</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <Link
                key={notification.id}
                to={getNotificationLink(notification)}
                className={`block p-4 hover:bg-gray-50 ${!notification.read ? "bg-blue-50" : ""}`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    {notification.fromUserPic ? (
                      <img
                        src={notification.fromUserPic || "/placeholder.svg"}
                        alt={notification.fromUserName}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800">{getNotificationContent(notification)}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatNotificationTime(notification.createdAt)}</p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
