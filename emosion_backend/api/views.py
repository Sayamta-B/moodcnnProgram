from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import generics, status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.utils import timezone
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from PIL import Image
import torch

import json
from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_POST

from .models import User, Post, Track
from .serializers import UserSerializer
from .mood_model import model, device, inference_transform, idx_to_class
from .spotify_reco import recommend_song_for_mood


import logging

logger = logging.getLogger(__name__)

# --- Mood Prediction ---
@api_view(['POST'])
def predict(request):
    image = request.FILES.get("image")
    if not image:
        return Response({"error": "No image provided"}, status=400)

    # Save image
    try:
        timestamp = timezone.now().strftime("%Y%m%d_%H%M%S")
        safe_name = f"{timestamp}_{image.name}"
        saved_name = default_storage.save(f"uploads/{safe_name}", ContentFile(image.read()))
        image_url = default_storage.url(saved_name)
    except Exception as e:
        logger.exception("Failed to save uploaded image")
        return Response({"error": "Image save failed"}, status=500)

    # Prepare input tensor
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

    return Response({
        "mood": mood,
        "confidence": confidence,
        "recommendations": recommendations,
        "image_url":image_url
    })


def get_Recommendation(request):
    mood = request.GET.get("mood")  # ?mood=happy

    if not mood:
        return JsonResponse(
            {"error": "Mood is required, example: /recommend_song_for_mood/?mood=happy"},
            status=400
        )
    print(mood)

    recommendations = recommend_song_for_mood(mood)
    return JsonResponse({"recommendations": recommendations})


@api_view(['POST'])
def create_post(request):
    """
    Create a new Post with optional image and tracks.
    Expects JSON:
    {
        "user_id": int,
        "image": str (optional),
        "songs": [{
            spotify_id, name, artist, album, image_url, duration_ms, genre
        }]
    }
    Returns: { "post_id": int, "saved_tracks": [spotify_id] }
    """
    data = request.data
    user_id = data.get("user_id")
    image_url = data.get("image")
    songs = data.get("songs", [])

    # Validate user
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)


    # Create post
    post = Post.objects.create(user=user, image_path=image_url or "")

    saved_tracks = []

    for s in songs:
        spotify_id = s.get("spotify_id")
        if not spotify_id:
            continue

        track_obj, created = Track.objects.get_or_create(
            spotify_id=spotify_id,
            defaults={
                "name": s.get("name", ""),
                "artists": s.get("artist", ""),
                "album": s.get("album",""),
                "duration_ms": s.get("duration_ms", 0),
                "image_url": s.get("image_url", ""),
                "genre": s.get("genre", "")
            }
        )

        # If track already existed, update fields
        if not created:
            track_obj.name = s.get("name", track_obj.name)
            track_obj.artists = s.get("artist", track_obj.artists)
            track_obj.album = s.get("album", {}).get("name", "")
            track_obj.duration_ms = s.get("duration_ms", track_obj.duration_ms)
            track_obj.image_url = s.get("image_url", track_obj.image_url)
            track_obj.genre = s.get("genre", track_obj.genre)
            track_obj.save()

        post.track.add(track_obj)
        saved_tracks.append(track_obj.spotify_id)

    post.save()

    return Response({
        "post_id": post.id,
        "saved_tracks": saved_tracks
    }, status=201)



#----- Save Canvas---
@api_view(['POST'])
def save_canvas(request):
    print("Not happening")
    post_id = request.data.get("post_id")
    canvas_image = request.data.get("canvas_image")  # base64 string

    if not post_id or not canvas_image:
        return Response({"error": "Missing post_id or canvas_image"}, status=400)

    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return Response({"error": "Post not found"}, status=404)

    # decode base64 → image
    import base64
    from django.core.files.base import ContentFile

    format, imgstr = canvas_image.split(";base64,")
    ext = format.split("/")[-1]
    file_name = f"canvas_{post_id}.{ext}"

    post.canvas_image.save(file_name, ContentFile(base64.b64decode(imgstr)), save=True)

    return Response({"message": "Canvas saved successfully"})



class RegisterView(generics.CreateAPIView):
    serializer_class = UserSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            return Response({
                "message": "Registered successfully",
                "user": UserSerializer(user).data,
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



@api_view(["POST"])
def login_view(request):
    print("Login request received")

    # --- Parse JSON safely ---
    try:
        data = json.loads(request.body)
    except:
        return Response({"error": "Invalid JSON"}, status=400)

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return Response({"error": "Email and password required"}, status=400)

    # --- Authenticate user ---
    user = authenticate(request, email=email, password=password)

    if not user:
        return Response({"error": "Invalid credentials"}, status=401)

    # --- Django login (creates session + sessionid cookie) ---
    login(request, user)

    # --- Optional custom session data ---
    request.session["user_id"] = user.id
    request.session["email"] = user.email
    request.session["logged_in"] = True

    # --- Admin redirect case ---
    if user.is_superuser:
        print("SUPERMAN LOGIN")
        return Response({
            "user": UserSerializer(user).data,
            "redirect": "/admin/"
        }, status=200)

    print("NORMAL USER LOGIN")
    return Response({
        "message": "Login successful",
        "user": UserSerializer(user).data,
    }, status=200)


@api_view(["POST"])
def logout_view(request):
    if request.user.is_authenticated:
        logout(request)
        return Response({"detail": "Successfully logged out"}, status=200)
    else:
        return Response({"detail": "Already logged out"}, status=200)



@api_view(["GET"])
@ensure_csrf_cookie
def session_view(request):
    """
    Sends back: {"is_authenticated": true/false}
    Also ensures csrftoken cookie is sent.
    """
    return Response({"is_authenticated": request.user.is_authenticated})


@api_view(["GET"])
def who_am_i(request):
    """
    Sends back:
    {
       "is_authenticated": true/false,
       "username": "...",
    }
    """
    if not request.user.is_authenticated:
        return Response({"is_authenticated": False})

    return Response({
        "is_authenticated": True,
        "username": request.user.email
    })