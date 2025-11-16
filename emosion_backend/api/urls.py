from django.urls import path
from .views import RegisterView, LoginView, predict, save_tracks

urlpatterns = [
    path('predict/', predict, name='predict'),
    path("save_tracks/", save_tracks, name="save_tracks"),
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
]
