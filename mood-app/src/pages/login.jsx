import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useLogin } from "../context/LoginState";

function Login() {
  const { setUser } = useLogin();
  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // Get CSRF token from cookie
  function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith(name + "=")) {
          cookieValue = cookie.substring(name.length + 1);
          break;
        }
      }
    }
    return cookieValue;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await fetch("http://127.0.0.1:8000/api/session/", { credentials: "include" });
      const csrfToken = getCookie("csrftoken");

      const res = await fetch("http://127.0.0.1:8000/api/login/", {
        method: "POST",
        credentials: "include", // allow session cookies
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        setUser(data.user);

        alert("Logged in successfully!");

        if (data.redirect) {
          window.location.href = data.redirect;
        } else {
          window.location.href = "/";
        }
      } else {
        alert(data.error || "Invalid email or password!");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong!");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-md w-80 flex flex-col gap-3"
      >
        <h2 className="text-xl font-bold mb-4 text-center">Login</h2>

        <input
          name="email"
          type="email"
          value={form.email}
          placeholder="Email"
          className="border p-2 w-full rounded"
          onChange={handleChange}
          required
        />

        <input
          name="password"
          type="password"
          value={form.password}
          placeholder="Password"
          className="border p-2 w-full rounded"
          onChange={handleChange}
          required
        />

        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
        >
          Login
        </button>

        <p className="text-sm text-gray-600 text-center">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-500 hover:underline">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}

export default Login;
