"use client"

import { useState, useEffect } from "react"
import { Bell, User, Check } from "lucide-react"
import {
  getUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../services/notificationService"
import { useAuth } from "../contexts/AuthContext"
import { Link } from "react-router-dom"

export default function NotificationsDropdown() {
  const { currentUser } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (currentUser) {
      loadNotifications()

      // Set up polling for new notifications
      const interval = setInterval(() => {
        if (document.visibilityState === "visible") {
          loadNotifications(true)
        }
      }, 30000) // Check every 30 seconds when visible

      return () => clearInterval(interval)
    }
  }, [currentUser])

  const loadNotifications = async (silent = false) => {
    if (!currentUser) return

    try {
      if (!silent) setLoading(true)
      const notifs = await getUserNotifications(currentUser.uid, 20)

      // Sort notifications by date (newest first)
      notifs.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt.seconds * 1000) : new Date(0)
        const dateB = b.createdAt ? new Date(b.createdAt.seconds * 1000) : new Date(0)
        return dateB - dateA
      })

      setNotifications(notifs)
      setUnreadCount(notifs.filter((n) => !n.read).length)
      if (!silent) setLoading(false)
    } catch (error) {
      console.error("Error loading notifications:", error)
      if (!silent) setLoading(false)
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!currentUser || unreadCount === 0) return

    try {
      await markAllNotificationsAsRead(currentUser.uid)
      setNotifications(notifications.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error("Error marking notifications as read:", error)
    }
  }

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      try {
        await markNotificationAsRead(notification.id)

        // Update local state
        setNotifications(notifications.map((n) => (n.id === notification.id ? { ...n, read: true } : n)))
        setUnreadCount((prev) => Math.max(prev - 1, 0))
      } catch (error) {
        console.error("Error marking notification as read:", error)
      }
    }

    setIsOpen(false)
  }

  const formatNotificationTime = (timestamp) => {
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

  return (
    <div className="relative">
      <button
        className="relative p-1 text-cohere-light hover:text-cohere-accent focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50 overflow-hidden">
          <div className="p-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-700">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-cohere-accent hover:text-cohere-primary flex items-center"
              >
                <Check size={14} className="mr-1" />
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cohere-accent mx-auto"></div>
                <p className="mt-2">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <p>No notifications yet</p>
              </div>
            ) : (
              <div>
                {notifications.map((notification) => (
                  <Link
                    key={notification.id}
                    to={getNotificationLink(notification)}
                    onClick={() => handleNotificationClick(notification)}
                    className={`block p-4 hover:bg-gray-50 border-b border-gray-100 ${
                      !notification.read ? "bg-blue-50" : ""
                    }`}
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
                      {!notification.read && <div className="ml-2 h-2 w-2 bg-blue-500 rounded-full"></div>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="p-2 border-t border-gray-200 text-center">
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs text-cohere-accent hover:text-cohere-primary block"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
