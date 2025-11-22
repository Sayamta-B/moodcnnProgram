from django.urls import path
from .views import RegisterView, LoginView, predict, create_post, save_canvas, get_Recommendation

urlpatterns = [
    path('predict/', predict, name='predict'),
    path('create_post/', create_post, name='create_post'),
    path('save_canvas/', save_canvas, name="save_canvas"),
    path('get_Recommendation/', get_Recommendation),
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
]
