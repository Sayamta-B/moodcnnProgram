from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

# ---------------------------
# User Manager
# ---------------------------
class UserManager(BaseUserManager):
    def create_user(self, email, password=None, display_name=None):
        if not email:
            raise ValueError("Email is required")
        user = self.model(
            email=self.normalize_email(email),
            display_name=display_name
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password, display_name="Admin"):
        user = self.create_user(email=email, password=password, display_name=display_name)
        user.is_staff = True
        user.is_superuser = True
        user.save(using=self._db)
        return user


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    display_name = models.CharField(max_length=255)
    profile_url = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # Admin permissions
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['display_name']

    objects = UserManager()

    def __str__(self):
        return self.email


class Track(models.Model):
    spotify_id = models.TextField(unique=True)
    name = models.TextField()
    artists = models.TextField()  # comma-separated or JSON
    album = models.TextField()
    duration_ms = models.IntegerField()
    image_url = models.TextField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.artists}"


class TrackFavorite(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    track = models.ForeignKey(Track, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user','track')


class ListeningHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    track = models.ForeignKey(Track, on_delete=models.CASCADE)
    listen_count = models.IntegerField(default=0)
    last_listened_at = models.DateTimeField(auto_now=True)


class Post(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    image_path = models.TextField()
    canvas_image = models.ImageField(upload_to='canvas_drawings/', null=True, blank=True)
    track = models.ManyToManyField(Track, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    bookmark= models.BooleanField(default=False)


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
