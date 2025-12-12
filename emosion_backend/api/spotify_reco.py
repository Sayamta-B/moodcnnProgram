import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
import random
import logging

logger = logging.getLogger(__name__)

# Map moods to fixed Spotify playlists
MOOD_PLAYLISTS = {
    "happy": "4Fh0313D3PitYzICKHhZ7r",
    "sad": "6bZFgzFXEyI5B7dHQlYShJ",
    "neutral": "0k0WKMaoZs46MFTYHwZku5",
    "surprise": "0oxevpSGR2zITpujzwPCmj"
}

# Initialize Spotify client
sp = spotipy.Spotify(auth_manager=SpotifyClientCredentials(), requests_timeout=20)

def recommend_song_for_mood(mood: str, num_tracks: int = 6):
    """
    Return a list of recommended tracks based on the given mood.
    Each track includes id, name, artists, album cover, Spotify URL, and preview URL.
    """
    mood_lower = mood.lower()
    playlist_id = MOOD_PLAYLISTS.get(mood_lower)

    if not playlist_id:
        logger.warning("Mood '%s' not found. Defaulting to 'happy'.", mood)
        playlist_id = MOOD_PLAYLISTS["happy"]

    try:
        # Fetch all tracks from playlist
        results = sp.playlist_items(playlist_id, additional_types=['track'], limit=100)
        tracks = [item['track'] for item in results['items'] if item.get('track')]
    except Exception as e:
        logger.exception("Failed to fetch playlist tracks for mood '%s'", mood)
        return []

    if not tracks:
        logger.warning("No tracks found in playlist '%s'", playlist_id)
        return []

    # Randomly pick `num_tracks` without repeats
    sampled_tracks = random.sample(tracks, min(num_tracks, len(tracks)))

    final_recs = []
    for track in sampled_tracks:
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

# Example usage:
if __name__ == "__main__":
    mood = "surprise"
    songs = recommend_song_for_mood(mood)
    for s in songs:
        print(s["name"], "-", s["artist"], "-", s["url"])
