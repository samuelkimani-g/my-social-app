"use client"

import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import {
  Users,
  FileText,
  BarChart2,
  ClipboardList,
  Settings,
  Shield,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Bell,
  Flag,
  UserX,
  Home,
} from "lucide-react"

export default function AdminSidebar() {
  const { currentUser, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(true)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const location = useLocation()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Failed to log out", error)
    }
  }

  const menuItems = [
    {
      title: "Dashboard",
      icon: Home,
      path: "/admin-dashboard",
      badge: null,
    },
    {
      title: "User Management",
      icon: Users,
      path: "/admin-dashboard?tab=users",
      badge: null,
    },
    {
      title: "Content Moderation",
      icon: FileText,
      path: "/admin-dashboard?tab=posts",
      badge: null,
    },
    {
      title: "Analytics",
      icon: BarChart2,
      path: "/admin-dashboard?tab=analytics",
      badge: null,
    },
    {
      title: "Logs & Audit",
      icon: ClipboardList,
      path: "/admin-dashboard?tab=logs",
      badge: null,
    },
    {
      title: "Flagged Content",
      icon: Flag,
      path: "/admin-dashboard?tab=flagged",
      badge: 3,
    },
    {
      title: "Banned Users",
      icon: UserX,
      path: "/admin-dashboard?tab=banned",
      badge: null,
    },
    {
      title: "Notifications",
      icon: Bell,
      path: "/admin-dashboard?tab=notifications",
      badge: 5,
    },
    {
      title: "Settings",
      icon: Settings,
      path: "/admin-dashboard?tab=settings",
      badge: null,
    },
  ]

  const isActive = (path) => {
    if (path === "/admin-dashboard" && location.pathname === "/admin-dashboard" && !location.search) {
      return true
    }
    return location.pathname + location.search === path
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-30">
        <button onClick={() => setIsMobileOpen(!isMobileOpen)} className="p-2 rounded-md bg-cohere-primary text-white">
          {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-cohere-primary text-white z-20 transition-all duration-300 ease-in-out ${
          isOpen ? "w-64" : "w-20"
        } ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="absolute -right-3 top-20 bg-cohere-accent text-white p-1 rounded-full shadow-lg hidden lg:block"
        >
          <ChevronRight className={`h-5 w-5 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {/* Header */}
        <div className="p-4 border-b border-cohere-secondary flex items-center">
          <Shield className="h-8 w-8 text-cohere-accent" />
          <h2 className={`ml-2 font-bold text-xl ${isOpen ? "block" : "hidden"}`}>Admin Panel</h2>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-cohere-secondary">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-cohere-secondary flex items-center justify-center">
              {currentUser?.photoURL ? (
                <img
                  src={currentUser.photoURL || "/placeholder.svg"}
                  alt="Profile"
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <span className="text-lg font-semibold">{currentUser?.email?.charAt(0).toUpperCase() || "A"}</span>
              )}
            </div>
            {isOpen && (
              <div className="ml-3">
                <p className="font-medium truncate max-w-[160px]">
                  {currentUser?.displayName || currentUser?.email?.split("@")[0] || "Admin"}
                </p>
                <p className="text-xs text-gray-300 truncate max-w-[160px]">{currentUser?.email}</p>
              </div>
            )}
          </div>
        </div>

        {/* Menu Items */}
        <nav className="mt-4 px-2">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.title}>
                <Link
                  to={item.path}
                  className={`flex items-center p-3 rounded-lg transition-colors duration-200 ${
                    isActive(item.path) ? "bg-cohere-accent text-white" : "text-gray-300 hover:bg-cohere-secondary"
                  }`}
                  onClick={() => setIsMobileOpen(false)}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {isOpen && <span className="ml-3">{item.title}</span>}
                  {isOpen && item.badge && (
                    <span className="ml-auto bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                  {!isOpen && item.badge && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-medium px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-0 w-full p-4 border-t border-cohere-secondary">
          <button
            onClick={handleLogout}
            className="flex items-center w-full p-3 rounded-lg text-gray-300 hover:bg-cohere-secondary transition-colors duration-200"
          >
            <LogOut className="h-5 w-5" />
            {isOpen && <span className="ml-3">Logout</span>}
          </button>
        </div>
      </div>
    </>
  )
}
