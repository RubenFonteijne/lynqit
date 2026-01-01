"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ForgotPasswordPage() {
  useEffect(() => {
    document.title = "Wachtwoord vergeten - Lynqit";
  }, []);

  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Er is een fout opgetreden");
        setIsLoading(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError("Er is een fout opgetreden. Probeer het opnieuw.");
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black font-sans dark:bg-black px-4">
        <div className="w-full max-w-md">
          <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl shadow-lg p-8 border border-zinc-200 dark:border-zinc-800 text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
                <i className="fas fa-envelope text-green-600 dark:text-green-400 text-2xl"></i>
              </div>
            </div>
            <h1 className="text-3xl font-semibold text-black dark:text-zinc-50 mb-2">
              Email verzonden!
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              Als dit email adres bestaat, ontvang je een email met instructies om je wachtwoord opnieuw in te stellen.
            </p>
            <Link
              href="/login"
              className="inline-block px-6 py-3 rounded-lg text-white font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#2E47FF] focus:ring-offset-2 transition-all"
              style={{
                backgroundImage: 'linear-gradient(90deg, #2E47FF 0%, #00F0EE 100%)'
              }}
            >
              Terug naar inloggen
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black font-sans dark:bg-black px-4">
      <div className="w-full max-w-md">
        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl shadow-lg p-8 border border-zinc-200 dark:border-zinc-800">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-black dark:text-zinc-50 mb-2">
              Wachtwoord vergeten?
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Voer je email adres in en we sturen je een link om je wachtwoord opnieuw in te stellen.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-zinc-50 focus:border-transparent transition-colors"
                placeholder="you@example.com"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                backgroundImage: 'linear-gradient(90deg, #2E47FF 0%, #00F0EE 100%)'
              }}
              className="w-full py-3 px-4 rounded-lg text-white font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#2E47FF] focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Verzenden..." : "Verstuur reset link"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm font-medium text-black dark:text-zinc-50 hover:underline"
            >
              Terug naar inloggen
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

