import React, { useState } from "react";
import { Link } from "react-router-dom";
import LoginContext from "../context/LoginContext";

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Submit login using Django session
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://127.0.0.1:8000/api/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // important: allow session cookie
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        // No token needed; Django sets sessionid cookie automatically
        alert("Logged in successfully!");
        window.location.href = "/"; // redirect to dashboard/home
      } else {
        const errMsg = data.error || "Invalid email or password!";
        alert(errMsg);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong!");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md w-80 flex flex-col gap-3">
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
