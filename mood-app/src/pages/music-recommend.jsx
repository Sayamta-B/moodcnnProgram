import { useState } from "react";
import { useLocation } from "react-router-dom";

export default function MusicRecommend() {
  const { selectedMood, imageUrl, songs = [], userId, postId } = useLocation().state || {};
  const [recommendedSongs, setRecommendedSongs] = useState(songs.slice(0, 5)); // limit 5 songs
  const [selectedSongs, setSelectedSongs] = useState([]); // multiple selection

  // ---- Select or deselect a song ----
  const handleToggleSong = (song) => {
    setSelectedSongs((prev) => {
      const alreadySelected = prev.find((s) => s.spotify_id === song.spotify_id);
      let updatedSelection;

      if (alreadySelected) {
        // remove from selection
        updatedSelection = prev.filter((s) => s.spotify_id !== song.spotify_id);
      } else {
        // add to selection
        updatedSelection = [...prev, song];
      }

      // reorder recommended songs: selected ones go to top, rest below
      setRecommendedSongs((prevSongs) => {
        const selectedSet = new Set(updatedSelection.map((s) => s.spotify_id));
        const selectedFirst = prevSongs
          .filter((s) => selectedSet.has(s.spotify_id))
          .sort(
            (a, b) =>
              updatedSelection.findIndex((x) => x.spotify_id === a.spotify_id) -
              updatedSelection.findIndex((x) => x.spotify_id === b.spotify_id)
          );
        const unselected = prevSongs.filter((s) => !selectedSet.has(s.spotify_id));
        return [...selectedFirst, ...unselected];
      });

      return updatedSelection;
    });
  };

  // ---- Save unselected songs ----
  const handleSaveTracks = async () => {
    const selectedIds = selectedSongs.map((s) => s.spotify_id);
    const unselected = recommendedSongs.filter(
      (s) => !selectedIds.includes(s.spotify_id)
    );

    const payload = {
      user_id: userId,
      post_id: postId,
      unselected_songs: unselected.map((s) => s.spotify_id),
    };

    try {
      const response = await fetch("http://127.0.0.1:8000/api/save-tracks/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      console.log("Tracks saved:", data);
      alert("Unselected songs saved successfully!");
    } catch (error) {
      console.error("Error saving tracks:", error);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 p-6 gap-6">
      {/* Left: Uploaded Photo + Music Player */}
      <div className="w-3/5 flex flex-col items-center justify-center bg-white shadow-lg rounded-2xl p-6">
        <h3 className="text-2xl font-semibold mb-4 text-gray-700">Uploaded Photo</h3>

        {/* Image preview */}
        <div className="w-64 h-64 mb-4 border-2 border-dashed rounded-xl flex items-center justify-center bg-gray-100 overflow-hidden">
          {imageUrl ? (
            <img src={imageUrl} alt="Uploaded" className="object-cover w-full h-full" />
          ) : (
            <span className="text-gray-400">No photo available</span>
          )}
        </div>

        {/* Music player */}
        <div className="mt-6 w-full bg-gray-100 rounded-xl p-4 flex flex-col items-center">
          <p className="font-semibold text-gray-700 mb-2">Music Player</p>
          {selectedSongs.length > 0 ? (
            <>
              <audio
                controls
                className="w-full"
                src={selectedSongs[selectedSongs.length - 1]?.preview_url || ""}
              >
                Your browser does not support the audio element.
              </audio>
              <p className="mt-2 text-gray-600 text-sm">
                🎵 Now playing:{" "}
                <strong>{selectedSongs[selectedSongs.length - 1]?.title}</strong> by{" "}
                {selectedSongs[selectedSongs.length - 1]?.artist}
              </p>
            </>
          ) : (
            <>
              <audio controls className="w-full" src="">
                Your browser does not support the audio element.
              </audio>
              <p className="mt-2 text-gray-400 text-sm">No song selected yet</p>
            </>
          )}
        </div>
      </div>

      {/* Right: Recommended Songs */}
      <div className="w-2/5 bg-white rounded-2xl shadow-md p-6 overflow-y-auto">
       {/* Save button */}
        <button
          onClick={handleSaveTracks}
          className="mb-6 ml-70 bg-blue-500 hover:bg-blue-600 text-black px-12 py-2 rounded-xl"
        >
          Post
        </button>

        <div className="space-y-4">
          {recommendedSongs.length > 0 ? (
            recommendedSongs.map((song, i) => {
              const isSelected = selectedSongs.some(
                (s) => s.spotify_id === song.spotify_id
              );
              const rank =
                isSelected &&
                selectedSongs.findIndex((s) => s.spotify_id === song.spotify_id) + 1;

              return (
                <div
                  key={i}
                  className={`border p-4 rounded-xl flex justify-between items-center transition-all duration-300 ${
                    isSelected
                      ? "scale-105 border-blue-400 bg-blue-50 shadow-lg"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <img src={song.album_cover} alt="" className="w-12 h-12 rounded-lg" />
                    <div>
                      <p className="font-semibold text-gray-700">{song.title}</p>
                      <p className="text-sm text-gray-500">{song.artist}</p>
                      {isSelected && (
                        <p className="text-xs text-blue-500 font-medium">
                          Selected #{rank}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleSong(song)}
                    className={`px-4 py-1 rounded-lg font-medium transition ${
                      isSelected
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                    }`}
                  >
                    {isSelected ? "Deselect" : "Select"}
                  </button>
                </div>
              );
            })
          ) : (
            <p className="text-gray-500">No recommendations available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
