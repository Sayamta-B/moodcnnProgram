import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
import logging
from django.http import JsonResponse

logger = logging.getLogger(__name__)

# Map moods to search queries
mood_queries = {
    "happy": "happy",
    "sad": "sad",
    "neutral": "chill",
    "angry": "rock",
    "surprise": "pop",
}

# Initialize Spotify client
sp = spotipy.Spotify(auth_manager=SpotifyClientCredentials())

def recommend_song_for_mood(mood: str):
    query = mood_queries.get(mood.lower(), "pop")
    try:
        results = sp.search(q=query, type="track", limit=30)
        tracks = results.get("tracks", {}).get("items", [])
    except Exception as e:
        logger.exception("Spotify search failed")
        return []

    filtered_tracks = tracks[:6] if tracks else []

    final_recs = []
    for t in filtered_tracks:
        tid = t.get("id")
        name = t.get("name")
        artists = ", ".join([a.get("name") for a in t.get("artists", []) if a.get("name")])
        album_cover = t.get("album", {}).get("images", [{}])[0].get("url")
        
        final_recs.append({
            "spotify_id": tid,
            "title": name,
            "artist": artists,
            "url": t.get("external_urls", {}).get("spotify"),
            "preview_url": t.get("preview_url"),
            "album_cover": album_cover
        })
    return final_recs
