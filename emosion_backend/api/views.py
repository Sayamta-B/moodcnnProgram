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
from django.http import JsonResponse
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
def save_tracks(request):
    print("Received data:", request.data)
    user_id = request.data.get("user_id")
    post_id = request.data.get("post_id")
    songs = request.data.get("songs", [])

    # Validate
    if not user_id or not post_id or not songs:
        return Response(
            {"error": "Missing user_id, post_id, or songs"},
            status=400
        )

    # Fetch user and post
    try:
        user = User.objects.get(id=user_id)
        post = Post.objects.get(id=post_id, user=user)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)
    except Post.DoesNotExist:
        return Response({"error": "Post not found"}, status=404)

    saved_tracks = []

    # Loop through songs
    for s in songs:
        spotify_id = s.get("spotify_id")
        title = s.get("title")
        artist = s.get("artist")

        # Save or get Track
        track_obj, created = Track.objects.get_or_create(
            spotify_id=spotify_id,
            defaults={
                "name": title,
                "artists": artist,
                "album": "",
                "duration_ms": 0,
                "image_url": ""
            }
        )

        # Attach to Post
        post.track.add(track_obj)
        saved_tracks.append(track_obj.spotify_id)

    post.save()

    return Response({
        "message": "Selected songs saved successfully!",
        "post_id": post_id,
        "saved_tracks": saved_tracks
    })



# --- User Auth ---
class RegisterView(generics.CreateAPIView):
    serializer_class = UserSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                "user": UserSerializer(user).data,
                "token": str(refresh.access_token),
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(generics.GenericAPIView):
    serializer_class = UserSerializer

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")
        user = authenticate(request, email=email, password=password)
        if user:
            refresh = RefreshToken.for_user(user)
            return Response({
                "user": UserSerializer(user).data,
                "token": str(refresh.access_token),
            })
        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
