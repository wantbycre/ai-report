"use client";

import { useState } from "react";
import { supabaseClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async () => {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error(error);
    } else {
      console.log("회원가입 성공");
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1>Sign Up</h1>

      <input
        className="border w-full rounded p-2"
        placeholder="email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        className="border w-full rounded p-2"
        type="password"
        placeholder="password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleSignup} className="border rounded p-2">
        Sign Up
      </button>
    </div>
  );
}
