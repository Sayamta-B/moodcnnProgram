import { useState } from "react";

export default function JournalPage() {
  const [text, setText] = useState("");

  return (
    <div className="flex flex-col">
      <h2 className="text-xl font-bold mb-4">Write your journal</h2>
      <textarea
        className="border p-3 rounded-md h-96 resize-none"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write something..."
      />
    </div>
  );
}

// import SignatureCanvas from "react-signature-canvas";

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
