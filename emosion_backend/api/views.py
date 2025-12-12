# main/views.py
import os
import random
import string
import base64
from urllib.parse import urlencode
import requests
from django.shortcuts import redirect, render
from django.conf import settings
from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import generics, status
from django.contrib.auth import authenticate, login as django_login, logout as django_logout
from django.views.decorators.csrf import ensure_csrf_cookie
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.utils import timezone
from PIL import Image
import torch
import logging
import json

from .models import User, Post, Track, TrackFavorite
from .serializers import UserSerializer
from .mood_model import model, device, inference_transform, idx_to_class
from .spotify_reco import recommend_song_for_mood

logger = logging.getLogger(__name__)

# ===================== Helper Functions =====================

def generate_random_string(length=16):
    return ''.join(random.choice(string.ascii_letters + string.digits) for _ in range(length))

def get_spotify_client_credentials():
    client_id = os.environ.get('SPOTIPY_CLIENT_ID')
    client_secret = os.environ.get('SPOTIPY_CLIENT_SECRET')
    if not client_id or not client_secret:
        raise ValueError("Spotify credentials not set in environment variables")
    return client_id, client_secret

def refresh_spotify_token(request):
    refresh_token = request.session.get("spotify_refresh_token")
    if not refresh_token:
        return None
    client_id, client_secret = get_spotify_client_credentials()
    auth_header = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
    data = {"grant_type": "refresh_token", "refresh_token": refresh_token}
    headers = {"Authorization": f"Basic {auth_header}", "Content-Type": "application/x-www-form-urlencoded"}
    response = requests.post("https://accounts.spotify.com/api/token", data=urlencode(data), headers=headers)
    if response.status_code != 200:
        return None
    token_info = response.json()
    request.session['spotify_access_token'] = token_info['access_token']
    if 'refresh_token' in token_info:
        request.session['spotify_refresh_token'] = token_info['refresh_token']
    return token_info['access_token']

def spotify_api_get(request, endpoint, params=None):
    access_token = request.session.get('spotify_access_token')
    if not access_token:
        return None
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(f"https://api.spotify.com/v1/{endpoint}", headers=headers, params=params)
    if response.status_code == 401:  # token expired
        access_token = refresh_spotify_token(request)
        if not access_token:
            return None
        headers["Authorization"] = f"Bearer {access_token}"
        response = requests.get(f"https://api.spotify.com/v1/{endpoint}", headers=headers, params=params)
    if response.status_code != 200:
        return None
    return response.json()

# ===================== Spotify OAuth =====================

def spotify_login(request):
    state = generate_random_string()
    request.session['spotify_auth_state'] = state
    client_id, _ = get_spotify_client_credentials()
    scope = "user-top-read user-library-read playlist-read-private playlist-read-collaborative"
    redirect_uri = "http://127.0.0.1:8000/api/spotify_callback/"
    authorize_url = (
        f"https://accounts.spotify.com/authorize"
        f"?response_type=code"
        f"&client_id={client_id}"
        f"&scope={scope}"
        f"&redirect_uri={redirect_uri}"
        f"&state={state}"
        f"&show_dialog=true"
    )

    return redirect(authorize_url)

def spotify_callback(request):
    code = request.GET.get('code')
    state = request.GET.get('state')
    stored_state = request.session.get('spotify_auth_state')
    if state != stored_state:
        return JsonResponse({"error": "State mismatch"}, status=400)
    client_id, client_secret = get_spotify_client_credentials()
    token_url = "https://accounts.spotify.com/api/token"
    auth_header = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
    data = {"grant_type": "authorization_code", "code": code, "redirect_uri": "http://127.0.0.1:8000/api/spotify_callback/"}
    headers = {"Authorization": f"Basic {auth_header}", "Content-Type": "application/x-www-form-urlencoded"}
    response = requests.post(token_url, data=urlencode(data), headers=headers)
    if response.status_code != 200:
        return JsonResponse({"error": "Token request failed", "details": response.text}, status=400)
    token_info = response.json()
    request.session['spotify_access_token'] = token_info['access_token']
    request.session['spotify_refresh_token'] = token_info.get('refresh_token')
    request.session['spotify_connected'] = True
    return redirect("http://localhost:5173/")

def spotify_status(request):
    return JsonResponse({"connected": bool(request.session.get('spotify_connected', False))})

# ===================== Mood Detection & Recommendation =====================

@api_view(['POST'])
def predict(request):
    image = request.FILES.get("image")
    if not image:
        return Response({"error": "No image provided"}, status=400)
    try:
        timestamp = timezone.now().strftime("%Y%m%d_%H%M%S")
        safe_name = f"{timestamp}_{image.name}"
        saved_name = default_storage.save(f"uploads/{safe_name}", ContentFile(image.read()))
        image_url = default_storage.url(saved_name)
    except Exception:
        return Response({"error": "Image save failed"}, status=500)

    try:
        img = Image.open(image).convert("L")
    except Exception:
        img = Image.open(default_storage.open(saved_name)).convert("L")

    img_tensor = inference_transform(img).unsqueeze(0).to(device)
    with torch.no_grad():
        output = model(img_tensor)
        probs = torch.softmax(output, dim=1)
        pred_idx = torch.argmax(probs, dim=1).item()
        confidence = float(probs[0, pred_idx].cpu().item())
    mood = idx_to_class.get(pred_idx, "neutral")
    recommendations = recommend_song_for_mood(mood)
    return Response({"mood": mood, "confidence": confidence, "recommendations": recommendations, "image_url": image_url})

@api_view(['GET'])
def get_recommendation(request):
    mood = request.GET.get("mood")
    if not mood:
        return JsonResponse({"error": "Mood is required, example: /recommend_song_for_mood/?mood=happy"}, status=400)
    recommendations = recommend_song_for_mood(mood)
    return JsonResponse({"recommendations": recommendations})

# ===================== Post & Canvas =====================

@api_view(['POST'])
def create_post(request):
    data = request.data
    user_id = data.get("user_id")
    image_url = data.get("image")
    songs = data.get("songs", [])
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)
    post = Post.objects.create(user=user, image_path=image_url or "")
    saved_tracks = []
    for s in songs:
        spotify_id = s.get("spotify_id")
        if not spotify_id:
            continue
        track_obj, created = Track.objects.get_or_create(
            spotify_id=spotify_id,
            defaults={"name": s.get("name",""), "artists": s.get("artist",""), "album": s.get("album",""),
                      "duration_ms": s.get("duration_ms",0), "image_url": s.get("image_url",""), "genre": s.get("genre","")}
        )
        if not created:
            track_obj.name = s.get("name", track_obj.name)
            track_obj.artists = s.get("artist", track_obj.artists)
            track_obj.album = s.get("album", track_obj.album)
            track_obj.duration_ms = s.get("duration_ms", track_obj.duration_ms)
            track_obj.image_url = s.get("image_url", track_obj.image_url)
            track_obj.genre = s.get("genre", track_obj.genre)
            track_obj.save()
        post.track.add(track_obj)
        saved_tracks.append(track_obj.spotify_id)
    post.save()
    return Response({"post_id": post.id, "saved_tracks": saved_tracks}, status=201)

@api_view(['POST'])
def save_canvas(request):
    post_id = request.data.get("post_id")
    canvas_image = request.data.get("canvas_image")
    if not post_id or not canvas_image:
        return Response({"error": "Missing post_id or canvas_image"}, status=400)
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return Response({"error": "Post not found"}, status=404)
    format, imgstr = canvas_image.split(";base64,")
    ext = format.split("/")[-1]
    file_name = f"canvas_{post_id}.{ext}"
    post.canvas_image.save(file_name, ContentFile(base64.b64decode(imgstr)), save=True)
    return Response({"message": "Canvas saved successfully"})

# ===================== User Auth =====================

class RegisterView(generics.CreateAPIView):
    serializer_class = UserSerializer
    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({"message": "Registered successfully", "user": UserSerializer(user).data}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(["POST"])
def login_view(request):
    try:
        data = json.loads(request.body)
    except:
        return Response({"error": "Invalid JSON"}, status=400)
    email = data.get("email")
    password = data.get("password")
    if not email or not password:
        return Response({"error": "Email and password required"}, status=400)
    user = authenticate(request, email=email, password=password)
    if not user:
        return Response({"error": "Invalid credentials"}, status=401)
    django_login(request, user)
    request.session["user_id"] = user.id
    request.session["email"] = user.email
    request.session["logged_in"] = True
    if user.is_superuser:
        return Response({"user": UserSerializer(user).data, "redirect": "/admin/"}, status=200)
    return Response({"message": "Login successful", "user": UserSerializer(user).data}, status=200)

@api_view(["POST"])
def logout_view(request):
    if request.user.is_authenticated:
        django_logout(request)
        return Response({"detail": "Successfully logged out"}, status=200)
    return Response({"detail": "Already logged out"}, status=200)

@api_view(["GET"])
@ensure_csrf_cookie
def session_view(request):
    return Response({"is_authenticated": request.user.is_authenticated})

@api_view(["GET"])
def who_am_i(request):
    if not request.user.is_authenticated:
        return Response({"is_authenticated": False})
    return Response({"is_authenticated": True, "username": request.user.email})

# ===================== Mood / Playlist Tracks =====================
# -------------------- Home Top Tracks --------------------
@api_view(["GET"])
def home_top_tracks(request):
    """
    Fetches the user's top tracks from Spotify (limit 10).
    """
    data = spotify_api_get(request, "me/top/tracks", params={"limit": 10})
    if not data:
        return JsonResponse({"error": "Spotify not logged in or token expired"}, status=401)

    tracks = [{
        "name": t["name"],
        "artists": [a["name"] for a in t["artists"]],
        "preview_url": t["preview_url"],
        "url": t["external_urls"]["spotify"]
    } for t in data.get("items", [])]

    return JsonResponse({"tracks": tracks})


MOOD_PLAYLIST_MAP = {
    "happy": "37i9dQZF1DXdPec7aLTmlC",
    "neutral": "37i9dQZF1DX4WYpdgoIcn6",
    "sad": "37i9dQZF1DX7qK8ma5wgG1",
    "surprise": "37i9dQZF1DWVRSukIED0ZB",
}

def get_random_songs_from_playlist(request, playlist_id, count=5):
    access_token = request.session.get("spotify_access_token")
    if not access_token:
        return []
    headers = {"Authorization": f"Bearer {access_token}"}
    url = f"https://api.spotify.com/v1/playlists/{playlist_id}/tracks?limit=100"
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        return []
    items = response.json().get("items", [])
    tracks = [item.get("track") for item in items if item.get("track")]
    if not tracks:
        return []
    sampled_tracks = random.sample(tracks, min(count, len(tracks)))
    songs = []
    for track in sampled_tracks:
        artists = [a["name"] for a in track.get("artists", [])]
        album = track.get("album", {})
        songs.append({
            "name": track.get("name"),
            "artists": artists,
            "album_name": album.get("name","Unknown Album"),
            "album_image": album.get("images",[{}])[0].get("url",""),
            "duration_min": round(track.get("duration_ms",0)/60000,1),
            "url": track.get("external_urls",{}).get("spotify",""),
            "preview_url": track.get("preview_url"),
        })
    return songs

def mood_tracks(request, mood="happy", count=5):
    playlist_id = MOOD_PLAYLIST_MAP.get(mood.lower(), MOOD_PLAYLIST_MAP["happy"])
    songs = get_random_songs_from_playlist(request, playlist_id, count=count)
    return render(request, "main/mood_tracks.html", {"songs": songs, "mood": mood.capitalize()})

def profile_favorites(request):
    user_email = request.user.email
    fav_tracks = TrackFavorite.objects.filter(user_email=user_email)
    serialized = [{"name": t.track_name, "artists": t.artists, "preview_url": t.preview_url, "url": t.spotify_url} for t in fav_tracks]
    return JsonResponse({"tracks": serialized})


def debug_session(request):
    return JsonResponse({
        "session_key": request.session.session_key,
        "spotify_connected": request.session.get("spotify_connected"),
        "session_data": dict(request.session.items()),
        "cookies": request.COOKIES,
    })
