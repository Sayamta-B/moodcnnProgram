from django.urls import path
from .views import RegisterView, LoginView, predict, save_tracks
from .spotify_reco import recommend_song_for_mood;

urlpatterns = [
    path('predict/', predict, name='predict'),
    path("save_tracks/", save_tracks, name="save_tracks"),
    path('recommend_song_for_mood/', recommend_song_for_mood, name='recommend_song_for_mood'),
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
]
