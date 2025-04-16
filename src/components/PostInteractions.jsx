"use client"

import { useState, useEffect, useRef } from "react"
import { Heart, MessageSquare, Share2, Trash2, Edit2, Send } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { likePost, unlikePost, checkUserLikedPost } from "../services/likeService"
import { createComment, getPostComments, deleteComment, editComment } from "../services/commentService"
import { getUserById } from "../services/userService"
import { deletePost } from "../services/postService"
import DeleteConfirmationDialog from "../components/DeleteConfirmationDialog"
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import EditPostModal from "../components/EditPostModal";

export default function PostInteractions({ post, onUpdate }) {
  const { currentUser, isAdmin } = useAuth()
  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(post.likesCount || 0)
  const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState([])
  const [commentsWithUsers, setCommentsWithUsers] = useState([])
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [commentLoading, setCommentLoading] = useState(false)
  const [editingComment, setEditingComment] = useState(null)
  const [editText, setEditText] = useState("")
  const commentInputRef = useRef(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
const [editingPost, setEditingPost] = useState(null);


  useEffect(() => {
    if (currentUser && post.id) {
      checkLikeStatus()
    }
  }, [currentUser, post.id])

  useEffect(() => {
    // Update counts if post prop changes
    setLikesCount(post.likesCount || 0)
    setCommentsCount(post.commentsCount || 0)
  }, [post.likesCount, post.commentsCount])

  useEffect(() => {
    // Load user data for comments when comments change
    if (comments.length > 0) {
      loadUserDataForComments()
    }
  }, [comments])
  const validateSession = () => {
  const storedUser = JSON.parse(localStorage.getItem("user"));
  if (!storedUser?.uid || storedUser.uid !== currentUser?.uid) {
    logout();
    navigate("/login");
  }
};
  const handleDeleteConfirmed = async () => {
    setShowDeleteDialog(false);
    try {
      const success = await deletePost(post.id);
      
      if (success) {
        // Successful deletion handling
        if (onUpdate) {
          onUpdate({ 
            deletedPostId: post.id,
            deletionType: "user" // or "admin" based on your logic
          });
        }
        
        // Show success feedback
        toast.success("Post was successfully removed", {
          icon: "🗑️",
          autoClose: 2000
        });
      } else {
        // Authorization failure handling
        toast.error("You don't have permission to delete this post", {
          icon: "⚠️",
          autoClose: 3000
        });
        
        // Log detailed error for debugging
        console.warn("Delete failed - possible authorization issue", {
          postId: post.id,
          currentUser: JSON.parse(localStorage.getItem("user"))
        });
      }
    } catch (error) {
      // Network/server error handling
      console.error("Delete operation failed:", {
        error,
        postId: post.id
      });
      
      toast.error("Failed to delete post. Please try again.", {
        icon: "❌",
        autoClose: 4000
      });
    }
  };
  const loadUserDataForComments = async () => {
    try {
      const commentsWithUserData = await Promise.all(
        comments.map(async (comment) => {
          const userData = await getUserById(comment.userId)
          return {
            ...comment,
            user: userData || { username: "Unknown User" },
          }
        }),
      )
      setCommentsWithUsers(commentsWithUserData)
    } catch (error) {
      console.error("Error loading user data for comments:", error)
    }
  }
  
  // In PostInteractions.jsx props
  const handleDeleteInitiated = () => {
    setShowDeleteDialog(true);
  };
  const checkLikeStatus = async () => {
    try {
      if (!currentUser || isAdmin) return

      const isLiked = await checkUserLikedPost(currentUser.uid, post.id)
      setLiked(isLiked)
    } catch (error) {
      console.error("Error checking like status:", error)
    }
  }

  const handleLikeToggle = async () => {
    if (!currentUser || isAdmin) return

    try {
      setLoading(true)

      if (liked) {
        const result = await unlikePost(currentUser.uid, post.id)
        if (result.success) {
          setLiked(false)
          setLikesCount((prev) => Math.max(prev - 1, 0))
        }
      } else {
        const result = await likePost(currentUser.uid, post.id)
        if (result.success) {
          setLiked(true)
          setLikesCount((prev) => prev + 1)
        }
      }

      // Notify parent component of the update
      if (onUpdate) onUpdate()

      setLoading(false)
    } catch (error) {
      console.error("Error toggling like:", error)
      setLoading(false)
    }
  }

  const handleCommentToggle = async () => {
    setShowComments(!showComments)

    if (!showComments && comments.length === 0) {
      try {
        setCommentLoading(true)
        const postComments = await getPostComments(post.id)
        setComments(postComments)
        setCommentLoading(false)
      } catch (error) {
        console.error("Error loading comments:", error)
        setCommentLoading(false)
      }
    }

    // Focus the comment input when opening comments
    if (!showComments && commentInputRef.current) {
      setTimeout(() => {
        commentInputRef.current.focus()
      }, 100)
    }
  }

  const handleAddComment = async (e) => {
    e.preventDefault()

    if (!currentUser || !newComment.trim() || isAdmin) return

    try {
      setCommentLoading(true)

      const result = await createComment({
        postId: post.id,
        userId: currentUser.uid,
        content: newComment,
      })

      if (result.success) {
        // Add the new comment to the list
        const userData = await getUserById(currentUser.uid)

        const commentObj = {
          id: result.commentId,
          postId: post.id,
          userId: currentUser.uid,
          content: newComment,
          createdAt: new Date(),
          isDeleted: false,
        }

        setComments([...comments, commentObj])
        setCommentsWithUsers([
          ...commentsWithUsers,
          {
            ...commentObj,
            user: userData || { username: currentUser.displayName || currentUser.email.split("@")[0] },
          },
        ])
        setCommentsCount((prev) => prev + 1)
        setNewComment("")

        // Notify parent component of the update
        if (onUpdate) onUpdate()
      }

      setCommentLoading(false)
    } catch (error) {
      console.error("Error adding comment:", error)
      setCommentLoading(false)
    }
  }

  // Handle edit post
  const openEditModal = (post) => {
    console.log("openEditModal called");
    setEditingPost(post);
    setEditModalOpen(true);
  };
  
  // Handle delete post
  const handleDelete = async (postId) => {
    if (!currentUser) return;
  
    try {
      setLoading(true);
      const success = await deletePost(postId);
  
      if (success) {
        // Notify parent component of deletion
        if (onUpdate) onUpdate({ deletedPostId: postId });
  
        // Redirect if on post page
        if (window.location.pathname.includes("/post/")) {
          window.location.href = "/dashboard";
        }
      }
    } catch (error) {
      console.error("Error deleting post:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!currentUser) return

    try {
      setCommentLoading(true)

      const success = await deleteComment(commentId)

      if (success) {
        // Remove the comment from the list
        setComments(comments.filter((comment) => comment.id !== commentId))
        setCommentsWithUsers(commentsWithUsers.filter((comment) => comment.id !== commentId))
        setCommentsCount((prev) => Math.max(prev - 1, 0))

        // Notify parent component of the update
        if (onUpdate) onUpdate()
      }

      setCommentLoading(false)
    } catch (error) {
      console.error("Error deleting comment:", error)
      setCommentLoading(false)
    }
  }

  const handleEditComment = (comment) => {
    setEditingComment(comment.id)
    setEditText(comment.content)

    // Focus the edit input after setting it up
    setTimeout(() => {
      const editInput = document.getElementById(`edit-comment-${comment.id}`)
      if (editInput) editInput.focus()
    }, 10)
  }

  const handleSaveEdit = async (commentId) => {
    if (!editText.trim()) return

    try {
      setCommentLoading(true)

      const success = await editComment(commentId, editText)

      if (success) {
        // Update comment in lists
        setComments(comments.map((c) => (c.id === commentId ? { ...c, content: editText, editedAt: new Date() } : c)))

        setCommentsWithUsers(
          commentsWithUsers.map((c) => (c.id === commentId ? { ...c, content: editText, editedAt: new Date() } : c)),
        )

        setEditingComment(null)
        setEditText("")
      }

      setCommentLoading(false)
    } catch (error) {
      console.error("Error editing comment:", error)
      setCommentLoading(false)
    }
  }

  const cancelEdit = () => {
    setEditingComment(null)
    setEditText("")
  }

  return (
<div className="mt-4 pt-4 border-t border-gray-200">
  <div className="flex items-center justify-between flex-wrap gap-3 text-sm font-medium text-gray-500">
    {/* Like */}
    <button
      onClick={handleLikeToggle}
      disabled={loading || isAdmin}
      className={`flex items-center gap-1 transition-colors duration-200 ${
        liked ? "text-red-500" : "hover:text-red-500"
      }`}
    >
      <Heart className={`h-5 w-5 ${liked ? "fill-current" : ""} ${loading ? "animate-pulse" : ""}`} />
      <span>{likesCount}</span>
    </button>

    {/* Comment */}
    <button
      onClick={handleCommentToggle}
      className="flex items-center gap-1 hover:text-cohere-accent transition-colors duration-200"
    >
      <MessageSquare className="h-5 w-5" />
      <span>{commentsCount}</span>
    </button>

    {/* Share */}
    <button className="flex items-center gap-1 hover:text-cohere-accent transition-colors duration-200">
      <Share2 className="h-5 w-5" />
      <span>Share</span>
    </button>

    {/* Edit */}
    {currentUser?.uid === post.authorId && (
      <button
        onClick={() => openEditModal(post)}
        className="flex items-center gap-1 text-blue-500 hover:text-blue-700 transition-colors duration-200"
        aria-label="Edit post"
      >
        <Edit2 className="h-5 w-5" />
        <span>Edit</span>
      </button>
    )}

    {/* Delete */}
    {currentUser?.uid === post.authorId && (
      <button
        onClick={() => setShowDeleteDialog(true)}
        className="flex items-center gap-1 text-red-500 hover:text-red-700 transition-colors duration-200"
        aria-label="Delete post"
      >
        <Trash2 className="h-5 w-5" />
        <span>Delete</span>
      </button>
    )}


  {/* Delete Dialog */}
  <DeleteConfirmationDialog
    isOpen={showDeleteDialog}
    onConfirm={handleDeleteConfirmed}
    onCancel={() => setShowDeleteDialog(false)}
    title="Delete Post"
    message="This action is permanent and cannot be undone. Are you absolutely sure you want to delete this post? This will erase all its likes, comments, and visibility forever."
    confirmText="Yes, Delete Permanently"
    cancelText="Cancel"
    className="text-sm"
  />
</div>


      {/* Comments section - hidden by default */}
      {showComments && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          {commentLoading && comments.length === 0 ? (
            <div className="flex flex-col items-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cohere-accent"></div>
              <p className="text-xs text-gray-500 mt-2">Loading comments...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-sm text-gray-500">No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {commentsWithUsers.map((comment) => (
                <div key={comment.id} className="flex items-start gap-2">
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                    {comment.user?.profilePic ? (
                      <img
                        src={comment.user.profilePic || "/placeholder.svg"}
                        alt={comment.user.username}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-500">
                          {comment.user?.username?.charAt(0).toUpperCase() || "U"}
                        </span>
                      </div>
                    )}
                  </div>

                  {editingComment === comment.id ? (
                    <div className="flex-1 bg-gray-50 rounded-lg p-2">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-xs font-medium">{comment.user?.username || "User"}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          id={`edit-comment-${comment.id}`}
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-cohere-accent"
                        />
                        <button
                          onClick={() => handleSaveEdit(comment.id)}
                          className="p-1 text-white bg-cohere-accent rounded-full hover:bg-opacity-90"
                          disabled={!editText.trim() || commentLoading}
                        >
                          <Send className="h-3 w-3" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1 text-white bg-gray-400 rounded-full hover:bg-opacity-90"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 bg-gray-50 rounded-lg p-2">
                      <div className="flex justify-between items-start">
                        <p className="text-xs font-medium">{comment.user?.username || "User"}</p>
                        {currentUser && (
                          <div className="flex gap-1">
                            {currentUser.uid === comment.userId && (
                              <button
                                onClick={() => handleEditComment(comment)}
                                className="text-gray-400 hover:text-cohere-accent"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                            )}
                            {(currentUser.uid === comment.userId || post.authorId === currentUser.uid || isAdmin) && (
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-gray-400 hover:text-red-500"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <p className="text-sm">{comment.content}</p>
                      {comment.editedAt && <p className="text-xs text-gray-400 mt-1">(edited)</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add comment form */}
          {currentUser && !isAdmin && (
            <form onSubmit={handleAddComment} className="mt-3 flex gap-2">
              <input
                ref={commentInputRef}
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-cohere-accent"
              />
              <button
                type="submit"
                disabled={!newComment.trim() || commentLoading}
                className="px-3 py-1 text-xs bg-cohere-accent text-white rounded-full disabled:opacity-50 hover:bg-opacity-90 transition-opacity duration-200"
              >
                Post
              </button>
            </form>
          )}
    {showEditModal && (
  <EditPostModal 
    post={post}
    onClose={() => setShowEditModal(false)}
    onUpdate={(updatedPost) => {
      // Update local state with updated post content
      setPost({
        ...post,
        content: updatedPost.content,
        imageUrl: updatedPost.imageUrl,
        isEdited: true,
        editTimestamp: new Date(),
      });
      setShowEditModal(false);
      console.log("Post updated via modal:", updatedPost);
    }}
  />
)}
{isEditModalOpen && editingPost && (
  <EditPostModal
    post={editingPost}
    onClose={() => setEditModalOpen(false)}
    onUpdate={(updatedData) => {
      setPost((prevPost) => ({ ...prevPost, ...updatedData }));
      console.log("Post updated via modal:", updatedData);
      setEditModalOpen(false);
    }}
  />
)}
        </div>
      )}
    </div>
  )
}
