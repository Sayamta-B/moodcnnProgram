// src/pages/post-page.jsx
import React from "react";

export default function PostPage({ post, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-4 w-2/3 max-w-2xl relative">
        <button
          className="absolute top-2 right-2 text-gray-600 hover:text-black"
          onClick={onClose}
        >
          ✕
        </button>
        <img
          src={post.image}
          alt="post"
          className="w-full h-96 object-cover rounded-lg"
        />
        <div className="mt-3 flex items-center justify-between">
          <div className="flex space-x-4">
            <button className="text-red-500 hover:text-red-600">❤️ Like</button>
            <button className="text-blue-500 hover:text-blue-600">
              💬 Comment
            </button>
          </div>
          <audio controls className="w-1/3">
            <source src="/path-to-music.mp3" type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        </div>
      </div>
    </div>
  );
}
