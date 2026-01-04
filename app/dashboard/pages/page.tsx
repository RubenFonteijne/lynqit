"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { LynqitPage } from "@/lib/lynqit-pages";
import { formatPageTitle } from "@/lib/utils";
import DashboardSidebar from "@/app/components/DashboardSidebar";
import ConfirmModal from "@/app/components/ConfirmModal";
import { SUBSCRIPTION_PRICES, calculatePriceWithBTW } from "@/lib/pricing";
import { createClientClient } from "@/lib/supabase-client";

export default function PagesManagementPage() {
  const [pages, setPages] = useState<LynqitPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [newSlug, setNewSlug] = useState("");
  const [demoSlug, setDemoSlug] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<"free" | "start" | "pro">("free");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("creditcard");
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<Array<{ id: string; description: string; available: boolean }>>([
    { id: 'creditcard', description: 'Creditcard', available: true },
    { id: 'paypal', description: 'PayPal', available: true },
  ]);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isCreatingDemo, setIsCreatingDemo] = useState(false);
  const [error, setError] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    page: LynqitPage | null;
  }>({ isOpen: false, page: null });
  const router = useRouter();

  useEffect(() => {
    document.title = "Pages - Lynqit";
  }, []);

  // Fetch available payment methods from Mollie
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const response = await fetch("/api/payment/methods");
        if (response.ok) {
          const data = await response.json();
          if (data.methods && data.methods.length > 0) {
            setAvailablePaymentMethods(data.methods);
            // Set default to first available method
            if (data.methods[0]?.id) {
              setSelectedPaymentMethod(data.methods[0].id);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching payment methods:", error);
        // Keep default methods on error
      }
    };

    fetchPaymentMethods();
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const loadUser = async () => {
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
        const response = await fetch(`/api/user?email=${encodeURIComponent(session.user.email || "")}`);
        if (!isMounted) return;
        
        if (response.ok) {
          const userData = await response.json();
          if (userData.user && isMounted) {
            setUserEmail(userData.user.email);
            setIsAdmin(userData.user.role === 'admin');
            // Store in localStorage for backward compatibility
            localStorage.setItem("lynqit_user", JSON.stringify(userData.user));
            
            // Show cached pages immediately for instant UI
            const cachedPages = localStorage.getItem("lynqit_pages");
            if (cachedPages && isMounted) {
              try {
                const pages = JSON.parse(cachedPages);
                const cacheTimestamp = localStorage.getItem("lynqit_pages_timestamp");
                if (cacheTimestamp) {
                  const age = Date.now() - parseInt(cacheTimestamp);
                  if (age < 5 * 60 * 1000) { // 5 minutes
                    setPages(pages);
                  }
                }
              } catch (e) {
                // Invalid cache, continue to fetch
              }
            }
            
            // Fetch user's pages with access token
            const pagesResponse = await fetch(`/api/pages`, {
              headers: {
                "Authorization": `Bearer ${session.access_token}`,
              },
            });
            if (isMounted && pagesResponse.ok) {
              const pagesData = await pagesResponse.json();
              const freshPages = pagesData.pages || [];
              setPages(freshPages);
              // Cache pages for next time
              localStorage.setItem("lynqit_pages", JSON.stringify(freshPages));
              localStorage.setItem("lynqit_pages_timestamp", Date.now().toString());
            }
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

    loadUser();
    
    return () => {
      isMounted = false;
    };
  }, []); // Removed router from dependencies to prevent loops

  const fetchPages = async () => {
    try {
      const supabase = createClientClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session || !session.access_token) {
        setIsLoading(false);
        return;
      }

      const response = await fetch(`/api/pages`, {
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch pages: ${response.status}`);
      }
      const data = await response.json();
      const freshPages = data.pages || [];
      setPages(freshPages);
      // Cache pages for next time
      localStorage.setItem("lynqit_pages", JSON.stringify(freshPages));
      localStorage.setItem("lynqit_pages_timestamp", Date.now().toString());
    } catch (error) {
      console.error("Error fetching pages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!newSlug.trim() || !userEmail) return;

    // Clean up slug: remove leading/trailing hyphens and validate
    const cleanedSlug = newSlug.trim().toLowerCase().replace(/\s+/g, "-").replace(/^-+|-+$/g, "");
    
    if (!cleanedSlug || cleanedSlug.trim() === "") {
      setError("Slug mag niet alleen uit streepjes bestaan");
      return;
    }

    // Validate slug format (lowercase letters, numbers, and hyphens only)
    if (!/^[a-z0-9-]+$/.test(cleanedSlug)) {
      setError("Slug mag alleen kleine letters, cijfers en streepjes bevatten");
      return;
    }
    
    // Ensure slug doesn't start or end with hyphen
    if (cleanedSlug.startsWith("-") || cleanedSlug.endsWith("-")) {
      setError("Slug mag niet beginnen of eindigen met een streepje");
      return;
    }

    try {
      // Get access token from Supabase session
      const supabase = createClientClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session || !session.access_token) {
        setError("Je bent niet ingelogd. Log opnieuw in.");
        return;
      }

      // Always create the Lynqit page first (with free plan by default)
      const response = await fetch("/api/pages", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          slug: cleanedSlug,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Kon pagina niet aanmaken");
        return;
      }

      const data = await response.json();
      const pageId = data.page?.id;
      
      if (!pageId) {
        setError("Pagina aangemaakt maar kon ID niet ophalen");
        return;
      }

      // Handle paid plans - create payment via Mollie (with pageId)
      if (selectedPlan !== "free") {
        setIsProcessingPayment(true);
        
        // Create payment for subscription with pageId
        const paymentResponse = await fetch("/api/payment/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: userEmail,
            plan: selectedPlan,
            pageId: pageId,
            paymentMethod: selectedPaymentMethod,
          }),
        });

        const paymentData = await paymentResponse.json();

        if (!paymentResponse.ok) {
          setError(paymentData.error || "Kon betaling niet aanmaken");
          setIsProcessingPayment(false);
          return;
        }

        // Redirect to Mollie payment page
        if (paymentData.paymentUrl) {
          window.location.href = paymentData.paymentUrl;
        } else {
          setError("Kon betalingslink niet genereren");
          setIsProcessingPayment(false);
        }
        return;
      }

      // For free plan - close modal and redirect to edit page
      setShowCreateModal(false);
      setNewSlug("");
      setSelectedPlan("free");
      router.push(`/dashboard/pages/${pageId}/edit`);
    } catch (error) {
      console.error("Error creating page:", error);
      setError("Er is een fout opgetreden bij het aanmaken van de pagina");
    }
  };

  const handleCreateDemo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!demoSlug.trim() || !userEmail) return;

    // Clean up slug: remove leading/trailing hyphens and validate
    const cleanedSlug = demoSlug.trim().toLowerCase().replace(/\s+/g, "-").replace(/^-+|-+$/g, "");
    
    if (!cleanedSlug || cleanedSlug.trim() === "") {
      setError("Slug mag niet alleen uit streepjes bestaan");
      return;
    }

    // Validate slug format (lowercase letters, numbers, and hyphens only)
    if (!/^[a-z0-9-]+$/.test(cleanedSlug)) {
      setError("Slug mag alleen kleine letters, cijfers en streepjes bevatten");
      return;
    }
    
    // Ensure slug doesn't start or end with hyphen
    if (cleanedSlug.startsWith("-") || cleanedSlug.endsWith("-")) {
      setError("Slug mag niet beginnen of eindigen met een streepje");
      return;
    }

    try {
      setIsCreatingDemo(true);
      
      // Get access token from Supabase session
      const supabase = createClientClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session || !session.access_token) {
        setError("Je bent niet ingelogd. Log opnieuw in.");
        setIsCreatingDemo(false);
        return;
      }

      // Create demo page with Pro plan
      const response = await fetch("/api/pages/demo", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          slug: cleanedSlug,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Kon demo pagina niet aanmaken");
        setIsCreatingDemo(false);
        return;
      }

      const data = await response.json();
      const pageId = data.page?.id;
      
      if (!pageId) {
        setError("Demo pagina aangemaakt maar kon ID niet ophalen");
        setIsCreatingDemo(false);
        return;
      }

      // Close modal and reset
      setShowDemoModal(false);
      setDemoSlug("");
      setError("");

      // Refresh pages list
      await fetchPages();
      
      // Redirect to edit page
      router.push(`/dashboard/pages/${pageId}/edit`);
    } catch (error) {
      console.error("Error creating demo page:", error);
      setError("Er is een fout opgetreden bij het aanmaken van de demo pagina");
      setIsCreatingDemo(false);
    }
  };

  const handleDeletePage = (page: LynqitPage) => {
    setDeleteModal({ isOpen: true, page });
  };

  const confirmDelete = async () => {
    if (!deleteModal.page || !userEmail) return;

    const page = deleteModal.page;
    setIsDeleting(page.id);
    
    try {
      const response = await fetch(`/api/pages/${page.id}?userId=${encodeURIComponent(userEmail)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Show error in a simple alert for now (could be replaced with custom modal)
        alert(errorData.error || "Fout bij verwijderen van pagina");
        setDeleteModal({ isOpen: false, page: null });
        return;
      }

      // Refresh pages list
      await fetchPages();
    } catch (error) {
      console.error("Error deleting page:", error);
      // Show error in a simple alert for now (could be replaced with custom modal)
      alert("Er is een fout opgetreden bij het verwijderen van de pagina");
    } finally {
      setIsDeleting(null);
      setDeleteModal({ isOpen: false, page: null });
    }
  };

  const getDeleteMessage = (page: LynqitPage) => {
    const isPaidPlan = page.subscriptionPlan && page.subscriptionPlan !== "free";
    
    let message = `Weet je zeker dat je de pagina "${formatPageTitle(page.slug)}" wilt verwijderen?\n\n`;
    
    if (isPaidPlan) {
      const endDate = page.subscriptionEndDate 
        ? new Date(page.subscriptionEndDate).toLocaleDateString("nl-NL")
        : "einde facturatieperiode";
      
      message += `⚠️ Deze pagina heeft een betaald abonnement (${page.subscriptionPlan === "start" ? "Start" : "Pro"}).\n\n`;
      message += `Het abonnement wordt stopgezet en de pagina blijft beschikbaar tot ${endDate}.\n\n`;
    }
    
    message += "Deze actie kan niet ongedaan worden gemaakt.";
    return message;
  };

  // Don't show loading screen, just render empty state if needed

  return (
    <div className="min-h-screen font-sans flex" style={{ background: 'linear-gradient(#2F3441, #000)' }}>
        <DashboardSidebar />
        <div className="flex-1 ml-64">
          <div className="w-full px-8 py-8 mt-6 rounded-xl" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-semibold text-white mb-2">
              Mijn Lynqit Pages
            </h1>
            <p className="text-zinc-400">
              Beheer je Lynqit pages
            </p>
          </div>
          <div className="flex gap-3">
            {isAdmin && (
              <button
                onClick={() => setShowDemoModal(true)}
                className="px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
                style={{ border: '1px solid rgba(255, 255, 255, 0.2)', color: 'white' }}
              >
                <i className="fas fa-plus"></i>
                Demo maken
              </button>
            )}
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-[#2E47FF] text-white rounded-lg font-semibold hover:bg-[#1E37E6] transition-colors flex items-center gap-2"
            >
              <i className="fas fa-plus"></i>
              Nieuwe Lynqit
            </button>
          </div>
        </div>

        {!isLoading && pages.length === 0 ? (
          <div className="rounded-xl p-12 text-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <p className="text-zinc-400 mb-4">
              Je hebt nog geen Lynqit pages. Maak er een aan om te beginnen!
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
                    className="px-6 py-3 bg-[#2E47FF] text-white rounded-lg font-semibold hover:bg-[#1E37E6] transition-colors"
            >
              Eerste Page Aanmaken
            </button>
          </div>
        ) : !isLoading && pages.length > 0 ? (
          <div className="space-y-3">
            {pages.map((page) => {
              const handleCopyLink = async () => {
                const pageUrl = typeof window !== 'undefined' 
                  ? `${window.location.origin}/${page.slug}`
                  : `/${page.slug}`;
                
                try {
                  await navigator.clipboard.writeText(pageUrl);
                  alert("Link gekopieerd naar klembord!");
                } catch (error) {
                  console.error("Failed to copy link:", error);
                  // Fallback for older browsers
                  const textArea = document.createElement("textarea");
                  textArea.value = pageUrl;
                  document.body.appendChild(textArea);
                  textArea.select();
                  document.execCommand("copy");
                  document.body.removeChild(textArea);
                  alert("Link gekopieerd naar klembord!");
                }
              };

              return (
                <div
                  key={page.id}
                  className="flex items-center justify-between px-5 py-4 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-white">{formatPageTitle(page.slug)}</p>
                      {page.isDemo && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-900/30 text-orange-300">
                          Demo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 font-mono">
                      /{page.slug}
                    </p>
                    {(!page.subscriptionPlan || page.subscriptionPlan === "free") && (
                      <p className="text-xs text-[#2E47FF] dark:text-[#00F0EE] mt-1">
                        Basis plan
                      </p>
                    )}
                    {page.subscriptionPlan && page.subscriptionPlan !== "free" && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        {page.subscriptionPlan === "start" ? "Start plan" : "Pro plan"}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/pages/${page.id}/edit`}
                      className="p-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-zinc-50 rounded-lg text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center"
                      title="Bewerken"
                    >
                      Bewerken <i className="pl-2 fas fa-edit"></i>
                    </Link>
                    <Link
                      href={`/${page.slug}`}
                      target="_blank"
                      className="p-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-zinc-50 rounded-lg text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center"
                      title="Bekijken"
                    >
                      Bekijken <i className="pl-2 fas fa-eye"></i> 
                    </Link>
                    <button
                      onClick={handleCopyLink}
                      className="p-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-zinc-50 rounded-lg text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center"
                      title="Copy link"
                    >
                      Link kopieren <i className="pl-2 fas fa-copy"></i>
                    </button>
                    <button
                      onClick={() => handleDeletePage(page)}
                      disabled={isDeleting === page.id}
                      className="p-3 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      title="Verwijderen"
                    >
                      {isDeleting === page.id ? (
                        <i className="fas fa-spinner fa-spin"></i>
                      ) : (
                        <i className="fas fa-trash"></i>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-semibold text-black dark:text-zinc-50 mb-4">
              Nieuwe Page Aanmaken
            </h2>
            <form onSubmit={handleCreatePage}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  URL Slug
                </label>
                <input
                  type="text"
                  value={newSlug}
                  onChange={(e) => {
                    // Convert to lowercase and replace spaces with hyphens
                    let value = e.target.value.toLowerCase().replace(/\s+/g, "-");
                    
                    // Remove invalid characters (keep only a-z, 0-9, and hyphens)
                    value = value.replace(/[^a-z0-9-]/g, "");
                    
                    // Replace multiple consecutive hyphens with single hyphen
                    value = value.replace(/-+/g, "-");
                    
                    setNewSlug(value);
                  }}
                  placeholder="mijn-pagina"
                  className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
                <p className="text-xs text-zinc-500 mt-1">
                  Alleen kleine letters, cijfers en streepjes. Bijv: mijn-pagina
                </p>
              </div>

              {/* Plan Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Abonnement
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedPlan("free")}
                    className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                      selectedPlan === "free"
                        ? "border-[#2E47FF] bg-blue-50 dark:bg-blue-900/20"
                        : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                    }`}
                  >
                    <div className="text-sm font-semibold text-black dark:text-zinc-50">
                      Basis
                    </div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                      Gratis
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPlan("start")}
                    className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                      selectedPlan === "start"
                        ? "border-[#2E47FF] bg-blue-50 dark:bg-blue-900/20"
                        : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                    }`}
                  >
                    <div className="text-sm font-semibold text-black dark:text-zinc-50">
                      Start
                    </div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                      €{calculatePriceWithBTW(SUBSCRIPTION_PRICES.start).toFixed(2)}/maand
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPlan("pro")}
                    className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                      selectedPlan === "pro"
                        ? "border-[#2E47FF] bg-blue-50 dark:bg-blue-900/20"
                        : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                    }`}
                  >
                    <div className="text-sm font-semibold text-black dark:text-zinc-50">
                      Pro
                    </div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                      €{calculatePriceWithBTW(SUBSCRIPTION_PRICES.pro).toFixed(2)}/maand
                    </div>
                  </button>
                </div>
                {selectedPlan !== "free" && (
                  <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                    Na het aanmaken wordt je doorgestuurd naar de betaalpagina van Mollie
                  </p>
                )}
              </div>

              {/* Payment Method Selection - Only show for paid plans */}
              {selectedPlan !== "free" && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Betaalmethode
                  </label>
                  <div className={`grid gap-3 ${availablePaymentMethods.filter(m => m.available).length === 2 ? 'grid-cols-2' : availablePaymentMethods.filter(m => m.available).length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                    {availablePaymentMethods.filter(m => m.available).map((method) => {
                      const methodId = method.id.toLowerCase();
                      const isSelected = selectedPaymentMethod === methodId;
                      const iconClass = methodId === 'creditcard' ? 'fas fa-credit-card' :
                                       methodId === 'paypal' ? 'fab fa-paypal' :
                                       methodId === 'sepa' || methodId === 'sepadirectdebit' || methodId === 'directdebit' ? 'fas fa-university' :
                                       'fas fa-money-bill';
                      
                      return (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setSelectedPaymentMethod(methodId)}
                          className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                            isSelected
                              ? "border-[#2E47FF] bg-blue-50 dark:bg-blue-900/20"
                              : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                          }`}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <i className={`${iconClass} text-lg`}></i>
                            <div className="text-sm font-semibold text-black dark:text-zinc-50">
                              {method.description}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewSlug("");
                    setSelectedPlan("free");
                    setError("");
                  }}
                  className="flex-1 px-4 py-3 border border-zinc-300 dark:border-zinc-700 text-black dark:text-zinc-50 rounded-lg font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  disabled={isProcessingPayment}
                  className="flex-1 px-4 py-3 bg-[#2E47FF] text-white rounded-lg font-medium hover:bg-[#1E37E6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessingPayment
                    ? "Verwerken..."
                    : selectedPlan !== "free"
                    ? "Aanmaken en betalen"
                    : "Aanmaken"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Demo Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-semibold text-black dark:text-zinc-50 mb-4">
              Demo Page Aanmaken
            </h2>
            <form onSubmit={handleCreateDemo}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  URL Slug
                </label>
                <input
                  type="text"
                  value={demoSlug}
                  onChange={(e) => {
                    // Convert to lowercase and replace spaces with hyphens
                    let value = e.target.value.toLowerCase().replace(/\s+/g, "-");
                    
                    // Remove invalid characters (keep only a-z, 0-9, and hyphens)
                    value = value.replace(/[^a-z0-9-]/g, "");
                    
                    // Replace multiple consecutive hyphens with single hyphen
                    value = value.replace(/-+/g, "-");
                    
                    setDemoSlug(value);
                  }}
                  placeholder="demo-pagina"
                  className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
                <p className="text-xs text-zinc-500 mt-1">
                  Alleen kleine letters, cijfers en streepjes. Bijv: demo-pagina
                </p>
                <p className="text-xs text-zinc-500 mt-2">
                  <strong>Let op:</strong> Deze pagina wordt aangemaakt met een Pro abonnement zonder betaling.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDemoModal(false);
                    setDemoSlug("");
                    setError("");
                  }}
                  className="flex-1 px-4 py-3 border border-zinc-300 dark:border-zinc-700 text-black dark:text-zinc-50 rounded-lg font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  disabled={isCreatingDemo}
                  className="flex-1 px-4 py-3 bg-[#2E47FF] text-white rounded-lg font-medium hover:bg-[#1E37E6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingDemo ? "Aanmaken..." : "Demo Aanmaken"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.page && (
        <ConfirmModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, page: null })}
          onConfirm={confirmDelete}
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
  );
}

