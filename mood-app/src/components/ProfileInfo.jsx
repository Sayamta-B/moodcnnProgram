// src/components/profile-info.jsx
import React from "react";

export default function ProfileInfo() {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md flex items-center space-x-4">
      <img
        src="https://i.pravatar.cc/100?img=5"
        alt="profile"
        className="w-16 h-16 rounded-full"
      />
      <div>
        <h2 className="text-xl font-bold">Alex</h2>
        <p className="text-gray-500">Bio or short description here</p>
      </div>
    </div>
  );
}
