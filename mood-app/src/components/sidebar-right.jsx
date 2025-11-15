import React from "react";

export default function SidebarRight() {
  return (
    <aside className="w-1.5/5 bg-white p-2 shadow-md flex flex-col h-screen">
      {/* <h2 className="text-lg font-semibold mb-4">🎵 Spotify Player</h2> */}
      <iframe
        className="rounded-xl flex-1"
        src="https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M"
        width="100%"
        height="380"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        title="Spotify Player"
      ></iframe>
    </aside>
  );
}
