"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "../contexts/AuthContext.jsx"
import { getUserById, createUser, getAllUsers } from "../services/userService"
import { createPost, getAllPosts, getFollowedPosts } from "../services/postService"
import { getFollowing } from "../services/followService"
import { Link } from "react-router-dom"
import { ImageIcon, Send, User, Users, Search, RefreshCw, FileText } from "lucide-react"
import PostInteractions from "../components/PostInteractions"
import FirestoreIndexNotice from "../components/FirestoreIndexNotice"

// Import the image upload service
import { uploadImage } from "../services/imageUploadService"

export default function Dashboard() {
  const { currentUser, isAdmin } = useAuth()
  const [user, setUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [lastVisible, setLastVisible] = useState(null)
  const [loading, setLoading] = useState(true)
  const [postLoading, setPostLoading] = useState(false)
  const [error, setError] = useState("")
  const [postContent, setPostContent] = useState("")
  const [postImage, setPostImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [feedType, setFeedType] = useState("all") // "all" or "following"
  const [following, setFollowing] = useState([])
  const [followedUsers, setFollowedUsers] = useState([])
  const [suggestedUsers, setSuggestedUsers] = useState([])
  const fileInputRef = useRef(null)

  useEffect(() => {
    const initializeUser = async () => {
      if (currentUser) {
        try {
          console.log("Initializing user data for:", currentUser.uid)
          // Get or create user document - force a fresh fetch
          let userData = await getUserById(currentUser.uid)

          if (!userData) {
            console.log("User document not found, creating new user")
            await createUser(currentUser.uid, {
              email: currentUser.email,
              photoURL: currentUser.photoURL,
            })
            userData = await getUserById(currentUser.uid)
          }

          setUser(userData)
          console.log("User data loaded:", userData)

          // If user is admin, don't load posts or following
          if (userData?.role === "admin") {
            setLoading(false)
            return
          }

          // Get following list
          const followingIds = await getFollowing(currentUser.uid)
          setFollowing(followingIds)
          console.log("Following IDs:", followingIds)

          // Get followed users' data
          const followedUsersData = []
          for (const id of followingIds) {
            const userData = await getUserById(id)
            if (userData && userData.role !== "admin") {
              // Skip admin users
              followedUsersData.push(userData)
            }
          }
          setFollowedUsers(followedUsersData)

          // Load posts
          await loadPosts("all")

          // Load suggested users (excluding admins)
          loadSuggestedUsers()
        } catch (error) {
          console.error("Error initializing user:", error)
          setError("Failed to load user data")
          setLoading(false)
        }
      }
    }

    initializeUser()
  }, [currentUser])

  const loadSuggestedUsers = async () => {
    try {
      // Get some users to suggest, excluding admins and already followed users
      const { users } = await getAllUsers(null, 5)
      const filtered = users
        .filter((u) => u.id !== currentUser.uid && !following.includes(u.id) && u.role !== "admin" && !u.isBanned)
        .slice(0, 5)

      setSuggestedUsers(filtered)
    } catch (error) {
      console.error("Error loading suggested users:", error)
    }
  }

  // Fix the loadPosts function to handle errors better
  const loadPosts = async (type) => {
    try {
      setLoading(true)
      setError("")
      console.log("Loading posts, feed type:", type)

      let postsData
      if (type === "following" && following.length > 0) {
        postsData = await getFollowedPosts(currentUser.uid, following)
      } else {
        postsData = await getAllPosts()
      }

      console.log("Posts data received:", postsData)

      if (!postsData) {
        console.error("No posts data received")
        setError("Failed to load posts: No data received")
        setLoading(false)
        return
      }

      // Initialize posts array
      const postsArray = postsData.posts || []
      console.log("Posts array length:", postsArray.length)

      if (postsArray.length === 0) {
        console.log("No posts found for this feed type")
        setPosts([])
        setLastVisible(null)
        setFeedType(type)
        setLoading(false)
        return
      }

      // For each post, get the author's username
      const postsWithAuthor = await Promise.all(
        postsArray.map(async (post) => {
          try {
            if (!post || !post.authorId) {
              console.error("Invalid post data:", post)
              return null
            }

            const author = await getUserById(post.authorId)
            // Skip posts from admin users or banned users
            if (author?.role === "admin" || author?.isBanned) {
              return null
            }
            return {
              ...post,
              authorName: author ? author.username : "Unknown User",
              authorPic: author ? author.profilePic : null,
            }
          } catch (error) {
            console.error("Error getting author for post:", error)
            return {
              ...post,
              authorName: "Unknown User",
              authorPic: null,
            }
          }
        }),
      )

      // Filter out null posts (from admins or banned users)
      const filteredPosts = postsWithAuthor.filter((post) => post !== null)

      console.log("Posts with author data:", filteredPosts)
      setPosts(filteredPosts)
      setLastVisible(postsData.lastVisible)
      setFeedType(type)
      setLoading(false)
    } catch (error) {
      console.error("Error loading posts:", error)
      setError("Failed to load posts: " + error.message)
      setLoading(false)
    }
  }

  const loadMorePosts = async () => {
    if (!lastVisible) return

    try {
      setLoading(true)
      setError("")

      let postsData
      if (feedType === "following" && following.length > 0) {
        postsData = await getFollowedPosts(currentUser.uid, following, lastVisible)
      } else {
        postsData = await getAllPosts(lastVisible)
      }

      if (!postsData || !postsData.posts) {
        console.error("Invalid posts data received:", postsData)
        setError("Failed to load more posts: Invalid data format")
        setLoading(false)
        return
      }

      // For each post, get the author's username
      const postsWithAuthor = await Promise.all(
        postsData.posts.map(async (post) => {
          if (!post || !post.authorId) {
            console.error("Invalid post data:", post)
            return null
          }

          const author = await getUserById(post.authorId)
          // Skip posts from admin users or banned users
          if (author?.role === "admin" || author?.isBanned) {
            return null
          }
          return {
            ...post,
            authorName: author ? author.username : "Unknown User",
            authorPic: author ? author.profilePic : null,
          }
        }),
      )

      // Filter out null posts (from admins or banned users)
      const filteredPosts = postsWithAuthor.filter((post) => post !== null)

      setPosts([...posts, ...filteredPosts])
      setLastVisible(postsData.lastVisible)
      setLoading(false)
    } catch (error) {
      console.error("Error loading more posts:", error)
      setError("Failed to load more posts: " + error.message)
      setLoading(false)
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size exceeds 5MB limit")
        return
      }

      setPostImage(file)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.onerror = () => {
        console.error("Error creating image preview")
        setError("Failed to preview image")
      }
      reader.readAsDataURL(file)
    }
  }

  // Add this function to the Dashboard component to handle post creation better
  const handleSubmitPost = async (e) => {
    e.preventDefault()

    if (!postContent.trim() && !postImage) {
      setError("Post cannot be empty")
      return
    }

    if (isAdmin) {
      setError("Admin users cannot create posts")
      return
    }

    try {
      setPostLoading(true)
      setError("")
      console.log("Creating new post...")

      let imageUrl = null
      if (postImage) {
        try {
          console.log("Uploading image...")
          // Use the third-party image upload service instead of Firebase Storage
          imageUrl = await uploadImage(postImage)
          console.log("Image uploaded:", imageUrl)
        } catch (uploadError) {
          console.error("Error uploading image:", uploadError)
          setError("Failed to upload image. Please try again.")
          setPostLoading(false)
          return
        }
      }

      const postData = {
        content: postContent,
        authorId: currentUser.uid,
        imageUrl,
      }

      console.log("Saving post data:", postData)
      const result = await createPost(postData)
      console.log("Post created:", result)

      if (result) {
        // Add the new post to the top of the posts list
        const newPost = {
          id: result.id,
          ...result,
          authorName: user?.username || "You",
          authorPic: user?.profilePic || null,
        }

        setPosts([newPost, ...posts])

        // Reset form
        setPostContent("")
        setPostImage(null)
        setImagePreview(null)
        setError("")
      } else {
        setError("Failed to create post")
      }

      setPostLoading(false)
    } catch (error) {
      console.error("Error creating post:", error)
      setError("Failed to create post: " + error.message)
      setPostLoading(false)
    }
  }

  // If user is admin, redirect to admin dashboard or show message
  if (isAdmin) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6 text-center">
        <h2 className="text-xl font-semibold mb-4">Admin Access Restricted</h2>
        <p className="mb-4">Admin users cannot access the regular user dashboard.</p>
        <Link to="/admin-dashboard" className="bg-cohere-accent hover:opacity-90 text-white py-2 px-4 rounded">
          Go to Admin Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Sidebar */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <div className="p-6">
              <div className="flex flex-col items-center">
                <div className="h-20 w-20 rounded-full overflow-hidden bg-gray-200 mb-4">
                  {user?.profilePic ? (
                    <img
                      src={user.profilePic || "/placeholder.svg"}
                      alt={user.username}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <User size={40} className="text-gray-400" />
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-800">{user?.username || "User"}</h2>
                <p className="text-gray-600 text-sm mt-1">{user?.email}</p>

                <div className="flex justify-around w-full mt-4">
                  <div className="text-center">
                    <p className="font-bold">{user?.postsCount || 0}</p>
                    <p className="text-gray-600 text-sm">Posts</p>
                  </div>
                  <Link to={`/profile/${currentUser?.uid}/followers`} className="text-center hover:text-cohere-accent">
                    <p className="font-bold">{user?.followersCount || 0}</p>
                    <p className="text-gray-600 text-sm">Followers</p>
                  </Link>
                  <Link to={`/profile/${currentUser?.uid}/following`} className="text-center hover:text-cohere-accent">
                    <p className="font-bold">{user?.followingCount || 0}</p>
                    <p className="text-gray-600 text-sm">Following</p>
                  </Link>
                </div>

                <Link
                  to="/profile"
                  className="mt-4 w-full bg-cohere-accent hover:opacity-90 text-white py-2 px-4 rounded-md text-center"
                >
                  Edit Profile
                </Link>
              </div>
            </div>
          </div>

          {/* Following Section */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-800">People You Follow</h3>
            </div>
            <div className="p-4">
              {followedUsers.length === 0 ? (
                <p className="text-gray-500 text-sm text-center">
                  You're not following anyone yet.{" "}
                  <Link to="/explore" className="text-cohere-accent">
                    Explore users
                  </Link>{" "}
                  to follow.
                </p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {followedUsers.map((followedUser) => (
                    <li key={followedUser.id} className="py-2">
                      <Link
                        to={`/profile/${followedUser.id}`}
                        className="flex items-center hover:bg-gray-50 p-2 rounded"
                      >
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                          {followedUser.profilePic ? (
                            <img
                              src={followedUser.profilePic || "/placeholder.svg"}
                              alt={followedUser.username}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <User className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{followedUser.username}</p>
                          <p className="text-xs text-gray-500">
                            {followedUser.followersCount || 0}{" "}
                            {followedUser.followersCount === 1 ? "follower" : "followers"}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-3 text-center">
                <Link to="/explore" className="text-sm text-cohere-accent hover:underline">
                  Find more people to follow
                </Link>
              </div>
            </div>
          </div>

          {/* Suggestions */}
          {suggestedUsers.length > 0 && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-medium text-gray-800">Suggested Users</h3>
              </div>
              <div className="p-4">
                <ul className="divide-y divide-gray-200">
                  {suggestedUsers.map((suggestedUser) => (
                    <li key={suggestedUser.id} className="py-2">
                      <Link
                        to={`/profile/${suggestedUser.id}`}
                        className="flex items-center hover:bg-gray-50 p-2 rounded"
                      >
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                          {suggestedUser.profilePic ? (
                            <img
                              src={suggestedUser.profilePic || "/placeholder.svg"}
                              alt={suggestedUser.username}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <User className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{suggestedUser.username}</p>
                          <p className="text-xs text-gray-500">
                            {suggestedUser.followersCount || 0}{" "}
                            {suggestedUser.followersCount === 1 ? "follower" : "followers"}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-800">Quick Links</h3>
            </div>
            <div className="p-4">
              <ul className="space-y-2">
                <li>
                  <Link to="/search" className="flex items-center text-gray-700 hover:text-cohere-accent">
                    <Search className="h-5 w-5 mr-2" />
                    Search
                  </Link>
                </li>
                <li>
                  <Link to="/explore" className="flex items-center text-gray-700 hover:text-cohere-accent">
                    <Users className="h-5 w-5 mr-2" />
                    Explore Users
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="md:col-span-2">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>
          )}

          <FirestoreIndexNotice />

          {/* Post Creation */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <div className="p-4">
              <form onSubmit={handleSubmitPost}>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cohere-accent resize-none"
                  rows="3"
                  placeholder="What's on your mind?"
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                ></textarea>

                {imagePreview && (
                  <div className="mt-2 relative">
                    <img src={imagePreview || "/placeholder.svg"} alt="Preview" className="max-h-40 rounded" />
                    <button
                      type="button"
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                      onClick={() => {
                        setPostImage(null)
                        setImagePreview(null)
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}

                <div className="flex justify-between items-center mt-3">
                  <button
                    type="button"
                    className="flex items-center text-gray-500 hover:text-cohere-accent"
                    onClick={() => fileInputRef.current.click()}
                  >
                    <ImageIcon className="h-5 w-5 mr-1" />
                    <span>Add Image</span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                  />

                  <button
                    type="submit"
                    disabled={postLoading || (!postContent.trim() && !postImage)}
                    className="bg-cohere-accent hover:opacity-90 text-white py-1 px-4 rounded-md flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {postLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Posting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-1" />
                        Post
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Feed Tabs */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <div className="flex border-b border-gray-200">
              <button
                className={`flex-1 py-2 px-4 text-center ${
                  feedType === "all"
                    ? "border-b-2 border-cohere-accent text-cohere-accent"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => loadPosts("all")}
              >
                All Posts
              </button>
              <button
                className={`flex-1 py-2 px-4 text-center ${
                  feedType === "following"
                    ? "border-b-2 border-cohere-accent text-cohere-accent"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => loadPosts("following")}
              >
                Following
              </button>
            </div>
          </div>

          {/* Posts Feed */}
          <div className="space-y-6">
            {loading && posts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cohere-accent mx-auto"></div>
                <p className="mt-4 text-gray-500 font-medium">Loading your feed...</p>
                <p className="text-gray-400 text-sm mt-2">This may take a moment</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto flex items-center justify-center">
                  {feedType === "following" ? (
                    <Users className="h-8 w-8 text-gray-400" />
                  ) : (
                    <FileText className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-700">No posts to show</h3>
                <p className="text-gray-500 mt-2">
                  {feedType === "following"
                    ? "The people you follow haven't posted anything yet. Try following more users or switch to All Posts."
                    : "Be the first to share something with the community!"}
                </p>
                {feedType === "following" && (
                  <button
                    onClick={() => loadPosts("all")}
                    className="mt-4 bg-cohere-accent hover:opacity-90 text-white py-2 px-4 rounded-md"
                  >
                    View All Posts
                  </button>
                )}
              </div>
            ) : (
              <>
                {posts.map((post) => (
                  <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-center mb-2">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                          {post.authorPic ? (
                            <img
                              src={post.authorPic || "/placeholder.svg"}
                              alt={post.authorName}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <User className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {post.authorId === currentUser.uid ? "You" : post.authorName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {post.timestamp ? new Date(post.timestamp.seconds * 1000).toLocaleString() : "Just now"}
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

                      {/* Post interactions component */}
                      <PostInteractions post={post} onUpdate={() => loadPosts(feedType)} />
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
