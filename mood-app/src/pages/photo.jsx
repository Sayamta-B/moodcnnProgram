import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";


export default function Photo() {
  const [mood, setMood] = useState(null);
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [songs, setSongs] = useState([]);
  const [manualMood, setManualMood] = useState(""); 
  const navigate = useNavigate();

// --- Auto-detect mood whenever file or manualMood changes ---
  useEffect(() => {
  const detectMood = async () => {
      let detectedMood = manualMood;

      if (file) {
        const formData = new FormData();
        formData.append("image", file);

        try {
          const res = await fetch("http://127.0.0.1:8000/api/predict/", {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          setImageUrl(data.imageUrl);
          detectedMood = detectedMood || data.mood;
          setSongs(data.recommendations || []);
        } catch (err) {
          console.error("Error detecting mood:", err);
        }
      }

      // If only manual mood is selected or detected mood exists
      if (detectedMood && (!file || manualMood)) {
        try {
          const res = await fetch(
            `http://127.0.0.1:8000/api/recommend_song_for_mood/?mood=${detectedMood}/`
          );
          const recoData = await res.json();
          setSongs(recoData.recommendations || []);
        } catch (err) {
          console.error("Error fetching manual mood recommendations:", err);
        }
      }

      setMood(detectedMood);
    };

    detectMood();
  }, [file, manualMood]);// runs automatically on file or manualMood change


  
  return (
    <div className="flex min-h-screen bg-gray-50 p-6 gap-6">
      {/* Left: Upload + Preview */}
      <div className="w-3/5 flex flex-col items-center justify-center bg-white shadow-lg rounded-2xl pl-6 pr-6 pb-6 gap-4">
        <h3 className="text-2xl font-semibold mb-4 text-gray-700">
          Upload a Photo to Detect Mood
        </h3>

        {/* Image preview */}
        <div className="w-64 h-64 mb-4 border-2 border-dashed rounded-xl flex items-center justify-center bg-gray-100 overflow-hidden">
          {file ? (
            <img
              src={URL.createObjectURL(file)}
              alt="Selected"
              className="object-cover w-full h-full center"
            />
          ) : (
            <span className="text-gray-400">No photo selected</span>
          )}
        </div>

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files[0])}
          className="block w-full border rounded-lg p-1 mb-4"
        />

        <div>
          <h2 className="font-semibold mt-12 mb-2 text-xl text-center">Mood Info</h2>

          {/* Manual mood selection */}
          <div className="flex gap-6 mb-6 space-y-2">
            {["angry", "happy", "neutral", "sad", "surprise"].map((m) => (
              <label key={m} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="mood"
                  value={m}
                  checked={manualMood === m}
                  onChange={(e) => setManualMood(e.target.value)}
                />
                <span>
                  {
                    m === "angry"
                    ? "😡 Angry"
                    : m === "happy"
                    ? "😊 Happy"
                    : m === "neutral"
                    ? "😐 Neutral"
                    : m === "sad"
                    ? "😢 Sad"
                    : "😲 Surprise"}
                  </span>
              </label>
                      ))}
          </div>
        </div>
      </div>
      {/* Right: Mood Info */}
      <div className="w-2/5 rounded-2xl p-6 flex flex-col justify-between bg-white shadow-md">
        <div>
        {mood ? (
            <>
              <h2 className="text-2xl font-semibold text-blue-600 capitalize">
                Mood: {mood}
              </h2>
            </>
          ) : (
            <p className="text-gray-500">No mood detected yet.</p>
          )}
        </div>

        <button
          onClick={() => {
            if (!mood && !file) {
              alert("Please select a mood or upload a picture!");
              return;
            }

            navigate("/create/music", { 
              state: { 
                selectedMood: mood, 
                imageUrl: imageUrl,
                songs: songs
              } 
            });
          }}
          className="self-end px-4 py-2 bg-blue-500 hover:bg-blue-600 text-black rounded-xl transition"
        >
          Next →
        </button>

      </div>
    </div>
  );
}
