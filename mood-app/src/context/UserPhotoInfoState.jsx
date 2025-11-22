import { useState, useEffect } from "react"; 
import UserPhotoInfoContext from "./UserPhotoInfoContext";

export default function UserPhotoInfoState({ children }) {

    const [userId, setUserId] = useState("");
    const [postId, setPostId] = useState("");
    const [mood, setMood] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [songs, setSongs] = useState([]);
    const [selectedSongs, setSelectedSongs] = useState([]);
    const [recommendedSongs, setRecommendedSongs] = useState([]);
    const [file, setFile] = useState(null);
    const [manualMood, setManualMood] = useState("");

    // Load IDs from localStorage on mount
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const storedPostId = localStorage.getItem("postId"); // you need to save postId when creating a post
    if (storedUser) setUserId(storedUser.id);
    if (storedPostId) setPostId(storedPostId);
  }, []);

    return (
        <UserPhotoInfoContext.Provider
            value={{
                userId, setUserId,
                postId, setPostId,
                mood, setMood,
                imageUrl, setImageUrl,
                songs, setSongs,
                selectedSongs, setSelectedSongs,
                recommendedSongs, setRecommendedSongs,
                file, setFile,
                manualMood, setManualMood
            }}
        >
            {children}
        </UserPhotoInfoContext.Provider>
    );
}
