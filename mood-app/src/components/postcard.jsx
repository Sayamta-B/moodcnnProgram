import React from "react";
import { Heart, MessageCircle, Share2, MoreVertical } from "lucide-react";

export default function PostCard(props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 w-4/5 mx-auto">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <img
            src={props.post.userPhoto}
            alt="user"
            className="w-10 h-10 rounded-full"
          />
          <span className="font-semibold">{props.post.username}</span>
        </div>
        <MoreVertical size={18} className="text-gray-600" />
      </div>
      <img
        src={props.post.image}
        alt="post"
        className="w-full h-64 object-cover rounded-xl mb-3"
      />
      <div className="flex space-x-5 text-gray-600">
        <Heart className="cursor-pointer hover:text-red-500" />
        <MessageCircle className="cursor-pointer hover:text-blue-500" />
        <Share2 className="cursor-pointer hover:text-green-500" />
      </div>
    </div>
  );
}
