// src/pages/MyPosts.jsx
import React, { useEffect, useState } from "react";
import { getPostsByUser } from "../services/postService";
import { useAuth } from "../contexts/AuthContext";

const MyPosts = () => {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchMyPosts = async () => {
      if (currentUser) {
        const myPosts = await getPostsByUser(currentUser.uid);
        setPosts(myPosts);
      }
    };
    fetchMyPosts();
  }, [currentUser]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">My Posts</h1>
      {posts.length === 0 ? (
        <p>No posts yet.</p>
      ) : (
        posts.map((post) => (
          <div key={post.id} className="border p-4 mb-2 rounded shadow-sm">
            <p>{post.text}</p>
            <p className="text-sm text-gray-500">{new Date(post.createdAt?.toDate()).toLocaleString()}</p>
          </div>
        ))
      )}
    </div>
  );
};

export default MyPosts;
