import requests
import base64

# --- Replace with your actual Spotify credentials ---
CLIENT_ID = "9d837378d0404d6d8cdd824e46475cd4"
CLIENT_SECRET = "11974a9d9d1b41dfb646e3dd2f651787"

# Step 1: Encode credentials and get access token
auth_str = f"{CLIENT_ID}:{CLIENT_SECRET}"
b64_auth_str = base64.b64encode(auth_str.encode()).decode()

headers = {
    "Authorization": f"Basic {b64_auth_str}",
    "Content-Type": "application/x-www-form-urlencoded"
}

data = {"grant_type": "client_credentials"}
response = requests.post("https://accounts.spotify.com/api/token", headers=headers, data=data)
token_info = response.json()

if "access_token" not in token_info:
    print("❌ Failed to get token:", token_info)
    exit()

access_token = token_info["access_token"]
print("✅ Access token obtained!")

# Step 2: Fetch audio features for a calm track (e.g., “Weightless” by Marconi Union)
track_id = "7GhIk7Il098yCjg4BQjzvb"  # replace with any track ID you want
features_url = f"https://api.spotify.com/v1/audio-features/{track_id}"

headers = {"Authorization": f"Bearer {access_token}"}
res = requests.get(features_url, headers=headers)
data = res.json()

if "error" in data:
    print(f"⚠️ Error fetching features: {data}")
else:
    print("\n🎵 Audio Features for Track:")
    for key, value in data.items():
        print(f"{key}: {value}")
