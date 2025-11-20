from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    profile_url = models.TextField(null=True, blank=True)

    USERNAME_FIELD='email'
    REQUIRED_FIELDS=[]

    email = models.EmailField(unique=True)
# default fields like username, email, password, first_name, last_name, date_join, last_login


class Track(models.Model):
    spotify_id = models.CharField(max_length=50)
    name = models.TextField()
    artists = models.JSONField(null=True, blank=True) # structured array of artists
    album = models.TextField()
    duration_ms = models.IntegerField()
    genre = models.CharField(max_length=50, null=True, blank=True)
    image_url = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class TrackFavorite(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    track = models.ForeignKey(Track, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'track'], name='unique_user_track_favorite')
        ]



class Post(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    image_path = models.TextField()
    canvas_image = models.ImageField(upload_to='canvas_drawings/', null=True, blank=True)
    canvas_data = models.JSONField(null=True, blank=True)
    bookmark= models.BooleanField(default=False)
    track = models.ManyToManyField(Track, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class MoodDetection(models.Model):
    MOOD_CHOICES = [
        ('angry', 'Angry'),
        ('happy', 'Happy'),
        ('neutral', 'Neutral'),
        ('sad', 'Sad'),
        ('surprise', 'Surprise'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    post = models.ForeignKey(Post, on_delete=models.CASCADE, null=True, blank=True)
    mood = models.CharField(max_length=10, choices=MOOD_CHOICES, null=True, blank=True)
    confidence = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class ListeningHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    track = models.ForeignKey(Track, on_delete=models.CASCADE)
    listen_count = models.IntegerField(default=0)
    last_listened_at = models.DateTimeField(auto_now=True)
    mood = models.CharField(max_length=10, choices=MoodDetection.MOOD_CHOICES, null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'track'], name='unique_user_track_history')
        ]
