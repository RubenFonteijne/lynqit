"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardSidebar from "@/app/components/DashboardSidebar";
import { createClientClient } from "@/lib/supabase-client";

export default function SettingsPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState({
    mollieApiKeyTest: "",
    mollieApiKeyLive: "",
    useTestMode: true,
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    document.title = "Settings - Lynqit";
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const checkAdmin = async () => {
      try {
        const supabase = createClientClient();
        
        // Get current session from Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (error || !session || !session.user || !session.user.email) {
          router.push("/");
          return;
        }

        // Get user info from API
        const userResponse = await fetch(`/api/user?email=${encodeURIComponent(session.user.email)}`);
        if (!isMounted) return;
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          if (userData.user && isMounted) {
            // Check if user is admin
            if (userData.user.role !== 'admin') {
              router.push("/");
              return;
            }
            
            setIsAdmin(true);
            // Fetch settings
            await fetchSettings();
          } else {
            router.push("/");
          }
        } else {
          router.push("/");
        }
      } catch (error) {
        console.error("Error checking admin:", error);
        if (isMounted) {
          router.push("/");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    checkAdmin();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings", { cache: 'no-store' });
      if (response.ok) {
        const settingsData = await response.json();
        setSettings({
          mollieApiKeyTest: settingsData.settings.mollieApiKeyTest || "",
          mollieApiKeyLive: settingsData.settings.mollieApiKeyLive || "",
          useTestMode: settingsData.settings.useTestMode ?? true,
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const handleSaveSettings = async () => {
    setSettingsLoading(true);
    setSaveMessage(null);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (!response.ok) {
        setSaveMessage({ type: "error", text: data.error || "Fout bij opslaan van instellingen" });
        setTimeout(() => setSaveMessage(null), 5000);
        return;
      }

      setSaveMessage({ type: "success", text: "Instellingen opgeslagen!" });
      setTimeout(() => setSaveMessage(null), 3000);
      
      // Refresh settings
      await fetchSettings();
    } catch (error) {
      console.error("Error saving settings:", error);
      setSaveMessage({ type: "error", text: "Er is een fout opgetreden bij het opslaan van de instellingen" });
      setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      setSettingsLoading(false);
    }
  };

  if (isLoading) {
    return null;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen font-sans flex" style={{ background: 'linear-gradient(#2F3441, #000)' }}>
      <DashboardSidebar />
      <div className="flex-1 ml-64">
        <div className="w-full px-8 py-8 mt-6 rounded-xl" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-white mb-2">
              Settings
            </h1>
            <p className="text-zinc-400">
              Beheer Mollie API instellingen
            </p>
          </div>

          {saveMessage && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                saveMessage.type === "success"
                  ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
              }`}
            >
              <p
                className={`text-sm ${
                  saveMessage.type === "success"
                    ? "text-green-800 dark:text-green-200"
                    : "text-red-800 dark:text-red-200"
                }`}
              >
                {saveMessage.text}
              </p>
            </div>
          )}

          <div className="rounded-xl p-6" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <h2 className="text-xl font-semibold text-white mb-4">
              Mollie API Instellingen
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Mollie Test API Key
                </label>
                <input
                  type="password"
                  value={settings.mollieApiKeyTest}
                  onChange={(e) => setSettings({ ...settings, mollieApiKeyTest: e.target.value })}
                  placeholder="test_..."
                  className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" style={{ border: '1px solid rgba(255, 255, 255, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white' }}
                />
                <p className="mt-1 text-xs text-zinc-400">
                  Test API key voor ontwikkelomgeving
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Mollie Live API Key
                </label>
                <input
                  type="password"
                  value={settings.mollieApiKeyLive}
                  onChange={(e) => setSettings({ ...settings, mollieApiKeyLive: e.target.value })}
                  placeholder="live_..."
                  className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" style={{ border: '1px solid rgba(255, 255, 255, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white' }}
                />
                <p className="mt-1 text-xs text-zinc-400">
                  Live API key voor productieomgeving
                </p>
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.useTestMode}
                    onChange={(e) => setSettings({ ...settings, useTestMode: e.target.checked })}
                    className="w-4 h-4 text-[#2E47FF] rounded focus:ring-[#2E47FF]"
                  />
                  <span className="text-sm font-medium text-zinc-300">
                    Gebruik Test Mode
                  </span>
                </label>
                <p className="mt-1 text-xs text-zinc-400 ml-6">
                  Schakel test mode uit om live betalingen te verwerken
                </p>
              </div>
              <button
                onClick={handleSaveSettings}
                disabled={settingsLoading}
                className="px-6 py-2 bg-gradient-to-r from-[#2E47FF] to-[#00F0EE] text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {settingsLoading ? "Opslaan..." : "Instellingen opslaan"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

