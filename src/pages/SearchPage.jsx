"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { searchUsers } from "../services/userService"
import { searchPosts } from "../services/postService"
import { useAuth } from "../contexts/AuthContext.jsx"
import { Search, User, FileText, Users, MessageSquare } from "lucide-react"

export default function SearchPage() {
  const { currentUser } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [searchType, setSearchType] = useState("users") // "users" or "posts"
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSearch = async (e) => {
    e.preventDefault()

    if (!searchTerm.trim()) {
      setError("Please enter a search term")
      return
    }

    try {
      setLoading(true)
      setError("")

      if (searchType === "users") {
        const users = await searchUsers(searchTerm)
        setSearchResults(users)
      } else {
        const posts = await searchPosts(searchTerm)
        setSearchResults(posts)
      }

      setLoading(false)
    } catch (error) {
      console.error("Error searching:", error)
      setError("Failed to perform search")
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Search</h2>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>
          )}

          <form onSubmit={handleSearch}>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`Search for ${searchType}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex">
                <button
                  type="button"
                  className={`px-4 py-2 rounded-l-md ${
                    searchType === "users" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                  onClick={() => setSearchType("users")}
                >
                  <Users className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  className={`px-4 py-2 rounded-r-md ${
                    searchType === "posts" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                  onClick={() => setSearchType("posts")}
                >
                  <MessageSquare className="h-5 w-5" />
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || !searchTerm.trim()}
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Searching..." : "Search"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-medium text-gray-800">{searchType === "users" ? "Users" : "Posts"} Results</h3>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-500">Searching...</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm.trim()
                ? `No ${searchType} found matching "${searchTerm}"`
                : `Enter a search term to find ${searchType}`}
            </div>
          ) : searchType === "users" ? (
            <div className="divide-y divide-gray-200">
              {searchResults.map((user) => (
                <div key={user.id} className="py-4 flex items-center">
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
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{user.username}</h4>
                    <p className="text-sm text-gray-500">{user.bio || "No bio available"}</p>
                  </div>
                  <Link
                    to={`/profile/${user.id}`}
                    className="ml-4 bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded-md text-sm"
                  >
                    View Profile
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {searchResults.map((post) => (
                <div key={post.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <FileText className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-500">
                      Posted by {post.authorId === currentUser.uid ? "You" : post.authorId}
                    </span>
                  </div>
                  <p className="text-gray-800 mb-2">{post.content}</p>
                  {post.imageUrl && (
                    <div className="mb-2">
                      <img src={post.imageUrl || "/placeholder.svg"} alt="Post" className="rounded max-h-40 w-auto" />
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{post.likesCount || 0} likes</span>
                    <span>{post.commentsCount || 0} comments</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
