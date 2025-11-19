import { useState } from "react";
import { useLocation } from "react-router-dom";

export default function JournalPage() {
  const location = useLocation();
const { selectedSongs: initSongs = [], userId = "", postId = "", imageUrl = "" } = location.state || {};
const [selectedSongs, setSelectedSongs] = useState(initSongs);

  const [text, setText] = useState("");
  const handleSaveTracks = async () => {
    if (selectedSongs.length === 0) {
      alert("Please select at least one song!");
      return;
    }

    const payload = {
      user_id: userId,
      post_id: postId,
      image: imageUrl,
      songs: selectedSongs.map((s) => ({
        spotify_id: s.spotify_id,
        name: s.title,
        artist: s.artist
      }))
    };

    try {
      const res = await fetch("http://127.0.0.1:8000/api/save_tracks/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      console.log("Tracks saved:", data);
      alert("Selected songs saved successfully!");
    } catch (err) {
      console.error("Error saving tracks:", err);
    }
  };
  return (
    <div className="flex flex-col">
      <h2 className="text-xl font-bold mb-4">Write your journal</h2>
      <textarea
        className="border p-3 rounded-md h-96 resize-none"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write something..."
      />

              <button
                onClick={handleSaveTracks}
                className="mb-4 bg-blue-500 hover:bg-blue-600 text-white px-12 py-2 rounded-xl"
              >
                Post
              </button>
    </div>
  );
}
//import SignatureCanvas from "react-signature-canvas";

// const JournalCanvas = () => {
//   const ref = useRef();

//   const saveDrawing = () => {
//     const img = ref.current.getTrimmedCanvas().toDataURL("image/png");
//     uploadToBackend(img); // send as file or base64
//   };

//   return (
//     <div>
//       <SignatureCanvas
//         penColor="black"
//         ref={ref}
//         canvasProps={{ width: 500, height: 300, className: "canvas" }}
//       />
//       <button onClick={saveDrawing}>Save</button>
//     </div>
//   );
// };


// import base64
// from django.core.files.base import ContentFile

// image_data = request.data.get("canvas_img")  # base64 string
// format, imgstr = image_data.split(';base64,')
// file_name = "drawing.png"
// post.journal_image.save(file_name, ContentFile(base64.b64decode(imgstr)), save=True)
