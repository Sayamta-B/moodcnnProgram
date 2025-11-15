from django.urls import path
from .views import RegisterView, LoginView, predict

urlpatterns = [
    path('predict/', predict, name='predict'),
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
]
