"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClientClient } from "@/lib/supabase-client";

export default function LoginPage() {
  useEffect(() => {
    document.title = "Inloggen - Lynqit";
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Use API route for login to avoid client-side fetch issues
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.toLowerCase(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid email or password");
        setIsLoading(false);
        return;
      }

      // Store user info in localStorage
      if (data.user) {
        localStorage.setItem("lynqit_user", JSON.stringify(data.user));
      }

      // Store session in localStorage for API calls
      if (data.session) {
        localStorage.setItem("supabase.auth.token", JSON.stringify({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
        }));
      }

      // Try to set session in Supabase client (optional, may fail due to CORS)
      if (data.session) {
        try {
          const supabase = createClientClient();
          // Use the full session object if available
          if (data.session.access_token && data.session.refresh_token) {
            await supabase.auth.setSession({
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
            });
          }
        } catch (sessionError) {
          // Ignore session setting errors - user is still logged in via API
          console.warn("Could not set session in Supabase client (this is OK):", sessionError);
        }
      }

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black font-sans dark:bg-black px-4">
      <div className="w-full max-w-md">
        <div 
          className="bg-zinc-900 rounded-2xl shadow-lg p-8 border border-zinc-800 relative"
        >
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-zinc-50 mb-2">
              Welcome back
            </h1>
            <p className="text-zinc-400">
              Sign in to your account to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-zinc-300 mb-2"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-50 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-50 focus:border-transparent transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-zinc-300 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-50 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-50 focus:border-transparent transition-colors"
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-900/20 border border-red-800">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-zinc-700 text-zinc-50 focus:ring-2 focus:ring-zinc-50"
                />
                <span className="ml-2 text-sm text-zinc-400">
                  Remember me
                </span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-zinc-50 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                backgroundImage: 'linear-gradient(90deg, #2E47FF 0%, #00F0EE 100%)'
              }}
              className="w-full py-3 px-4 rounded-lg text-white font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#2E47FF] focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-400">
              Don't have an account?{" "}
              <Link
                href="/register"
                className="font-medium text-zinc-50 hover:underline"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

