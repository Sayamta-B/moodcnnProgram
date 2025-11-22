import { useState } from "react";
import RegisterContext from "./RegisterContext";

export default function RegisterState({ children }) {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);

  return (
    <RegisterContext.Provider
      value={{
        form,
        setForm,
        loading,
        setLoading
      }}
    >
      {children}
    </RegisterContext.Provider>
  );
}
