"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { LynqitPage } from "@/lib/lynqit-pages";
import { formatPageTitle } from "@/lib/utils";
import AuthGuard from "@/app/components/AuthGuard";
import DashboardSidebar from "@/app/components/DashboardSidebar";
import ConfirmModal from "@/app/components/ConfirmModal";
import { SUBSCRIPTION_PRICES, calculatePriceWithBTW } from "@/lib/pricing";
import { createClientClient } from "@/lib/supabase-client";

interface User {
  email: string;
  role: string;
  companyName?: string;
  firstName?: string;
  lastName?: string;
  vatNumber?: string;
  phoneNumber?: string;
}

export default function AccountPage() {
  useEffect(() => {
    document.title = "Account - Lynqit";
  }, []);

  const [user, setUser] = useState<User | null>(null);
  const [pages, setPages] = useState<LynqitPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "invoices" | "settings" | "subscriptions">("profile");
  const [subscriptionMessage, setSubscriptionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isProcessingSubscription, setIsProcessingSubscription] = useState<string | null>(null);
  const [isSyncingSubscriptions, setIsSyncingSubscriptions] = useState(false);
  const [hasSyncedSubscriptions, setHasSyncedSubscriptions] = useState(false);
  const [themePreference, setThemePreference] = useState<"light" | "dark" | "auto">("auto");
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    page: LynqitPage | null;
  }>({ isOpen: false, page: null });
  const [accessToken, setAccessToken] = useState<string | null>(null);
  
  // Form states
  const [companyName, setCompanyName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  
  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        const supabase = createClientClient();
        
        // Get current session from Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (error || !session || !session.user) {
          setIsLoading(false);
          router.push("/");
          return;
        }

        // Get user info from API
        const userResponse = await fetch(`/api/user?email=${encodeURIComponent(session.user.email || "")}`);
        if (!isMounted) return;
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          if (userData.user && isMounted) {
            const user = userData.user;
            setUser(user);
            setEmail(user.email);
            setCompanyName(user.companyName || "");
            setFirstName(user.firstName || "");
            setLastName(user.lastName || "");
            setVatNumber(user.vatNumber || "");
            setPhoneNumber(user.phoneNumber || "");
            
            // Store in localStorage for backward compatibility
            localStorage.setItem("lynqit_user", JSON.stringify(user));
            
            // Load theme preference from localStorage
            const savedTheme = localStorage.getItem("lynqit_dashboard_theme") as "light" | "dark" | "auto" | null;
            if (savedTheme) {
              setThemePreference(savedTheme);
            }
            
            // Store access token for later use
            setAccessToken(session.access_token);
            
            // Fetch user's pages with access token
            await fetchPages(session.access_token);
            // Fetch full user data from API
            await fetchUserData(user.email);
          }
        } else {
          setIsLoading(false);
          router.push("/");
        }
      } catch (error) {
        console.error("Error loading user:", error);
        if (isMounted) {
          setIsLoading(false);
          router.push("/");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, []); // Removed router to prevent loops

  const fetchUserData = async (userEmail: string) => {
    try {
      const response = await fetch(`/api/user?email=${encodeURIComponent(userEmail)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
          setCompanyName(data.user.companyName || "");
          setFirstName(data.user.firstName || "");
          setLastName(data.user.lastName || "");
          setVatNumber(data.user.vatNumber || "");
          setPhoneNumber(data.user.phoneNumber || "");
          setEmail(data.user.email || "");
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const fetchPages = async (accessToken: string) => {
    try {
      const response = await fetch(`/api/pages`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setPages(data.pages || []);
      }
    } catch (error) {
      console.error("Error fetching pages:", error);
    }
  };

  const syncSubscriptionsWithMollie = async () => {
    if (!user?.email) return;
    
    setIsSyncingSubscriptions(true);
    try {
      const response = await fetch("/api/subscription/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: user.email }),
      });

      if (response.ok) {
        const data = await response.json();
        // Refresh pages to get updated dates
        if (accessToken) {
          await fetchPages(accessToken);
        }
        setSubscriptionMessage({
          type: "success",
          text: `Abonnementen gesynchroniseerd. ${data.updatedPages.length} abonnement(en) bijgewerkt.`,
        });
        setTimeout(() => setSubscriptionMessage(null), 5000);
      } else {
        const errorData = await response.json();
        setSubscriptionMessage({
          type: "error",
          text: errorData.error || "Fout bij synchroniseren van abonnementen",
        });
        setTimeout(() => setSubscriptionMessage(null), 5000);
      }
    } catch (error) {
      console.error("Error syncing subscriptions:", error);
      setSubscriptionMessage({
        type: "error",
        text: "Er is een fout opgetreden bij het synchroniseren van abonnementen",
      });
      setTimeout(() => setSubscriptionMessage(null), 5000);
    } finally {
      setIsSyncingSubscriptions(false);
    }
  };

  // Auto-sync subscriptions when subscriptions tab is opened
  useEffect(() => {
    if (activeTab === "subscriptions" && user?.email && !hasSyncedSubscriptions) {
      setHasSyncedSubscriptions(true);
      // Small delay to ensure tab is rendered
      setTimeout(() => {
        syncSubscriptionsWithMollie();
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user?.email, hasSyncedSubscriptions]);

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch("/api/user/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          companyName,
          firstName,
          lastName,
          vatNumber,
          phoneNumber,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSaveMessage({ type: "success", text: "Profiel succesvol bijgewerkt!" });
        // Update localStorage
        if (data.user) {
          localStorage.setItem("lynqit_user", JSON.stringify(data.user));
          setUser(data.user);
        }
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setSaveMessage({ type: "error", text: data.error || "Fout bij het bijwerken van profiel" });
        setTimeout(() => setSaveMessage(null), 5000);
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      setSaveMessage({ type: "error", text: "Er is een fout opgetreden bij het opslaan" });
      setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;

    if (newPassword !== confirmPassword) {
      setSaveMessage({ type: "error", text: "Nieuwe wachtwoorden komen niet overeen" });
      setTimeout(() => setSaveMessage(null), 5000);
      return;
    }

    if (newPassword.length < 6) {
      setSaveMessage({ type: "error", text: "Nieuw wachtwoord moet minimaal 6 tekens lang zijn" });
      setTimeout(() => setSaveMessage(null), 5000);
      return;
    }

    setIsChangingPassword(true);
    setSaveMessage(null);

    try {
      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSaveMessage({ type: "success", text: "Wachtwoord succesvol gewijzigd!" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setSaveMessage({ type: "error", text: data.error || "Fout bij het wijzigen van wachtwoord" });
        setTimeout(() => setSaveMessage(null), 5000);
      }
    } catch (error) {
      console.error("Error changing password:", error);
      setSaveMessage({ type: "error", text: "Er is een fout opgetreden bij het wijzigen van wachtwoord" });
      setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      const response = await fetch("/api/invoice/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user?.email,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Fout bij het genereren van de factuur");
        return;
      }

      // Get HTML content
      const html = await response.text();
      const blob = new Blob([html], { type: "text/html" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `factuur-lynqit-${new Date().toISOString().split("T")[0]}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading invoice:", error);
      alert("Er is een fout opgetreden bij het downloaden van de factuur");
    }
  };

  // Don't show loading screen, just render empty state if needed

  // Filter paid pages
  const paidPages = pages.filter(
    (page) =>
      page.subscriptionPlan &&
      page.subscriptionPlan !== "free" &&
      page.subscriptionStatus === "active"
  );

  // Calculate totals
  const totalExBTW = paidPages.reduce((sum, page) => {
    const plan = page.subscriptionPlan;
    if (plan === "start") {
      return sum + SUBSCRIPTION_PRICES.start;
    } else if (plan === "pro") {
      return sum + SUBSCRIPTION_PRICES.pro;
    }
    return sum;
  }, 0);

  const totalBTW = totalExBTW * 0.21;
  const totalInclBTW = calculatePriceWithBTW(totalExBTW);

  const handleUpgradeDowngrade = async (pageId: string, newPlan: "start" | "pro" | "free") => {
    if (!user) return;

    setIsProcessingSubscription(pageId);
    setSubscriptionMessage(null);

    try {
      const response = await fetch("/api/subscription/change", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          pageId,
          newPlan,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (newPlan === "free") {
          setSubscriptionMessage({ 
            type: "success", 
            text: "Abonnement succesvol gedowngraded naar Lynqit Basis (gratis)." 
          });
          // Refresh pages
          if (accessToken) {
            await fetchPages(accessToken);
          }
          setTimeout(() => {
            setSubscriptionMessage(null);
            setIsProcessingSubscription(null);
          }, 3000);
        } else {
          setSubscriptionMessage({ 
            type: "success", 
            text: `Abonnement succesvol gewijzigd naar ${newPlan === "start" ? "Lynqit Start" : "Lynqit Pro"}. Je wordt doorgestuurd naar de betalingspagina...` 
          });
          // Refresh pages
          if (accessToken) {
            await fetchPages(accessToken);
          }
          // Redirect to payment if payment URL is provided
          if (data.paymentUrl) {
            setTimeout(() => {
              window.location.href = data.paymentUrl;
            }, 2000);
          } else {
            setTimeout(() => {
              setSubscriptionMessage(null);
              setIsProcessingSubscription(null);
            }, 3000);
          }
        }
      } else {
        setSubscriptionMessage({ type: "error", text: data.error || "Fout bij het wijzigen van abonnement" });
        setTimeout(() => {
          setSubscriptionMessage(null);
          setIsProcessingSubscription(null);
        }, 5000);
      }
    } catch (error) {
      console.error("Error changing subscription:", error);
      setSubscriptionMessage({ type: "error", text: "Er is een fout opgetreden bij het wijzigen van abonnement" });
      setTimeout(() => {
        setSubscriptionMessage(null);
        setIsProcessingSubscription(null);
      }, 5000);
    }
  };

  const handleCancelSubscription = async (pageId: string) => {
    if (!user) return;

    if (!confirm("Weet je zeker dat je dit abonnement wilt opzeggen? De pagina blijft beschikbaar tot het einde van de facturatieperiode.")) {
      return;
    }

    setIsProcessingSubscription(pageId);
    setSubscriptionMessage(null);

    try {
      const response = await fetch("/api/subscription/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          pageId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubscriptionMessage({ type: "success", text: "Abonnement succesvol opgezegd. De pagina blijft beschikbaar tot het einde van de facturatieperiode." });
        // Refresh pages
        if (accessToken) {
          await fetchPages(accessToken);
        }
        setTimeout(() => {
          setSubscriptionMessage(null);
          setIsProcessingSubscription(null);
        }, 5000);
      } else {
        setSubscriptionMessage({ type: "error", text: data.error || "Fout bij het opzeggen van abonnement" });
        setTimeout(() => {
          setSubscriptionMessage(null);
          setIsProcessingSubscription(null);
        }, 5000);
      }
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      setSubscriptionMessage({ type: "error", text: "Er is een fout opgetreden bij het opzeggen van abonnement" });
      setTimeout(() => {
        setSubscriptionMessage(null);
        setIsProcessingSubscription(null);
      }, 5000);
    }
  };

  const handleDeletePage = (page: LynqitPage) => {
    setDeleteModal({ isOpen: true, page });
  };

  const confirmDeletePage = async () => {
    if (!deleteModal.page || !user) return;

    const page = deleteModal.page;
    setIsProcessingSubscription(page.id);
    setSubscriptionMessage(null);

    try {
      // First cancel subscription if it exists
      if (page.subscriptionPlan && page.subscriptionPlan !== "free" && page.mollieSubscriptionId) {
        try {
          await fetch("/api/subscription/cancel", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: user.email,
              pageId: page.id,
            }),
          });
        } catch (error) {
          console.error("Error cancelling subscription:", error);
        }
      }

      // Then delete the page
      const response = await fetch(`/api/pages/${page.id}?userId=${encodeURIComponent(user.email)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        setSubscriptionMessage({ type: "error", text: errorData.error || "Fout bij verwijderen van pagina" });
        setTimeout(() => {
          setSubscriptionMessage(null);
          setIsProcessingSubscription(null);
        }, 5000);
        return;
      }

      setSubscriptionMessage({ type: "success", text: "Pagina succesvol verwijderd." });
      if (accessToken) {
        await fetchPages(accessToken);
      }
      setDeleteModal({ isOpen: false, page: null });
      setTimeout(() => {
        setSubscriptionMessage(null);
        setIsProcessingSubscription(null);
      }, 3000);
    } catch (error) {
      console.error("Error deleting page:", error);
      setSubscriptionMessage({ type: "error", text: "Er is een fout opgetreden bij het verwijderen van de pagina" });
      setTimeout(() => {
        setSubscriptionMessage(null);
        setIsProcessingSubscription(null);
      }, 5000);
    }
  };

  const getDeleteMessage = (page: LynqitPage) => {
    const isPaidPlan = page.subscriptionPlan && page.subscriptionPlan !== "free";
    
    let message = `Weet je zeker dat je de pagina "${formatPageTitle(page.slug)}" wilt verwijderen?\n\n`;
    
    if (isPaidPlan) {
      message += `⚠️ Deze pagina heeft een betaald abonnement (${page.subscriptionPlan === "start" ? "Start" : "Pro"}).\n\n`;
      message += `Het abonnement wordt stopgezet en de pagina wordt direct verwijderd.\n\n`;
    }
    
    message += "Deze actie kan niet ongedaan worden gemaakt.";
    return message;
  };

  return (
    <AuthGuard>
      <div className="min-h-screen font-sans flex" style={{ background: 'linear-gradient(#2F3441, #000)' }}>
        <DashboardSidebar />
        <div className="flex-1 ml-64">
          <div className="w-full px-8 py-8 mt-6 rounded-xl" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-white mb-2">
              Account
            </h1>
            <p className="text-zinc-400">
              Beheer je account en download facturen
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-6 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab("profile")}
                className={`pb-4 px-1 border-b-2 font-medium transition-colors ${
                  activeTab === "profile"
                    ? "border-[#2E47FF] text-[#2E47FF] dark:text-[#00F0EE]"
                    : "border-transparent text-zinc-400 hover:text-white"
                }`}
              >
                Profiel
              </button>
              <button
                onClick={() => setActiveTab("invoices")}
                className={`pb-4 px-1 border-b-2 font-medium transition-colors ${
                  activeTab === "invoices"
                    ? "border-[#2E47FF] text-[#2E47FF] dark:text-[#00F0EE]"
                    : "border-transparent text-zinc-400 hover:text-white"
                }`}
              >
                Facturen
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={`pb-4 px-1 border-b-2 font-medium transition-colors ${
                  activeTab === "settings"
                    ? "border-[#2E47FF] text-[#2E47FF] dark:text-[#00F0EE]"
                    : "border-transparent text-zinc-400 hover:text-white"
                }`}
              >
                Instellingen
              </button>
              <button
                onClick={() => setActiveTab("subscriptions")}
                className={`pb-4 px-1 border-b-2 font-medium transition-colors ${
                  activeTab === "subscriptions"
                    ? "border-[#2E47FF] text-[#2E47FF] dark:text-[#00F0EE]"
                    : "border-transparent text-zinc-400 hover:text-white"
                }`}
              >
                Abonnement(en) beheren
              </button>
            </div>
          </div>

          {(saveMessage || subscriptionMessage) && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                (saveMessage || subscriptionMessage)?.type === "success"
                  ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
              }`}
            >
              <p
                className={`text-sm ${
                  (saveMessage || subscriptionMessage)?.type === "success"
                    ? "text-green-800 dark:text-green-200"
                    : "text-red-800 dark:text-red-200"
                }`}
              >
                {(saveMessage || subscriptionMessage)?.text}
              </p>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              {/* Company Details */}
              <div className="rounded-xl p-6" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <h2 className="text-xl font-semibold text-white mb-4">
                  Bedrijfsgegevens
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Bedrijfsnaam
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" style={{ border: '1px solid rgba(255, 255, 255, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white' }}
                      placeholder="Bedrijfsnaam"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Voornaam
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" style={{ border: '1px solid rgba(255, 255, 255, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white' }}
                        placeholder="Voornaam"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Achternaam
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" style={{ border: '1px solid rgba(255, 255, 255, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white' }}
                        placeholder="Achternaam"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      BTW nummer
                    </label>
                    <input
                      type="text"
                      value={vatNumber}
                      onChange={(e) => setVatNumber(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" style={{ border: '1px solid rgba(255, 255, 255, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white' }}
                      placeholder="BTW nummer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Telefoonnummer
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" style={{ border: '1px solid rgba(255, 255, 255, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white' }}
                      placeholder="Telefoonnummer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      E-mailadres
                    </label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-400 cursor-not-allowed"
                      placeholder="E-mailadres"
                    />
                    <p className="text-xs text-zinc-400 mt-1">
                      E-mailadres kan niet worden gewijzigd
                    </p>
                  </div>
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="px-6 py-2 bg-[#2E47FF] text-white rounded-lg font-medium hover:bg-[#1E37E6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? "Opslaan..." : "Opslaan"}
                  </button>
                </div>
              </div>

              {/* Password Change */}
              <div className="rounded-xl p-6" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <h2 className="text-xl font-semibold text-white mb-4">
                  Wachtwoord wijzigen
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Huidig wachtwoord
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" style={{ border: '1px solid rgba(255, 255, 255, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white' }}
                      placeholder="Huidig wachtwoord"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Nieuw wachtwoord
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" style={{ border: '1px solid rgba(255, 255, 255, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white' }}
                      placeholder="Nieuw wachtwoord (minimaal 6 tekens)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Bevestig nieuw wachtwoord
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" style={{ border: '1px solid rgba(255, 255, 255, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white' }}
                      placeholder="Bevestig nieuw wachtwoord"
                    />
                  </div>
                  <button
                    onClick={handleChangePassword}
                    disabled={isChangingPassword}
                    className="px-6 py-2 bg-[#2E47FF] text-white rounded-lg font-medium hover:bg-[#1E37E6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isChangingPassword ? "Wijzigen..." : "Wachtwoord wijzigen"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="rounded-xl shadow-sm border p-6" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
              <h2 className="text-xl font-semibold text-white mb-6">
                Instellingen
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-3">
                    Dashboard Thema
                  </label>
                  <div className="space-y-3">
                    {(["light", "dark", "auto"] as const).map((theme) => (
                      <label
                        key={theme}
                        className="flex items-center gap-3 p-4 border border-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-800 transition-colors"
                      >
                        <input
                          type="radio"
                          name="theme"
                          value={theme}
                          checked={themePreference === theme}
                          onChange={(e) => {
                            const newTheme = e.target.value as "light" | "dark" | "auto";
                            setThemePreference(newTheme);
                            localStorage.setItem("lynqit_dashboard_theme", newTheme);
                            
                            // Apply theme immediately
                            const root = document.documentElement;
                            root.classList.remove("light", "dark");
                            
                            if (newTheme === "auto") {
                              // Use system preference
                              const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                              if (prefersDark) {
                                root.classList.add("dark");
                              } else {
                                root.classList.add("light");
                              }
                            } else {
                              root.classList.add(newTheme);
                            }
                            
                            // Trigger a custom event to update other components
                            window.dispatchEvent(new Event("themechange"));
                          }}
                          className="w-4 h-4 text-[#2E47FF] focus:ring-[#2E47FF]"
                        />
                        <span className="text-sm font-medium text-white">
                          {theme === "light" ? "Light Mode" : theme === "dark" ? "Dark Mode" : "Auto (systeem voorkeur)"}
                        </span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-zinc-400 mt-2">
                    Kies je voorkeur voor de dashboard omgeving. Auto gebruikt de voorkeur van je systeem.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Invoices Tab */}
          {activeTab === "invoices" && (
            <div className="rounded-xl shadow-sm border p-6" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-zinc-50">
                  Facturen
                </h2>
                {paidPages.length > 0 && (
                  <button
                    onClick={handleDownloadInvoice}
                    className="px-4 py-2 bg-[#2E47FF] text-white rounded-lg text-sm font-medium hover:bg-[#1E37E6] transition-colors"
                  >
                    Factuur downloaden
                  </button>
                )}
              </div>

              {paidPages.length === 0 ? (
                <p className="text-zinc-400">
                  Je hebt nog geen betaalde abonnementen. Facturen worden hier beschikbaar gesteld zodra je een betaald plan hebt.
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="border border-zinc-800 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Huidige abonnementen
                    </h3>
                    <div className="space-y-3 mb-4">
                      {paidPages.map((page) => {
                        const planPrice =
                          page.subscriptionPlan === "start"
                            ? SUBSCRIPTION_PRICES.start
                            : SUBSCRIPTION_PRICES.pro;

                        return (
                          <div
                            key={page.id}
                            className="flex justify-between items-center p-3 bg-zinc-800 rounded-lg"
                          >
                            <div>
                              <p className="font-medium text-white">
                                {formatPageTitle(page.slug)}
                              </p>
                              <p className="text-sm text-zinc-400">
                                {page.subscriptionPlan === "start"
                                  ? "Lynqit Start"
                                  : "Lynqit Pro"}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-white">
                                €{planPrice.toFixed(2)}/maand
                              </p>
                              <p className="text-xs text-zinc-400">
                                ex. BTW
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="border-t border-zinc-800 pt-4 mt-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-zinc-400">
                          Subtotaal (ex. BTW)
                        </span>
                        <span className="text-sm font-medium text-white">
                          €{totalExBTW.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-zinc-400">
                          BTW (21%)
                        </span>
                        <span className="text-sm font-medium text-white">
                          €{totalBTW.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-zinc-200 dark:border-zinc-800">
                        <span className="text-base font-semibold text-white">
                          Totaal (incl. BTW)
                        </span>
                        <span className="text-base font-semibold text-white">
                          €{totalInclBTW.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Subscriptions Tab */}
          {activeTab === "subscriptions" && (
            <div className="rounded-xl shadow-sm border p-6" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">
                  Abonnement(en) beheren
                </h2>
                <button
                  onClick={syncSubscriptionsWithMollie}
                  disabled={isSyncingSubscriptions}
                  className="px-4 py-2 bg-[#2E47FF] text-white rounded-lg text-sm font-medium hover:bg-[#1E37E6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSyncingSubscriptions ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Synchroniseren...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Synchroniseren met Mollie
                    </>
                  )}
                </button>
              </div>

              {pages.length === 0 ? (
                <p className="text-zinc-400">
                  Je hebt nog geen pagina's. Maak eerst een pagina aan via het dashboard.
                </p>
              ) : (
                <div className="space-y-4">
                  {pages.map((page) => {
                    const currentPlan = page.subscriptionPlan || "free";
                    const isActive = page.subscriptionStatus === "active";
                    const planPrice = currentPlan === "start" 
                      ? SUBSCRIPTION_PRICES.start 
                      : currentPlan === "pro" 
                      ? SUBSCRIPTION_PRICES.pro 
                      : 0;

                    return (
                      <div
                        key={page.id}
                        className="border border-zinc-800 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-lg font-semibold text-zinc-50 mb-1">
                              {formatPageTitle(page.slug)}
                            </h3>
                            <p className="text-sm text-zinc-400">
                              Huidig plan: {currentPlan === "free" ? "Lynqit Basis (Gratis)" : currentPlan === "start" ? "Lynqit Start" : "Lynqit Pro"}
                            </p>
                            {planPrice > 0 && (
                              <p className="text-sm text-zinc-400">
                                €{planPrice.toFixed(2)}/maand ex. BTW
                              </p>
                            )}
                            {isActive && currentPlan !== "free" && (
                              <div className="mt-3 space-y-1">
                                {page.subscriptionStartDate && (
                                  <p className="text-xs text-zinc-400">
                                    Gestart op: <span className="text-zinc-300 font-medium">{new Date(page.subscriptionStartDate).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}</span>
                                  </p>
                                )}
                                {page.subscriptionEndDate && (
                                  <p className="text-xs text-zinc-400">
                                    Volgende facturatie: <span className="text-zinc-300 font-medium">{new Date(page.subscriptionEndDate).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}</span>
                                  </p>
                                )}
                              </div>
                            )}
                            {!isActive && page.subscriptionEndDate && (
                              <p className="text-xs text-zinc-500 mt-1">
                                Loopt af op: {new Date(page.subscriptionEndDate).toLocaleDateString("nl-NL")}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-row gap-2">
                            {currentPlan === "free" && (
                              <button
                                onClick={() => handleDeletePage(page)}
                                disabled={isProcessingSubscription === page.id}
                                className="px-4 py-2 bg-red-800 text-white rounded-lg text-sm font-medium hover:bg-red-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                              >
                                {isProcessingSubscription === page.id ? "Verwerken..." : "Pagina verwijderen"}
                              </button>
                            )}
                            {currentPlan !== "pro" && currentPlan !== "free" && (
                              <button
                                onClick={() => handleUpgradeDowngrade(page.id, "pro")}
                                disabled={isProcessingSubscription === page.id}
                                className="px-4 py-2 bg-[#2E47FF] text-white rounded-lg text-sm font-medium hover:bg-[#1E37E6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                              >
                                {isProcessingSubscription === page.id ? "Verwerken..." : "Upgraden naar Pro"}
                              </button>
                            )}
                            {currentPlan === "pro" && (
                              <>
                                <button
                                  onClick={() => handleUpgradeDowngrade(page.id, "start")}
                                  disabled={isProcessingSubscription === page.id}
                                  className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                >
                                  {isProcessingSubscription === page.id ? "Verwerken..." : "Downgraden naar Start"}
                                </button>
                                <button
                                  onClick={() => handleUpgradeDowngrade(page.id, "free")}
                                  disabled={isProcessingSubscription === page.id}
                                  className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                >
                                  {isProcessingSubscription === page.id ? "Verwerken..." : "Downgraden naar Basis"}
                                </button>
                              </>
                            )}
                            {currentPlan === "start" && (
                              <button
                                onClick={() => handleUpgradeDowngrade(page.id, "free")}
                                disabled={isProcessingSubscription === page.id}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                              >
                                {isProcessingSubscription === page.id ? "Verwerken..." : "Downgraden naar Basis"}
                              </button>
                            )}
                            {currentPlan !== "free" && (
                              <button
                                onClick={() => handleCancelSubscription(page.id)}
                                disabled={isProcessingSubscription === page.id}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                              >
                                {isProcessingSubscription === page.id ? "Verwerken..." : "Opzeggen"}
                              </button>
                            )}
                            {currentPlan === "free" && (
                              <Link
                                href={`/register?plan=start&pageId=${page.id}`}
                                className="px-4 py-2 bg-[#2E47FF] text-white rounded-lg text-sm font-medium hover:bg-[#1E37E6] transition-colors text-center whitespace-nowrap"
                              >
                                Upgrade naar Start
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {deleteModal.page && (
            <ConfirmModal
              isOpen={deleteModal.isOpen}
              onClose={() => setDeleteModal({ isOpen: false, page: null })}
              onConfirm={confirmDeletePage}
              title="Pagina verwijderen"
              message={getDeleteMessage(deleteModal.page)}
              confirmText="Verwijderen"
              cancelText="Annuleren"
              variant="danger"
            />
          )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
