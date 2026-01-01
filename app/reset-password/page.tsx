"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClientClient } from "@/lib/supabase-client";

export default function ResetPasswordPage() {
  useEffect(() => {
    document.title = "Wachtwoord opnieuw instellen - Lynqit";
  }, []);

  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  useEffect(() => {
    // Supabase sends the token in the hash fragment (#access_token=...&type=recovery)
    // This can be on the homepage or on /reset-password
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const token = hashParams.get("access_token");
    const type = hashParams.get("type");
    const refresh = hashParams.get("refresh_token");

    if (token && type === "recovery") {
      setAccessToken(token);
      setRefreshToken(refresh);
      setIsValidatingToken(false);
      
      // If we're on the homepage with the hash, redirect to /reset-password
      if (window.location.pathname === "/" && window.location.hash) {
        // Preserve the hash when redirecting
        router.replace(`/reset-password${window.location.hash}`);
        return;
      }
    } else {
      setError("Ongeldige of verlopen reset link. Vraag een nieuwe aan via de login pagina.");
      setIsValidatingToken(false);
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Wachtwoorden komen niet overeen");
      return;
    }

    if (password.length < 6) {
      setError("Wachtwoord moet minimaal 6 tekens lang zijn");
      return;
    }

    if (!accessToken) {
      setError("Geen toegangstoken gevonden. Vraag een nieuwe reset link aan.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClientClient();

      // Set the session with the recovery token
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || "",
      });

      if (sessionError) {
        console.error("Session error:", sessionError);
        throw new Error("Ongeldige of verlopen reset link. De link is mogelijk al gebruikt of verlopen.");
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        console.error("Update error:", updateError);
        throw updateError;
      }

      // Sign out to clear the recovery session
      await supabase.auth.signOut();

      // Clear the hash from URL
      window.history.replaceState(null, "", "/reset-password");

      setSuccess(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      console.error("Password reset error:", err);
      setError(err.message || "Er is een fout opgetreden bij het opnieuw instellen van je wachtwoord");
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidatingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <div className="text-zinc-600 dark:text-zinc-400">Laden...</div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <div className="w-full max-w-md px-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-8 text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
                <i className="fas fa-check text-green-600 dark:text-green-400 text-2xl"></i>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
              Wachtwoord opnieuw ingesteld!
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              Je wachtwoord is succesvol gewijzigd. Je wordt doorgestuurd naar de login pagina...
            </p>
            <Link
              href="/login"
              className="inline-block px-6 py-3 bg-[#2E47FF] text-white rounded-lg font-semibold hover:bg-[#1E37E6] transition-colors"
            >
              Naar inloggen
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <div className="w-full max-w-md px-4">
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
              Wachtwoord opnieuw instellen
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Voer je nieuwe wachtwoord in
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
              >
                Nieuw wachtwoord
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2E47FF] focus:border-transparent"
                placeholder="Minimaal 6 tekens"
                disabled={isLoading}
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
              >
                Bevestig wachtwoord
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2E47FF] focus:border-transparent"
                placeholder="Bevestig je wachtwoord"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !accessToken}
              className="w-full px-4 py-3 bg-[#2E47FF] text-white rounded-lg font-semibold hover:bg-[#1E37E6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Bezig..." : "Wachtwoord opnieuw instellen"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm text-[#2E47FF] hover:underline"
            >
              Terug naar inloggen
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
