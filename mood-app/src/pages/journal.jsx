import { useLocation } from "react-router-dom";
import { useRef } from "react";
import SignatureCanvas from "react-signature-canvas";

export default function JournalPage() {
  const location = useLocation();
  const { userId = "", postId = "" } = location.state || {};
  const canvasRef = useRef(null);

  const handleSaveCanvas = async () => {
    if (!canvasRef.current || canvasRef.current.isEmpty()) {
      alert("Please draw something before posting!");
      return;
    }

    if (!postId) {
      alert("Missing postId, cannot save canvas.");
      return;
    }

    const canvasImage = canvasRef.current.getCanvas().toDataURL("image/png");

    const payload = { user_id: userId, post_id: postId, canvas_image: canvasImage };

    try {
      const res = await fetch("http://127.0.0.1:8000/api/save_canvas/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      console.log("Canvas saved:", data);
      alert("Canvas saved successfully!");
    } catch (err) {
      console.error("Error saving canvas:", err);
    }
  };


  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold">Draw your journal</h2>

      <SignatureCanvas
        ref={canvasRef}
        penColor="black"
        canvasProps={{
          width: 600,
          height: 250,
          className: "border rounded-lg shadow-md bg-white",
        }}
      />

      <button
        onClick={handleSaveCanvas}
        className="mb-4 bg-blue-500 hover:bg-blue-600 text-white px-12 py-2 rounded-xl"
      >
        Post
      </button>
    </div>
  );
}
