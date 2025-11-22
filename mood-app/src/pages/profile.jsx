// src/pages/profile.jsx
import React, { useState } from "react";
import PostCard from "../components/Postcard";
import ProfileInfo from "../components/ProfileInfo";
import ProfileNav from "../components/ProfileNav";
import PostPage from "./PostPage";

const posts = [
  { id: 1, username: "Alex", image: "https://picsum.photos/400/300?random=1" },
  { id: 2, username: "Alex", image: "https://picsum.photos/400/300?random=2" },
  { id: 3, username: "Alex", image: "https://picsum.photos/400/300?random=3" },
];

export default function Profile() {
  const [selectedPost, setSelectedPost] = useState(null);

  return (
    <div className="flex h-screen bg-gray-100">
      <main className="flex-1 overflow-y-auto p-5 space-y-6">
        <ProfileInfo />

        <ProfileNav />

        {/* Posts Grid */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          {posts.map((post) => (
            <img
              key={post.id}
              src={post.image}
              alt="post"
              className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-80"
              onClick={() => setSelectedPost(post)}
            />
          ))}
        </div>
      </main>

      {/* Floating Post Page */}
      {selectedPost && (
        <PostPage post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}
    </div>
  );
}
