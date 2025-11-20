import { BrowserRouter } from "react-router-dom";
import { Routes, Route, Navigate } from "react-router-dom";
import SidebarLeft from "./components/sidebar-left";
import Home from "./pages/home";
import Profile from "./pages/profile";
import Photo from "./pages/photo";
import Journal from "./pages/journal";
import MusicRecommend from "./pages/music-recommend";
import Register from "./pages/register";
import Login from "./pages/login";
import UserPhotoInfoState from "./context/UserPhotoInfoState";

function App() {
  const user = localStorage.getItem("user");

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <>
    <UserPhotoInfoState>

      <BrowserRouter>
      {!user ? (
        <Routes>
          {/* Logged-out routes */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      ) : (
        <div className="flex h-screen w-screen overflow-hidden">
          {/* Sidebar with logout */}
          <SidebarLeft handleLogout={handleLogout} />

          {/* Main content */}
          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/create" element={<Navigate to="/create/photo" replace />} />
              <Route path="/create/photo" element={<Photo />} />
              <Route path="/create/journal" element={<Journal />} />
              <Route path="/create/music" element={<MusicRecommend />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      )}
      </BrowserRouter>
      </UserPhotoInfoState>
    </>
  );
}

export default App;
