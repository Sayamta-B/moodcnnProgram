import { useContext, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import UserPhotoInfoContext from "../context/UserPhotoInfoContext";

export default function Photo() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    mood, setMood,
    file, setFile,
    imageUrl, setImageUrl,
    songs, setSongs,
    selectedSongs, setSelectedSongs,
    recommendedSongs, setRecommendedSongs,
    manualMood, setManualMood,
    userId, setUserId,
    postId, setPostId
  } = useContext(UserPhotoInfoContext);

  // ----------------- Helpers -----------------

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    return parts.length === 2 ? parts.pop().split(";").shift() : null;
  };

  const reorderRecommendations = (updatedSelected) => {
    const selectedIds = new Set(updatedSelected.map(s => s.spotify_id));

    const sortedSelected = updatedSelected.map(
      s => songs.find(x => x.spotify_id === s.spotify_id)
    );

    const unselected = songs.filter(s => !selectedIds.has(s.spotify_id));

    setRecommendedSongs([...sortedSelected, ...unselected]);
  };

  // ----------------- Load navigation state (first render only) -----------------

  useEffect(() => {
    if (!location.state) return;

    const { userId: uid, postId: pid, selectedMood, songs: navSongs, imageUrl: navImg } = location.state;

    if (uid) setUserId(uid);
    if (pid) setPostId(pid);
    if (selectedMood) setMood(selectedMood);
    if (navSongs) {
      setSongs(navSongs);
      setRecommendedSongs(navSongs);
    }
    if (navImg) setImageUrl(navImg);
  }, []);

  // ----------------- Song Select / Deselect -----------------

  const handleToggleSong = (song) => {
    const exists = selectedSongs.some(s => s.spotify_id === song.spotify_id);

    const updated = exists
      ? selectedSongs.filter(s => s.spotify_id !== song.spotify_id)
      : [...selectedSongs, song];

    setSelectedSongs(updated);
    reorderRecommendations(updated);
  };

  // ----------------- Mood Detection -----------------

  const getMoodFromFile = async (file) => {
      function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(";").shift();
      }

      const csrftoken = getCookie("csrftoken");
      console.log("CSRF token:", csrftoken);

      
    if (!file) return null;

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("http://127.0.0.1:8000/api/predict/", {
        method: "POST",
        credentials: "include",
        headers: {
          // "Content-Type": "application/json",
          "X-CSRFToken": csrftoken,
        },
        body: formData
      });

      const data = await res.json();

      setImageUrl(data.image_url ?? null);
      return data.mood ?? null;
    } catch (err) {
      console.error("Mood detection failed:", err);
      return null;
    }
  };

  const fetchRecommendations = async (moodValue) => {
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/get_recommendation/?mood=${moodValue}`,
        { credentials: "include" }
      );

      const data = await res.json();
      return data.recommendations ?? [];
    } catch (err) {
      console.error("Recommendation fetch failed:", err);
      return [];
    }
  };

  useEffect(() => {
    const detectMood = async () => {
      if (!file && !manualMood) return;

      const detectedMood = manualMood || (await getMoodFromFile(file));
      if (!detectedMood) return;

      setMood(detectedMood);

      const recos = await fetchRecommendations(detectedMood);
      setSongs(recos);
      setRecommendedSongs(recos.slice(0, 5));
    };

    detectMood();
  }, [file, manualMood]);

  // ----------------- Next Button -----------------

  const handleNext = async () => {
    if (!mood && !file) return alert("Please select a mood or upload an image!");
    if (!selectedSongs.length) return alert("Please select at least one song!");

    try {
      await fetch("http://127.0.0.1:8000/api/session/", { credentials: "include" });
      const csrfToken = getCookie("csrftoken");

      const res = await fetch("http://127.0.0.1:8000/api/create_post/", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify({
          image: imageUrl || null,
          songs: selectedSongs.map(s => ({
            spotify_id: s.spotify_id,
            name: s.title,
            artist: s.artist,
            album: s.album?.name ?? "",
            image_url: s.album_cover,
            duration_ms: s.duration_ms,
            genre: s.genre
          }))
        })
      });

      const data = await res.json();

      if (!data.post_id) return alert("haahaFailed to create post!");

      setPostId(data.post_id);
      navigate("/create/journal", {
        state: {
          postId: data.post_id,
          selectedSongs,
          imageUrl
        }
      });
    } catch (err) {
      console.error(err);
      alert("Failed to create post");
    }
  };

  // ----------------- UI Rendering -----------------

  const currentSong = selectedSongs[selectedSongs.length - 1];
  const moods = {
    angry: "😡 Angry",
    happy: "😊 Happy",
    neutral: "😐 Neutral",
    sad: "😢 Sad",
    surprise: "😲 Surprise",
  };

  return (
    <div className="flex min-h-screen bg-gray-50 p-6 gap-6">
      {/* LEFT SECTION */}
      <div className="w-3/5 flex flex-col items-center bg-white shadow-lg rounded-2xl p-6 gap-4">
        <h3 className="text-2xl font-semibold text-gray-700">
          Upload a Photo to Detect Mood
        </h3>

        <div className="w-64 h-64 border-2 border-dashed rounded-xl flex items-center justify-center bg-gray-100 overflow-hidden">
          {file ? (
            <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
          ) : (
            <span className="text-gray-400">No photo selected</span>
          )}
        </div>

        <input
          type="file"
          accept="image/*"
          className="w-full border rounded-lg p-1"
          onChange={(e) => setFile(e.target.files[0])}
        />

        <h2 className="text-xl font-semibold mt-4 mb-2">Mood Info</h2>
        <div className="flex gap-6">
          {Object.entries(moods).map(([key, label]) => (
            <label key={key} className="flex items-center space-x-2">
              <input
                type="radio"
                name="mood"
                value={key}
                checked={manualMood === key}
                onChange={(e) => setManualMood(e.target.value)}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* RIGHT SECTION */}
      <div className="w-2/5 flex flex-col justify-between bg-white shadow-md rounded-2xl p-6">
        {mood ? (
          <h2 className="text-2xl font-semibold text-blue-600 capitalize">Mood: {mood}</h2>
        ) : (
          <p className="text-gray-500">No mood detected yet.</p>
        )}

        <div className="max-h-[400px] overflow-y-auto space-y-2">
          {recommendedSongs.length ? (
            recommendedSongs.map((song) => {
              const isSelected = selectedSongs.some(s => s.spotify_id === song.spotify_id);
              const rank =
                isSelected && selectedSongs.findIndex(s => s.spotify_id === song.spotify_id) + 1;

              return (
                <div
                  key={song.spotify_id}
                  className={`flex justify-between items-center p-2 rounded-xl transition-all ${
                    isSelected ? "scale-105 bg-blue-50 border-blue-400 shadow-lg" : "hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={song.album_cover}
                      className="w-12 h-12 rounded-lg"
                    />
                    <div>
                      <p className="font-semibold">{song.title}</p>
                      <p className="text-sm text-gray-500">{song.artist}</p>
                      {rank && <p className="text-xs text-blue-500">Selected #{rank}</p>}
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleSong(song)}
                    className={`px-4 py-1 rounded-lg font-medium ${
                      isSelected ? "bg-blue-500 text-white" : "bg-gray-200"
                    }`}
                  >
                    {isSelected ? "Deselect" : "Select"}
                  </button>
                </div>
              );
            })
          ) : (
            <p>No recommendations available.</p>
          )}
        </div>

        {/* Player */}
        <div className="bg-gray-100 rounded-xl p-4 text-center mt-6">
          <p className="font-semibold mb-2">Music Player</p>

          {currentSong ? (
            <>
              <iframe
                title="Spotify Player"
                src={`https://open.spotify.com/embed/track/${currentSong.spotify_id}`}
                height="80"
                width="100%"
                frameBorder="0"
                allow="encrypted-media"
              />
              <p className="mt-2 text-sm">
                🎵 Now playing: <strong>{currentSong.title}</strong> by {currentSong.artist}
              </p>
            </>
          ) : (
            <p className="text-gray-400 text-sm">No song selected</p>
          )}
        </div>

        <button
          onClick={handleNext}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-xl mt-6"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
