// src/components/profile-nav.jsx
import React, { useState } from "react";

export default function ProfileNav() {
  const [active, setActive] = useState("posts");
  return (
    <div className="flex justify-center mt-4 space-x-4 p-2 mt-4 bg-white">
      {["posts", "music", "dashboard"].map((tab) => (
        <button
          key={tab}
          className={`px-3 py-1 rounded-lg font-medium ${
            active === tab
              ? "bg-blue-500 text-black"
              : "text-gray-700 hover:text-black"
          }`}
          onClick={() => setActive(tab)}
        >
          {tab.charAt(0).toUpperCase() + tab.slice(1)}
        </button>
      ))}
    </div>
  );
}
