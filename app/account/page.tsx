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
  const [activeTab, setActiveTab] = useState<"profile" | "invoices" | "subscriptions">("profile");
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
  const [stripeSubscriptions, setStripeSubscriptions] = useState<Array<any>>([]);
  const [stripeInvoices, setStripeInvoices] = useState<Array<any>>([]);
  const [stripeProducts, setStripeProducts] = useState<Array<any>>([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  
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
        
        // Fallback to localStorage if session is not available
        let userEmail = "";
        if (error || !session || !session.user) {
          // Try to get user from localStorage
          const cachedUser = localStorage.getItem("lynqit_user");
          if (cachedUser) {
            try {
              const user = JSON.parse(cachedUser);
              userEmail = user.email || "";
            } catch (e) {
              // Ignore parse errors
            }
          }
          
          if (!userEmail) {
            setIsLoading(false);
            router.push("/");
            return;
          }
        } else {
          userEmail = session.user.email || "";
        }

        // Get user info from API
        const userResponse = await fetch(`/api/user?email=${encodeURIComponent(userEmail)}`);
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
            setAccessToken(session?.access_token || "");
            
            // Fetch user's pages with access token
            await fetchPages(session?.access_token || "");
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

  const fetchPages = async (accessToken: string | null = null) => {
    try {
      const supabase = createClientClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      // Get user email from session or localStorage
      let userEmail = session?.user?.email;
      if (!userEmail) {
        const cachedUser = localStorage.getItem("lynqit_user");
        if (cachedUser) {
          try {
            const user = JSON.parse(cachedUser);
            userEmail = user.email;
          } catch (e) {
            // Invalid cache
          }
        }
      }
      
      if (!userEmail) {
        console.error("[Account] No user email available for fetching pages");
        return;
      }

      // Use access token if available, otherwise use email parameter
      const pagesUrl = (accessToken || session?.access_token)
        ? `/api/pages`
        : `/api/pages?email=${encodeURIComponent(userEmail)}`;
      
      const fetchOptions: RequestInit = (accessToken || session?.access_token)
        ? { headers: { "Authorization": `Bearer ${accessToken || session?.access_token}` } }
        : {};

      console.log("[Account] Fetching pages:", { 
        hasToken: !!(accessToken || session?.access_token),
        userEmail,
        url: pagesUrl 
      });

      const response = await fetch(pagesUrl, fetchOptions);
      if (response.ok) {
        const data = await response.json();
        console.log("[Account] Pages fetched:", data.pages?.length || 0, "pages");
        setPages(data.pages || []);
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("[Account] Error fetching pages:", response.status, errorData);
      }
    } catch (error) {
      console.error("[Account] Error fetching pages:", error);
    }
  };

  const syncSubscriptionsWithStripe = async () => {
    if (!user?.email) {
      console.warn("[Account] No user email available for syncing subscriptions");
      return;
    }
    
    console.log("[Account] Starting sync with Stripe for email:", user.email);
    setIsSyncingSubscriptions(true);
    setLoadingSubscriptions(true);
    try {
      // First, fetch pages to get any stripeSubscriptionIds from database
      await fetchPages(accessToken);
      
      // Collect all subscription IDs from pages
      const subscriptionIdsFromPages = pages
        .filter(page => page.stripeSubscriptionId)
        .map(page => page.stripeSubscriptionId!);
      
      console.log("[Account] Found", subscriptionIdsFromPages.length, "subscription IDs from pages:", subscriptionIdsFromPages);
      
      // Fetch subscriptions by email
      console.log("[Account] Fetching subscriptions from API...");
      const subscriptionsResponse = await fetch(`/api/stripe/subscription/find-by-email?email=${encodeURIComponent(user.email)}`);
      console.log("[Account] Subscriptions response status:", subscriptionsResponse.status);
      
      let subscriptionsFromEmail: any[] = [];
      if (subscriptionsResponse.ok) {
        const subscriptionsData = await subscriptionsResponse.json();
        console.log("[Account] Subscriptions data received:", subscriptionsData);
        console.log("[Account] Number of subscriptions:", subscriptionsData.subscriptions?.length || 0);
        subscriptionsFromEmail = subscriptionsData.subscriptions || [];
      } else {
        const errorData = await subscriptionsResponse.json().catch(() => ({ error: "Unknown error" }));
        console.error("[Account] Error fetching subscriptions:", subscriptionsResponse.status, errorData);
      }
      
      // DEBUG: Try to fetch subscription directly if we know the ID (temporary for debugging)
      if (subscriptionsFromEmail.length === 0) {
        console.log("[Account] DEBUG: Trying to fetch subscription directly by known ID...");
        const knownSubscriptionIds = ['sub_1Sn5w6GfVyKVnOf9dV7yanUC']; // From Stripe dashboard
        const directSubs = await Promise.all(
          knownSubscriptionIds.map(async (subId) => {
            try {
              const response = await fetch(`/api/stripe/subscription/${subId}`);
              if (response.ok) {
                const data = await response.json();
                console.log("[Account] DEBUG: Successfully fetched subscription", subId);
                return data.subscription;
              } else {
                const error = await response.json().catch(() => ({ error: "Unknown" }));
                console.log("[Account] DEBUG: Failed to fetch subscription", subId, ":", error);
              }
              return null;
            } catch (error) {
              console.error("[Account] DEBUG: Error fetching subscription", subId, ":", error);
              return null;
            }
          })
        );
        const validDirectSubs = directSubs.filter(sub => sub !== null);
        if (validDirectSubs.length > 0) {
          console.log("[Account] DEBUG: Found", validDirectSubs.length, "subscriptions via direct fetch!");
          subscriptionsFromEmail = validDirectSubs;
        }
      }
      
      // If we have subscription IDs from pages but not from email search, fetch them directly
      if (subscriptionIdsFromPages.length > 0 && subscriptionsFromEmail.length === 0) {
        console.log("[Account] Fetching subscriptions directly by ID...");
        const directSubscriptions = await Promise.all(
          subscriptionIdsFromPages.map(async (subId) => {
            try {
              const response = await fetch(`/api/stripe/subscription/${subId}`);
              if (response.ok) {
                const data = await response.json();
                return data.subscription;
              }
              return null;
            } catch (error) {
              console.error("[Account] Error fetching subscription", subId, ":", error);
              return null;
            }
          })
        );
        const validSubscriptions = directSubscriptions.filter(sub => sub !== null);
        if (validSubscriptions.length > 0) {
          console.log("[Account] Found", validSubscriptions.length, "subscriptions via direct ID fetch");
          subscriptionsFromEmail = validSubscriptions;
        }
      }
      
      setStripeSubscriptions(subscriptionsFromEmail);
      console.log("[Account] Loaded", subscriptionsFromEmail.length, "Stripe subscriptions total");

      // Fetch all invoices
      setLoadingInvoices(true);
      try {
        const invoicesResponse = await fetch(`/api/stripe/invoices?email=${encodeURIComponent(user.email)}`);
        if (invoicesResponse.ok) {
          const invoicesData = await invoicesResponse.json();
          setStripeInvoices(invoicesData.invoices || []);
          console.log("[Account] Loaded", invoicesData.invoices?.length || 0, "invoices");
          
        }
      } catch (error) {
        console.error("[Account] Error loading invoices:", error);
      } finally {
        setLoadingInvoices(false);
      }

      // Fetch products for upgrade/downgrade options
      const productsResponse = await fetch(`/api/stripe/products`);
      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        setStripeProducts(productsData.products || []);
      }

      // Refresh pages to sync with Stripe data
      await fetchPages(accessToken);
      
      setSubscriptionMessage({
        type: "success",
        text: "Abonnementen bijgewerkt vanuit Stripe.",
      });
      setTimeout(() => setSubscriptionMessage(null), 5000);
    } catch (error) {
      console.error("Error syncing subscriptions:", error);
      setSubscriptionMessage({
        type: "error",
        text: "Er is een fout opgetreden bij het synchroniseren van abonnementen",
      });
      setTimeout(() => setSubscriptionMessage(null), 5000);
    } finally {
      setIsSyncingSubscriptions(false);
      setLoadingSubscriptions(false);
    }
  };


  // Auto-load Stripe subscriptions when subscriptions tab is opened
  useEffect(() => {
    if (activeTab === "subscriptions" && user?.email) {
      console.log("[Account] Subscriptions tab opened, hasSyncedSubscriptions:", hasSyncedSubscriptions, "stripeSubscriptions.length:", stripeSubscriptions.length);
      if (!hasSyncedSubscriptions || stripeSubscriptions.length === 0) {
        if (!hasSyncedSubscriptions) {
          setHasSyncedSubscriptions(true);
        }
        // Small delay to ensure tab is rendered
        setTimeout(() => {
          console.log("[Account] Auto-loading subscriptions...");
          syncSubscriptionsWithStripe();
        }, 100);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user?.email]);

  // Auto-load invoices when invoices tab is opened
  useEffect(() => {
    if (activeTab === "invoices" && user?.email && stripeInvoices.length === 0 && !loadingInvoices) {
      setLoadingInvoices(true);
      fetch(`/api/stripe/invoices?email=${encodeURIComponent(user.email)}`)
        .then(response => response.json())
        .then(data => {
          setStripeInvoices(data.invoices || []);
        })
        .catch(error => {
          console.error("Error loading invoices:", error);
        })
        .finally(() => {
          setLoadingInvoices(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user?.email]);


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

  const handleUpgradeDowngrade = async (subscriptionId: string, newPriceId: string, pageId?: string) => {
    if (!user) return;

    setIsProcessingSubscription(subscriptionId);
    setSubscriptionMessage(null);

    try {
      const response = await fetch("/api/stripe/subscription/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscriptionId,
          newPriceId,
          pageId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubscriptionMessage({ 
          type: "success", 
          text: "Abonnement succesvol bijgewerkt." 
        });
        // Refresh Stripe subscriptions
        await syncSubscriptionsWithStripe();
        setTimeout(() => {
          setSubscriptionMessage(null);
          setIsProcessingSubscription(null);
        }, 3000);
      } else {
        setSubscriptionMessage({ type: "error", text: data.error || data.details || "Fout bij het wijzigen van abonnement" });
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

  const handleCancelSubscription = async (subscriptionId: string, pageId?: string) => {
    if (!user) return;

    if (!confirm("Weet je zeker dat je dit abonnement wilt annuleren? De pagina blijft beschikbaar tot het einde van de facturatieperiode.")) {
      return;
    }

    setIsProcessingSubscription(subscriptionId);
    setSubscriptionMessage(null);

    try {
      const response = await fetch("/api/stripe/subscription/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscriptionId,
          pageId,
          cancelImmediately: false, // Cancel at period end
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubscriptionMessage({ type: "success", text: "Abonnement succesvol geannuleerd. De pagina blijft beschikbaar tot het einde van de facturatieperiode." });
        // Refresh Stripe subscriptions
        await syncSubscriptionsWithStripe();
        setTimeout(() => {
          setSubscriptionMessage(null);
          setIsProcessingSubscription(null);
        }, 5000);
      } else {
        setSubscriptionMessage({ type: "error", text: data.error || data.details || "Fout bij het annuleren van abonnement" });
        setTimeout(() => {
          setSubscriptionMessage(null);
          setIsProcessingSubscription(null);
        }, 5000);
      }
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      setSubscriptionMessage({ type: "error", text: "Er is een fout opgetreden bij het annuleren van abonnement" });
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
      if (page.subscriptionPlan && page.subscriptionPlan !== "free" && page.stripeSubscriptionId) {
        try {
          // Cancel Stripe subscription via webhook or direct API call
          // For now, just mark as cancelled in database
          await fetch(`/api/pages/${page.id}`, {
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

          {/* Invoices Tab */}
          {activeTab === "invoices" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-semibold text-white mb-2">
                    Facturen
                  </h2>
                  <p className="text-zinc-400 text-sm">
                    Bekijk en download al je Stripe facturen
                  </p>
                </div>
                <button
                  onClick={async () => {
                    if (user?.email) {
                      setLoadingInvoices(true);
                      try {
                        const invoicesResponse = await fetch(`/api/stripe/invoices?email=${encodeURIComponent(user.email)}`);
                        if (invoicesResponse.ok) {
                          const invoicesData = await invoicesResponse.json();
                          setStripeInvoices(invoicesData.invoices || []);
                        }
                      } catch (error) {
                        console.error("Error loading invoices:", error);
                      } finally {
                        setLoadingInvoices(false);
                      }
                    }
                  }}
                  disabled={loadingInvoices}
                  className="px-4 py-2 bg-[#2E47FF] text-white rounded-lg text-sm font-medium hover:bg-[#1E37E6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loadingInvoices ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Laden...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Ververs facturen
                    </>
                  )}
                </button>
              </div>

              {loadingInvoices ? (
                <div className="flex items-center justify-center py-12">
                  <svg className="animate-spin h-8 w-8 text-[#2E47FF]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="ml-3 text-zinc-400">Facturen laden vanuit Stripe...</span>
                </div>
              ) : stripeInvoices.length === 0 ? (
                <div className="rounded-xl shadow-sm border p-8 text-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                  <p className="text-zinc-400">
                    Je hebt nog geen facturen. Facturen worden hier automatisch getoond vanuit Stripe zodra je een betaald abonnement hebt.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {stripeInvoices.map((invoice: any) => (
                    <div
                      key={invoice.id}
                      className="rounded-xl shadow-sm border p-6" 
                      style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-white">
                              Factuur {invoice.number || invoice.id}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              invoice.status === 'paid' ? 'bg-green-500/20 text-green-400' :
                              invoice.status === 'open' ? 'bg-yellow-500/20 text-yellow-400' :
                              invoice.status === 'void' ? 'bg-gray-500/20 text-gray-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {invoice.status}
                            </span>
                          </div>
                          <p className="text-sm text-zinc-400">
                            {new Date(invoice.created * 1000).toLocaleDateString("nl-NL", { 
                              day: "numeric", 
                              month: "long",
                              year: "numeric"
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-semibold text-white">
                            €{(invoice.amount_due / 100).toFixed(2)}
                          </p>
                          <p className="text-xs text-zinc-400 uppercase">
                            {invoice.currency}
                          </p>
                        </div>
                      </div>
                      
                      {invoice.line_items && invoice.line_items.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-zinc-300 mb-2">Items:</h4>
                          <div className="space-y-2">
                            {invoice.line_items.map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span className="text-zinc-400">{item.description || 'Abonnement'}</span>
                                <span className="text-zinc-300">€{(item.amount / 100).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        {invoice.hosted_invoice_url && (
                          <a
                            href={invoice.hosted_invoice_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-[#2E47FF] text-white rounded-lg text-sm font-medium hover:bg-[#1E37E6] transition-colors inline-flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Bekijk in Stripe
                          </a>
                        )}
                        {invoice.invoice_pdf && (
                          <a
                            href={invoice.invoice_pdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-zinc-700 text-white rounded-lg text-sm font-medium hover:bg-zinc-600 transition-colors inline-flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download PDF
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Subscriptions Tab */}
          {activeTab === "subscriptions" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-semibold text-white mb-2">
                    Abonnement(en) beheren
                  </h2>
                </div>
              </div>

              {loadingSubscriptions ? (
                <div className="flex items-center justify-center py-12">
                  <svg className="animate-spin h-8 w-8 text-[#2E47FF]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="ml-3 text-zinc-400">Pagina&apos;s ophalen...</span>
                </div>
              ) : stripeSubscriptions.length === 0 ? (
                <div className="rounded-xl shadow-sm border p-8 text-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                  <p className="text-zinc-400 mb-4">
                    Je hebt nog geen Stripe abonnementen.
                  </p>
                  <Link
                    href="/register"
                    className="inline-block px-4 py-2 bg-[#2E47FF] text-white rounded-lg text-sm font-medium hover:bg-[#1E37E6] transition-colors"
                  >
                    Maak een abonnement aan
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {stripeSubscriptions.map((subscription: any) => {
                    // Find associated page if exists
                    const associatedPage = pages.find(p => p.stripeSubscriptionId === subscription.id);
                    const isLoadingStripe = false; // We already loaded it
                    const stripeData = subscription;

                    // Get product name and price from subscription items
                    const productName = stripeData.items?.[0]?.price?.product?.name || "Onbekend plan";
                    const productPrice = stripeData.items?.[0]?.price?.unit_amount || 0;
                    const productPriceId = stripeData.items?.[0]?.price?.id;
                    
                    // Find available upgrade/downgrade options
                    const availableProducts = stripeProducts.filter((p: any) => {
                      const pPrice = p.prices?.[0]?.unit_amount || 0;
                      return pPrice !== productPrice; // Different price means different plan
                    });

                    return (
                      <div
                        key={subscription.id}
                        className="rounded-xl shadow-sm border overflow-hidden" 
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }}
                      >
                        {/* Header Section */}
                        <div className="p-6 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <h3 className="text-xl font-semibold text-white">
                                  {associatedPage ? formatPageTitle(associatedPage.slug) : productName}
                                </h3>
                              </div>
                              <div className="flex items-center gap-4 text-sm">
                                <div>
                                  <span className="text-zinc-500">Plan:</span>
                                  <span className="text-zinc-300 ml-2 font-medium">
                                    {productName}
                                  </span>
                                </div>
                                {productPrice > 0 && (
                                  <div>
                                    <span className="text-zinc-500">Prijs:</span>
                                    <span className="text-zinc-300 ml-2 font-medium">
                                      €{(productPrice / 100).toFixed(2)}/maand ex. BTW
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {stripeData.status === 'active' && !stripeData.cancel_at_period_end && availableProducts.length > 0 && (
                                <>
                                  {availableProducts.map((product: any) => {
                                    const newPriceId = product.prices?.[0]?.id;
                                    if (!newPriceId) return null;
                                    const isUpgrade = (product.prices?.[0]?.unit_amount || 0) > productPrice;
                                    return (
                                      <button
                                        key={product.id}
                                        onClick={() => handleUpgradeDowngrade(subscription.id, newPriceId, associatedPage?.id)}
                                        disabled={isProcessingSubscription === subscription.id}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${
                                          isUpgrade 
                                            ? 'bg-[#2E47FF] text-white hover:bg-[#1E37E6]'
                                            : 'bg-orange-600 text-white hover:bg-orange-700'
                                        }`}
                                      >
                                        {isProcessingSubscription === subscription.id ? "Verwerken..." : `${isUpgrade ? 'Upgrade' : 'Downgrade'} naar ${product.name}`}
                                      </button>
                                    );
                                  })}
                                </>
                              )}
                              {stripeData.status === 'active' && !stripeData.cancel_at_period_end && (
                                <button
                                  onClick={() => handleCancelSubscription(subscription.id, associatedPage?.id)}
                                  disabled={isProcessingSubscription === subscription.id}
                                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                >
                                  {isProcessingSubscription === subscription.id ? "Verwerken..." : "Annuleren"}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Stripe Subscription Details - Always show from Stripe */}
                        <div className="p-6">
                          {stripeData ? (
                              <div className="space-y-6">
                                {/* Main Info Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {/* Facturatieperiode Card */}
                                  {stripeData.current_period_start && stripeData.current_period_end && (
                                    <div className="rounded-lg p-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                                      <div className="flex items-center gap-2 mb-2">
                                        <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <h4 className="text-sm font-semibold text-zinc-300">Facturatieperiode</h4>
                                      </div>
                                      <p className="text-sm text-zinc-300">
                                        {new Date(stripeData.current_period_start * 1000).toLocaleDateString("nl-NL", { 
                                          day: "numeric", 
                                          month: "short"
                                        })}
                                      </p>
                                      <p className="text-sm text-zinc-300">
                                        tot {new Date(stripeData.current_period_end * 1000).toLocaleDateString("nl-NL", { 
                                          day: "numeric", 
                                          month: "short",
                                          year: "numeric"
                                        })}
                                      </p>
                                    </div>
                                  )}

                                  {/* Cancel Info Card */}
                                  {(stripeData.cancel_at_period_end || stripeData.canceled_at || stripeData.cancel_at) && (
                                    <div className="rounded-lg p-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                                      <div className="flex items-center gap-2 mb-2">
                                        <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        <h4 className="text-sm font-semibold text-zinc-300">Annulering</h4>
                                      </div>
                                      {stripeData.cancel_at_period_end && (
                                        <p className="text-sm text-orange-400">Wordt opgezegd aan einde periode</p>
                                      )}
                                      {stripeData.canceled_at && (
                                        <p className="text-sm text-red-400">
                                          Geannuleerd: {new Date(stripeData.canceled_at * 1000).toLocaleDateString("nl-NL", { 
                                            day: "numeric", 
                                            month: "short",
                                            year: "numeric"
                                          })}
                                        </p>
                                      )}
                                      {stripeData.cancel_at && (
                                        <p className="text-sm text-orange-400">
                                          Wordt geannuleerd: {new Date(stripeData.cancel_at * 1000).toLocaleDateString("nl-NL", { 
                                            day: "numeric", 
                                            month: "short",
                                            year: "numeric"
                                          })}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  {/* Customer Details */}
                                  {stripeData.customerDetails && (
                                    <div className="rounded-lg p-5" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                                      <h4 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        Klantgegevens
                                      </h4>
                                      <div className="space-y-2 text-sm">
                                        {stripeData.customerDetails.email && (
                                          <div>
                                            <span className="text-zinc-500">Email:</span>
                                            <span className="text-zinc-300 ml-2">{stripeData.customerDetails.email}</span>
                                          </div>
                                        )}
                                        {stripeData.customerDetails.name && (
                                          <div>
                                            <span className="text-zinc-500">Naam:</span>
                                            <span className="text-zinc-300 ml-2">{stripeData.customerDetails.name}</span>
                                          </div>
                                        )}
                                        {stripeData.customerDetails.phone && (
                                          <div>
                                            <span className="text-zinc-500">Telefoon:</span>
                                            <span className="text-zinc-300 ml-2">{stripeData.customerDetails.phone}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Payment Method */}
                                  {stripeData.default_payment_method_details && (
                                    <div className="rounded-lg p-5" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                                      <h4 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                        </svg>
                                        Betaalmethode
                                      </h4>
                                      {stripeData.default_payment_method_details.type === 'card' && 
                                       stripeData.default_payment_method_details.card && (
                                        <div className="space-y-2 text-sm">
                                          <div>
                                            <span className="text-zinc-500">Type:</span>
                                            <span className="text-zinc-300 ml-2 capitalize">{stripeData.default_payment_method_details.card.brand}</span>
                                          </div>
                                          <div>
                                            <span className="text-zinc-500">Kaartnummer:</span>
                                            <span className="text-zinc-300 ml-2 font-mono">
                                              •••• {stripeData.default_payment_method_details.card.last4}
                                            </span>
                                          </div>
                                          <div>
                                            <span className="text-zinc-500">Vervaldatum:</span>
                                            <span className="text-zinc-300 ml-2">
                                              {stripeData.default_payment_method_details.card.exp_month}/{stripeData.default_payment_method_details.card.exp_year}
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Subscription Items */}
                                {stripeData.items && stripeData.items.length > 0 && (
                                  <div className="rounded-lg p-5" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                                    <h4 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
                                      <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                      </svg>
                                      Abonnement Items
                                    </h4>
                                    <div className="space-y-3">
                                      {stripeData.items.map((item: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-start p-3 rounded border" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                                          <div className="flex-1">
                                            {typeof item.price.product === 'object' && item.price.product && (
                                              <div className="font-medium text-zinc-300 mb-1">
                                                {item.price.product.name}
                                              </div>
                                            )}
                                            {typeof item.price.product === 'object' && item.price.product && item.price.product.description && (
                                              <p className="text-xs text-zinc-500 mb-2">{item.price.product.description}</p>
                                            )}
                                            <div className="text-sm text-zinc-400">
                                              {item.price.recurring?.interval && (
                                                <span>Per {item.price.recurring.interval}</span>
                                              )}
                                              {item.quantity > 1 && (
                                                <span className="ml-2">× {item.quantity}</span>
                                              )}
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            <div className="text-lg font-semibold text-white">
                                              €{(item.price.unit_amount / 100).toFixed(2)}
                                            </div>
                                            <div className="text-xs text-zinc-500 uppercase">
                                              {item.price.currency}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : null}
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
