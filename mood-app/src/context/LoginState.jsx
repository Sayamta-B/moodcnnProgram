import { useState } from "react";
import LoginContext from "./LoginContext";

export default function LoginState({ children }) {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  return (
    <LoginContext.Provider value={{ form, setForm }}>
      {children}
    </LoginContext.Provider>
  );
}
