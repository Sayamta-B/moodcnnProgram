import { useState, useEffect, createContext, useContext } from "react";

// Create LoginContext
const LoginContext = createContext();

// LoginState provider
export default function LoginState({ children }) {
  // Track form inputs
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  // Track logged-in user (null if not logged in)
  const [user, setUser] = useState(() => {
    // Initialize from localStorage if exists
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  // Whenever user changes, save or remove from localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  // Logout function
  const logout = () => {
    setUser(null);
    // Optionally also call backend logout API
    fetch("http://127.0.0.1:8000/api/logout/", {
      method: "POST",
      credentials: "include",
    }).finally(() => {
      window.location.href = "/login";
    });
  };

  return (
    <LoginContext.Provider value={{ form, setForm, user, setUser, logout }}>
      {children}
    </LoginContext.Provider>
  );
}

// Custom hook to use login context
export const useLogin = () => useContext(LoginContext);
