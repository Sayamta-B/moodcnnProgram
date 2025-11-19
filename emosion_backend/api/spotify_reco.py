import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
import logging

logger = logging.getLogger(__name__)

# Map moods to search queries
MOOD_QUERIES = {
    "happy": "happy",
    "sad": "sad",
    "neutral": "chill",
    "angry": "rock",
    "surprise": "pop",
}

# Initialize Spotify client with a timeout
sp = spotipy.Spotify(auth_manager=SpotifyClientCredentials(), requests_timeout=20)

def recommend_song_for_mood(mood: str):
    """
    Return a list of recommended tracks based on the given mood.
    Each track includes id, name, artists, album cover, Spotify URL, and preview URL.
    """
    query = MOOD_QUERIES.get(mood.lower(), "pop")
    
    try:
        results = sp.search(q=query, type="track", limit=30)
        tracks = results.get("tracks", {}).get("items", [])
    except Exception as e:
        logger.exception("Spotify search failed for mood '%s'", mood)
        return []

    # Take top 6 tracks
    filtered_tracks = tracks[:6]

    final_recs = []
    for track in filtered_tracks:
        spotify_id = track.get("id")
        name = track.get("name")
        artists = ", ".join([a.get("name") for a in track.get("artists", []) if a.get("name")])
        album_cover = track.get("album", {}).get("images", [{}])[0].get("url")
        spotify_url = track.get("external_urls", {}).get("spotify")
        preview_url = track.get("preview_url")

        final_recs.append({
            "spotify_id": spotify_id,
            "name": name,
            "artist": artists,
            "url": spotify_url,
            "preview_url": preview_url,
            "album_cover": album_cover
        })

    return final_recs
