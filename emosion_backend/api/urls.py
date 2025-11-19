from django.urls import path
from .views import RegisterView, LoginView, predict, save_tracks, get_Recommendation

urlpatterns = [
    path('predict/', predict, name='predict'),
    path("save_tracks/", save_tracks, name="save_tracks"),
    path('get_Recommendation/', get_Recommendation),
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
]
