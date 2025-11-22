from django.contrib import admin
from .models import User, Post, Track, TrackFavorite, ListeningHistory, MoodDetection

# admin.site.register(User), already registered
admin.site.register(Track)
admin.site.register(TrackFavorite)
admin.site.register(Post)
admin.site.register(MoodDetection)
admin.site.register(ListeningHistory)

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("email", "username", "is_staff", "is_superuser", "date_joined", "last_login")
    search_fields = ('email', 'username', 'first_name', 'last_name')

