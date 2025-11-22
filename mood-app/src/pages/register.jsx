import React, { useContext } from "react";
import RegisterContext from "../context/RegisterContext";

function Register() {
  const { form, setForm, loading, setLoading } = useContext(RegisterContext);

  // Update form state on input change...everytime user edits/writes the field
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Submit registration
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      console.log("Backend response:", data); // debug

      if (res.ok) {
        if (data.token && data.user) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          window.location.href = "/";
        } else {
          alert("Registration succeeded but token/user missing!");
        }
      } else {
        // show serializer errors
        const errMsg = data.detail || JSON.stringify(data);
        alert(errMsg);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-md w-80 flex flex-col gap-3"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Register</h2>

        <input
          name="username"
          value={form.username}
          placeholder="Username"
          className="border p-2 w-full rounded"
          onChange={handleChange}
          required
        />

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

        <input
          name="confirmPassword"
          type="password"
          value={form.confirmPassword}
          placeholder="Confirm Password"
          className="border p-2 w-full rounded"
          onChange={handleChange}
          required
        />

        <button
          type="submit"
          className={`bg-blue-500 text-white px-4 py-2 rounded ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={loading}
        >
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
    </div>
  );
}

export default Register;
