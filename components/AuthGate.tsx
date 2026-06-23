"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type Props = {
  children: (user: User) => React.ReactNode;
};

export default function AuthGate({ children }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSignIn() {
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) setError(error.message);
    else setSent(true);
  }

  async function handleVerifyCode() {
    setError("");
    setVerifying(true);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
    setVerifying(false);
    if (error) setError(error.message);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Voice Notes</h1>
          <p className="text-sm text-gray-400 mb-6">Sign in to save your notes across devices.</p>

          {sent ? (
            <div className="text-center">
              <p className="text-2xl mb-2">📬</p>
              <p className="text-sm text-gray-600 font-medium">Check your email</p>
              <p className="text-xs text-gray-400 mt-1">We sent a 6-digit code to <strong>{email}</strong></p>
              <div className="flex flex-col gap-3 mt-4">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleVerifyCode()}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-center tracking-widest outline-none focus:ring-2 focus:ring-indigo-300"
                  autoFocus
                />
                <button
                  onClick={handleVerifyCode}
                  disabled={code.length < 6 || verifying}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-3 rounded-xl disabled:opacity-40"
                >
                  {verifying ? "Verifying..." : "Verify code"}
                </button>
                {error && <p className="text-xs text-red-500 text-center">{error}</p>}
              </div>
              <button onClick={() => { setSent(false); setCode(""); setError(""); }} className="mt-4 text-xs text-indigo-500">
                Use a different email
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <button
                onClick={handleSignIn}
                disabled={!email.includes("@")}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-3 rounded-xl disabled:opacity-40"
              >
                Send sign-in code
              </button>
              {error && <p className="text-xs text-red-500 text-center">{error}</p>}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <span className="text-xs text-gray-400 hidden sm:block">{user.email}</span>
        <button
          onClick={handleSignOut}
          className="text-xs text-gray-400 hover:text-gray-600 bg-white border border-gray-200 px-2 py-1 rounded-lg"
        >
          Sign out
        </button>
      </div>
      {children(user)}
    </div>
  );
}
