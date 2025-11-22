import { BrowserRouter } from "react-router-dom";
import { Routes, Route, Navigate } from "react-router-dom";
import SidebarLeft from "./components/SidebarLeft";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Photo from "./pages/Photo";
import Journal from "./pages/Journal";
import Register from "./pages/Register";
import Login from "./pages/Login";
import RegisterState from "./context/RegisterState";
import UserPhotoInfoState from "./context/UserPhotoInfoState";

function App() {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");


  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = "/Login";
  };

  return (
    <RegisterState>
    <UserPhotoInfoState>
      <BrowserRouter>
        {!user ? (
          <Routes>
            {/* Routes for logged-out users */}
            <Route path="/Register" element={<Register />} />
            <Route path="/Login" element={<Login />} />
            <Route path="*" element={<Navigate to="/Login" replace />} />
          </Routes>
        ) : (
          <div className="flex h-screen w-screen overflow-hidden">
            {/* Sidebar with logout */}
            <SidebarLeft handleLogout={handleLogout} />

            {/* Main content area */}
            <main className="flex-1 overflow-y-auto">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/create" element={<Navigate to="/create/photo" replace />} />
                <Route path="/create/photo" element={<Photo />} />
                <Route path="/create/journal" element={<Journal />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        )}
      </BrowserRouter>
    </UserPhotoInfoState>
    </RegisterState>
  );
}

export default App;
