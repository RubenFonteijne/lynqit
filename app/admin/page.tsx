"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@/lib/users";
import type { LynqitPage } from "@/lib/lynqit-pages";
import { formatPageTitle } from "@/lib/utils";
import { SUBSCRIPTION_PRICES, calculatePriceWithBTW } from "@/lib/pricing";
import DashboardSidebar from "@/app/components/DashboardSidebar";
import { createClientClient } from "@/lib/supabase-client";
import { isAdminUserAsync } from "@/lib/users";

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allPages, setAllPages] = useState<LynqitPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    mollieApiKeyTest: "",
    mollieApiKeyLive: "",
    useTestMode: true,
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [editingPage, setEditingPage] = useState<LynqitPage | null>(null);
  const [editPageForm, setEditPageForm] = useState({ slug: "", title: "" });
  const [editPageLoading, setEditPageLoading] = useState(false);
  const [editPageError, setEditPageError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Admin - Lynqit";
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

        // Get user info from API (this will also check if user exists)
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
            
            setUser(userData.user);
            // Store in localStorage for backward compatibility
            localStorage.setItem("lynqit_user", JSON.stringify(userData.user));
            fetchData();
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
  }, []); // Removed router to prevent loops

  const fetchData = async () => {
    try {
      // Get access token for authenticated requests
      const supabase = createClientClient();
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token || '';

      const [usersResponse, pagesResponse, settingsResponse] = await Promise.all([
        fetch("/api/admin/users", { cache: 'no-store' }),
        fetch("/api/admin/pages", { 
          cache: 'no-store',
          headers: accessToken ? {
            'Authorization': `Bearer ${accessToken}`
          } : {}
        }),
        fetch("/api/admin/settings", { cache: 'no-store' }),
      ]);

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setAllUsers(usersData.users || []);
      }

      if (pagesResponse.ok) {
        const pagesData = await pagesResponse.json();
        setAllPages(pagesData.pages || []);
      }

      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        setSettings({
          mollieApiKeyTest: settingsData.settings.mollieApiKeyTest || "",
          mollieApiKeyLive: settingsData.settings.mollieApiKeyLive || "",
          useTestMode: settingsData.settings.useTestMode ?? true,
        });
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
    }
  };

  const handleSaveSettings = async () => {
    setSettingsLoading(true);
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
        alert(data.error || "Fout bij opslaan van instellingen");
        return;
      }

      alert("Instellingen opgeslagen!");
      setShowSettings(false);
      // Refresh settings
      const settingsResponse = await fetch("/api/admin/settings");
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        setSettings({
          mollieApiKeyTest: settingsData.settings.mollieApiKeyTest || "",
          mollieApiKeyLive: settingsData.settings.mollieApiKeyLive || "",
          useTestMode: settingsData.settings.useTestMode ?? true,
        });
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Er is een fout opgetreden bij het opslaan van de instellingen");
    } finally {
      setSettingsLoading(false);
    }
  };

  const getUserPages = (userId: string) => {
    if (!Array.isArray(allPages)) {
      return [];
    }
    return allPages.filter((page) => page.userId === userId);
  };

  // Calculate total monthly revenue
  const calculateTotalRevenue = () => {
    // Ensure allPages is an array
    if (!Array.isArray(allPages)) {
      return {
        exclBTW: 0,
        inclBTW: 0,
      };
    }

    const activePaidPages = allPages.filter(
      (p) => p.subscriptionPlan !== "free" && p.subscriptionStatus === "active"
    );

    let totalExBTW = 0;
    activePaidPages.forEach((page) => {
      if (page.subscriptionPlan === "start") {
        totalExBTW += SUBSCRIPTION_PRICES.start;
      } else if (page.subscriptionPlan === "pro") {
        totalExBTW += SUBSCRIPTION_PRICES.pro;
      }
    });

    const totalInclBTW = calculatePriceWithBTW(totalExBTW);

    return {
      exclBTW: totalExBTW,
      inclBTW: totalInclBTW,
    };
  };

  const revenue = calculateTotalRevenue();

  const handleDeleteUser = async (userEmail: string, userName: string) => {
    // Prevent deleting admin account
    if (userEmail === "rubenfonteijne@gmail.com") {
      alert("Je kunt het admin account niet verwijderen");
      return;
    }

    // Confirm deletion
    const confirmed = window.confirm(
      `Weet je zeker dat je gebruiker "${userName}" wilt verwijderen?\n\nDit zal ook alle bijbehorende pagina's verwijderen. Deze actie kan niet ongedaan worden gemaakt.`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(userEmail)}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Fout bij verwijderen van gebruiker");
        return;
      }

      // Refresh data
      await fetchData();
      
      // Close user details if it was open
      setSelectedUserId(null);

      alert(`Gebruiker "${userName}" en ${data.deletedPagesCount || 0} pagina's zijn verwijderd.`);
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Er is een fout opgetreden bij het verwijderen van de gebruiker");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("nl-NL", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleEditPage = (page: LynqitPage) => {
    setEditingPage(page);
    setEditPageForm({
      slug: page.slug,
      title: page.title || "",
    });
    setEditPageError(null);
  };

  const handleSavePageEdit = async () => {
    if (!editingPage || !user) return;

    setEditPageError(null);
    setEditPageLoading(true);

    // Validate slug format
    const slug = editPageForm.slug.trim();
    if (!slug) {
      setEditPageError("Slug is verplicht");
      setEditPageLoading(false);
      return;
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      setEditPageError("Slug mag alleen kleine letters, cijfers en streepjes bevatten");
      setEditPageLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/admin/pages/${editingPage.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.email,
          slug: slug,
          title: editPageForm.title.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setEditPageError(data.error || "Fout bij opslaan van pagina");
        return;
      }

      // Refresh data
      await fetchData();
      setEditingPage(null);
      setEditPageForm({ slug: "", title: "" });
      setEditPageError(null);
      alert("Pagina succesvol bijgewerkt!");
    } catch (error) {
      console.error("Error saving page:", error);
      setEditPageError("Er is een fout opgetreden bij het opslaan van de pagina");
    } finally {
      setEditPageLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center font-sans" style={{ background: 'linear-gradient(#2F3441, #000)' }}>
        <div className="text-zinc-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans flex" style={{ background: 'linear-gradient(#2F3441, #000)' }}>
      <DashboardSidebar />
      <div className="flex-1 ml-64">
        <div className="w-full px-8 py-8 mt-6 rounded-xl" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-semibold text-white mb-2">
                Admin Dashboard
              </h1>
              <p className="text-zinc-400">
                Beheer alle accounts en pagina's
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="px-4 py-2 rounded-lg transition-colors" style={{ border: '1px solid rgba(255, 255, 255, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white' }}
              >
                {showSettings ? "Verberg Settings" : "Settings"}
              </button>
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-lg transition-colors" style={{ border: '1px solid rgba(255, 255, 255, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white' }}
              >
                Naar Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Settings Card */}
        {showSettings && (
          <div className="rounded-xl p-6 mb-6" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <h2 className="text-xl font-semibold text-white mb-4">
              Settings
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
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 ml-6">
                  Schakel test mode uit om live betalingen te verwerken
                </p>
              </div>
              <button
                onClick={handleSaveSettings}
                disabled={settingsLoading}
                className="px-6 py-2 bg-[#2E47FF] text-white rounded-lg font-medium hover:bg-[#1E37E6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {settingsLoading ? "Opslaan..." : "Instellingen opslaan"}
              </button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="rounded-xl p-6" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <h3 className="text-sm font-medium text-zinc-400 mb-2">
              Totaal Gebruikers
            </h3>
            <p className="text-3xl font-bold text-white">
              {allUsers.length}
            </p>
          </div>
          <div className="rounded-xl p-6" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <h3 className="text-sm font-medium text-zinc-400 mb-2">
              Totaal Pagina's
            </h3>
            <p className="text-3xl font-bold text-white">
              {Array.isArray(allPages) ? allPages.length : 0}
            </p>
          </div>
          <div className="rounded-xl p-6" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <h3 className="text-sm font-medium text-zinc-400 mb-2">
              Betaalde Abonnementen
            </h3>
            <p className="text-3xl font-bold text-white">
              {Array.isArray(allPages) ? allPages.filter((p) => p.subscriptionPlan !== "free" && p.subscriptionStatus === "active").length : 0}
            </p>
          </div>
          <div className="rounded-xl p-6" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <h3 className="text-sm font-medium text-zinc-400 mb-2">
              Maandelijkse Omzet
            </h3>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-black dark:text-zinc-50">
                €{revenue.inclBTW.toFixed(2)} <span className="text-sm font-normal text-zinc-600 dark:text-zinc-400">incl. BTW</span>
              </p>
              <p className="text-lg text-zinc-600 dark:text-zinc-400">
                €{revenue.exclBTW.toFixed(2)} excl. BTW
              </p>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
          <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-4">
            Alle Gebruikers
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Rol
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Aangemaakt
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Pagina's
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map((u) => {
                  const userPages = getUserPages(u.email);
                  return (
                    <tr
                      key={u.email}
                      className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
                      onClick={() => setSelectedUserId(selectedUserId === u.email ? null : u.email)}
                    >
                      <td className="py-3 px-4 text-sm text-black dark:text-zinc-50">
                        {u.email}
                      </td>
                      <td className="py-3 px-4 text-sm text-black dark:text-zinc-50">
                        <span className={`px-2 py-1 rounded text-xs ${
                          u.role === "admin"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                            : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400">
                        {formatDate(u.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-sm text-black dark:text-zinc-50">
                        {userPages.length}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUserId(selectedUserId === u.email ? null : u.email);
                            }}
                            className="text-[#2E47FF] hover:text-[#1E37E6] dark:text-[#00F0EE] dark:hover:text-[#00D9D7]"
                          >
                            {selectedUserId === u.email ? "Verberg" : "Bekijk"}
                          </button>
                          {u.role !== "admin" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteUser(u.email, u.email);
                              }}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                              title="Gebruiker verwijderen"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Pages Detail */}
        {selectedUserId && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
            <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-4">
              Pagina's van {selectedUserId}
            </h2>
            {getUserPages(selectedUserId).length === 0 ? (
              <p className="text-zinc-600 dark:text-zinc-400">Geen pagina's</p>
            ) : (
              <div className="space-y-3">
                {getUserPages(selectedUserId).map((page) => (
                  <div
                    key={page.id}
                    className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-black dark:text-zinc-50">
                          {page.slug}
                        </p>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          page.subscriptionPlan === "pro"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            : page.subscriptionPlan === "start"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                        }`}>
                          {page.subscriptionPlan === "pro"
                            ? "Pro"
                            : page.subscriptionPlan === "start"
                            ? "Start"
                            : "Basis"}
                        </span>
                        {page.subscriptionStatus && (
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            page.subscriptionStatus === "active"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }`}>
                            {page.subscriptionStatus}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 font-mono">
                        /{page.slug}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                        Aangemaakt: {formatDate(page.createdAt)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditPage(page);
                        }}
                        className="px-4 py-2 bg-[#2E47FF] text-white rounded-lg text-sm font-medium hover:bg-[#1E37E6] transition-colors"
                      >
                        URL/Titel
                      </button>
                      <Link
                        href={`/dashboard/pages/${page.id}/edit`}
                        className="px-4 py-2 bg-zinc-600 text-white rounded-lg text-sm font-medium hover:bg-zinc-700 transition-colors"
                        target="_blank"
                      >
                        Bewerken
                      </Link>
                      <Link
                        href={`/${page.slug}`}
                        target="_blank"
                        className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-zinc-50 rounded-lg text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                      >
                        Bekijken
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Edit Page Modal */}
        {editingPage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-6 w-full max-w-md" style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <h2 className="text-xl font-semibold text-white mb-4">
                Pagina bewerken
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    URL (slug)
                  </label>
                  <input
                    type="text"
                    value={editPageForm.slug}
                    onChange={(e) => {
                      // Convert to lowercase and replace spaces with hyphens
                      let value = e.target.value.toLowerCase().replace(/\s+/g, "-");
                      
                      // Remove invalid characters (keep only a-z, 0-9, and hyphens)
                      value = value.replace(/[^a-z0-9-]/g, "");
                      
                      // Replace multiple consecutive hyphens with single hyphen
                      value = value.replace(/-+/g, "-");
                      
                      setEditPageForm({ ...editPageForm, slug: value });
                    }}
                    placeholder="my-page-name"
                    className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" style={{ border: '1px solid rgba(255, 255, 255, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white' }}
                  />
                  <p className="mt-1 text-xs text-zinc-400">
                    URL: /{editPageForm.slug || "..."}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Titel (optioneel)
                  </label>
                  <input
                    type="text"
                    value={editPageForm.title}
                    onChange={(e) => setEditPageForm({ ...editPageForm, title: e.target.value })}
                    placeholder="Mijn pagina titel"
                    className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" style={{ border: '1px solid rgba(255, 255, 255, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white' }}
                  />
                  <p className="mt-1 text-xs text-zinc-400">
                    Als leeg gelaten, wordt de slug gebruikt als titel
                  </p>
                </div>
                {editPageError && (
                  <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50">
                    <p className="text-sm text-red-400">{editPageError}</p>
                  </div>
                )}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setEditingPage(null);
                      setEditPageForm({ slug: "", title: "" });
                      setEditPageError(null);
                    }}
                    className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-black dark:text-zinc-50 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    style={{ border: '1px solid rgba(255, 255, 255, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white' }}
                  >
                    Annuleren
                  </button>
                  <button
                    onClick={handleSavePageEdit}
                    disabled={editPageLoading || !editPageForm.slug.trim()}
                    className="flex-1 px-4 py-2 bg-[#2E47FF] text-white rounded-lg font-medium hover:bg-[#1E37E6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editPageLoading ? "Opslaan..." : "Opslaan"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

