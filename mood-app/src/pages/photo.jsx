import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Photo() {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedMood, imageUrl: initialImage, songs: initialSongs = [], userId: initialUserId, postId: initialPostId } = location.state || {};

  const [userId] = useState(initialUserId || "");
  const [postId] = useState(initialPostId || "");
  if (!userId) return alert("Please log in first!");
  if (!postId) return alert("No post exists. Creating one...");

  const [mood, setMood] = useState(selectedMood || null);
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(initialImage || "");
  const [songs, setSongs] = useState(initialSongs);
  const [manualMood, setManualMood] = useState("");
  const [recommendedSongs, setRecommendedSongs] = useState(initialSongs.slice(0, 5));
  const [selectedSongs, setSelectedSongs] = useState([]);

  // Save/load from localStorage
  useEffect(() => {
    localStorage.setItem("selectedSongs", JSON.stringify(selectedSongs));
    localStorage.setItem("imageUrl", imageUrl);
  }, [selectedSongs, imageUrl]);

  useEffect(() => {
    const savedSongs = JSON.parse(localStorage.getItem("selectedSongs") || "[]");
    const savedImage = localStorage.getItem("imageUrl") || "";
    if (savedSongs.length) setSelectedSongs(savedSongs);
    if (savedImage) setImageUrl(savedImage);
  }, []);

  const handleToggleSong = (song) => {
    setSelectedSongs((prev) => {
      const exists = prev.some(s => s.spotify_id === song.spotify_id);
      const updated = exists ? prev.filter(s => s.spotify_id !== song.spotify_id) : [...prev, song];

      const selectedIds = new Set(updated.map(s => s.spotify_id));
      setRecommendedSongs(prevSongs => [
        ...prevSongs.filter(s => selectedIds.has(s.spotify_id)).sort(
          (a, b) => updated.findIndex(x => x.spotify_id === a.spotify_id) - updated.findIndex(x => x.spotify_id === b.spotify_id)
        ),
        ...prevSongs.filter(s => !selectedIds.has(s.spotify_id))
      ]);
      return updated;
    });
  };

  const getMoodFromFile = async (file) => {
    const formData = new FormData();
    formData.append("image", file);
    const res = await fetch("http://127.0.0.1:8000/api/predict/", { method: "POST", body: formData });
    const data = await res.json();
    setImageUrl(data.imageUrl);
    return data.mood;
  };

  const fetchRecommendations = async (mood) => {
    const res = await fetch(`http://127.0.0.1:8000/api/get_Recommendation/?mood=${mood}`);
    const data = await res.json();
    return data.recommendations || [];
  };

  // Detect mood
  useEffect(() => {
    const detectMood = async () => {
      const detectedMood = manualMood || (file ? await getMoodFromFile(file) : null);
      setMood(detectedMood);

      if (detectedMood) {
        const reco = await fetchRecommendations(detectedMood);
        setSongs(reco);
        setRecommendedSongs(reco.slice(0, 5));
      }
    };
    detectMood();
  }, [file, manualMood]);

  const currentSong = selectedSongs[selectedSongs.length - 1];
  const moods = { angry: "😡 Angry", happy: "😊 Happy", neutral: "😐 Neutral", sad: "😢 Sad", surprise: "😲 Surprise" };

  const handleNext = () => {
    if (!mood && !file) {
      alert("Please select a mood or upload a picture!");
      return;
    }
    if (selectedSongs.length === 0) {
      alert("Please select at least one song!");
      return;
    
    
    }
    navigate("/create/journal", {
      state: { selectedMood: mood, imageUrl, songs, selectedSongs, userId, postId }
    });
  };

  return (
    <div className="flex min-h-screen bg-gray-50 p-6 gap-6">
      {/* LEFT SIDE: Upload */}
      <div className="w-3/5 flex flex-col items-center bg-white shadow-lg rounded-2xl p-6 gap-4">
        <h3 className="text-2xl font-semibold text-gray-700">Upload a Photo to Detect Mood</h3>
        <div className="w-64 h-64 mb-4 border-2 border-dashed rounded-xl flex items-center justify-center bg-gray-100 overflow-hidden">
          {file ? <img src={URL.createObjectURL(file)} alt="Selected" className="object-cover w-full h-full" /> : <span className="text-gray-400">No photo selected</span>}
        </div>
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} className="block w-full border rounded-lg p-1 mb-4" />
        <h2 className="font-semibold mt-4 mb-2 text-xl text-center">Mood Info</h2>
        <div className="flex gap-6 mb-6">
          {Object.entries(moods).map(([key, label]) => (
            <label key={key} className="flex items-center space-x-1.5">
              <input type="radio" name="mood" value={key} checked={manualMood === key} onChange={(e) => setManualMood(e.target.value)} />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* RIGHT SIDE: Recommendations */}
      <div className="w-2/5 rounded-2xl p-6 flex flex-col justify-between bg-white shadow-md">
        {mood ? <h2 className="text-2xl font-semibold text-blue-600 capitalize">Mood: {mood}</h2> : <p className="text-gray-500">No mood detected yet.</p>}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {recommendedSongs.length ? recommendedSongs.map((song, i) => {
            const isSelected = selectedSongs.some(s => s.spotify_id === song.spotify_id);
            const rank = isSelected ? selectedSongs.findIndex(s => s.spotify_id === song.spotify_id) + 1 : null;
            return (
              <div key={i} className={`p-2 rounded-xl flex justify-between items-center transition-all duration-300 ${isSelected ? "scale-105 border-blue-400 bg-blue-50 shadow-lg" : "hover:bg-gray-100"}`}>
                <div className="flex items-center space-x-3">
                  <img src={song.album_cover} alt="" className="w-12 h-12 rounded-lg" />
                  <div>
                    <p className="font-semibold">{song.title}</p>
                    <p className="text-sm text-gray-500">{song.artist}</p>
                    {isSelected && <p className="text-xs text-blue-500">Selected #{rank}</p>}
                  </div>
                </div>
                <button onClick={() => handleToggleSong(song)} className={`px-4 py-1 rounded-lg font-medium transition ${isSelected ? "bg-blue-500 text-white" : "bg-gray-200"}`}>
                  {isSelected ? "Deselect" : "Select"}
                </button>
              </div>
            );
          }) : <p>No recommendations available.</p>}
        </div>

        <div className="mt-6 w-full bg-gray-100 rounded-xl p-4 text-center">
          <p className="font-semibold mb-2">Music Player</p>
          <audio controls className="w-full" src={currentSong?.preview_url || null}></audio>
          {currentSong ? <p className="mt-2 text-sm">🎵 Now playing: <strong>{currentSong.title}</strong> by {currentSong.artist}</p> : <p className="text-gray-400 text-sm mt-2">No song selected yet</p>}
        </div>

        <div className="flex gap-4 mt-4">
          <button onClick={handleNext} className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-xl">Next →</button>
        </div>
      </div>
    </div>
  );
}
