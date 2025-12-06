import { useState } from "react";
import RegisterContext from "./RegisterContext";

export default function RegisterState({ children }) {
  const [form, setForm] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    confirmPassword: "",
  });

  return (
    <RegisterContext.Provider
      value={{
        form,
        setForm,
      }}
    >
      {children}
    </RegisterContext.Provider>
  );
}
