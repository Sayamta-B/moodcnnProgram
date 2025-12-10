from django.urls import path
from .views import RegisterView, login_view, logout_view, who_am_i, session_view, predict, create_post, save_canvas, get_Recommendation, spotify_status, spotify_login, home_top_tracks, mood_tracks, profile_favorites, spotify_callback, debug_session 

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', login_view, name='login'),
    path('logout/', logout_view, name='logout_view'),
    path('session/', session_view, name='session_view'),
    path('who_am_i/', who_am_i, name='who_am_i'),
    # path('current_user/', current_user, name='current_user'),
    path('predict/', predict, name='predict'),
    path('create_post/', create_post, name='create_post'),
    path('save_canvas/', save_canvas, name="save_canvas"),
    path('get_Recommendation/', get_Recommendation), 


    path('spotify_login/', spotify_login, name='spotify_login'),
    path('spotify_callback/', spotify_callback, name='spotify_callback'),
    path('spotify_status/', spotify_status, name='spotify_status'),    
    path('home_top_tracks/', home_top_tracks),    
    path('mood_tracks/', mood_tracks),    
    path('profile_favorites/', profile_favorites),    
    path('debug_session/', debug_session),    
]
