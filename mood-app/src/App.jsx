import { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";

import SidebarLeft from "./components/SidebarLeft";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Photo from "./pages/Photo";
import Journal from "./pages/Journal";
import Register from "./pages/Register";
import Login from "./pages/Login";

import RegisterState from "./context/RegisterState";
import UserPhotoInfoState from "./context/UserPhotoInfoState";
import LoginState, { useLogin } from "./context/LoginState";

function App() {
  return (
    <BrowserRouter>
      <LoginState>
        <RegisterState>
          <UserPhotoInfoState>
            <AppRoutes />
          </UserPhotoInfoState>
        </RegisterState>
      </LoginState>
    </BrowserRouter>
  );
}

function AppRoutes() {
  const { user, setUser, logout } = useLogin();
  const navigate = useNavigate();

  // Load CSRF + check session user ONCE
  useEffect(() => {
    const bootstrap = async () => {
      // 1) get CSRF cookie
      await fetch("http://127.0.0.1:8000/api/session/", {
        credentials: "include",
      });

      // 2) check active session user
      const res = await fetch("http://127.0.0.1:8000/api/who_am_i/", {
        credentials: "include",
      });

      const data = await res.json();

      if (data.is_authenticated) {
        setUser({ email: data.username });
      }
    };

    bootstrap();
  }, []);

  return (
    <>
      {!user ? (
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
        <div className="flex h-screen w-screen overflow-hidden">
          <SidebarLeft handleLogout={logout} />
          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route
                path="/create"
                element={<Navigate to="/create/photo" replace />}
              />
              <Route path="/create/photo" element={<Photo />} />
              <Route path="/create/journal" element={<Journal />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      )}
    </>
  );
}

export default App;
