"use client";

import { useState } from "react";
import { supabaseClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin() {
    const { error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) alert(error.message);
  }

  return (
    <div className="max-w-md mx-auto">
      <h1>Login</h1>

      <input
        className="border w-full rounded p-2"
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        className="border w-full rounded p-2"
        type="password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleLogin} className="border rounded p-2">
        Login
      </button>
    </div>
  );
}
