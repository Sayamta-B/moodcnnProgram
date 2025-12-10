import React, { useEffect, useState } from "react";

export default function SidebarRight() {
  const [spotifyConnected, setSpotifyConnected] = useState(false);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/spotify_status/", {
      credentials: "include", // important for Django session cookies
    })
      .then((res) => res.json())
      .then((data) => setSpotifyConnected(data.connected))
      .catch((err) => console.error(err));
  }, []);

  return (
    <aside className="w-1/4 bg-white p-2 shadow-md flex flex-col h-screen">
      {!spotifyConnected && (
        <button
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mb-2"
          onClick={() => (window.location.href = "http://127.0.0.1:8000/api/spotify_login/")}
        >
          Connect Spotify
        </button>
      )}

      {spotifyConnected && (
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
      )}
    </aside>
  );
}
