"use client"

import { useState } from "react";
import { updatePost } from "../services/postService"; // Ensure this function exists and is exported
// Import icons if needed, e.g., from lucide-react

const EditPostModal = ({ post, onClose, onUpdate }) => {
  const [updatedText, setUpdatedText] = useState(post?.content || "");

  const handleSave = async () => {
    try {
      // Call the update API to edit the post
      const success = await updatePost(post.id, { content: updatedText.trim() });
      if (success) {
        onUpdate?.({ content: updatedText.trim() });
        onClose();
      }
    } catch (error) {
      console.error("Error saving updated post:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Edit Post</h2>
        <textarea
          className="w-full p-2 border rounded mb-4"
          value={updatedText}
          onChange={(e) => setUpdatedText(e.target.value)}
        />
        <div className="flex justify-end space-x-2">
          <button onClick={onClose} className="bg-gray-300 px-4 py-2 rounded">
            Cancel
          </button>
          <button onClick={handleSave} className="bg-blue-500 text-white px-4 py-2 rounded">
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPostModal;
