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
  const [newSlug, setNewSlug] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<"free" | "start" | "pro">("free");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"creditcard" | "paypal">("creditcard");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [error, setError] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    page: LynqitPage | null;
  }>({ isOpen: false, page: null });
  const router = useRouter();

  useEffect(() => {
    document.title = "Pages - Lynqit";
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
            // Store in localStorage for backward compatibility
            localStorage.setItem("lynqit_user", JSON.stringify(userData.user));
            // Fetch user's pages with access token
            const pagesResponse = await fetch(`/api/pages`, {
              headers: {
                "Authorization": `Bearer ${session.access_token}`,
              },
            });
            if (isMounted && pagesResponse.ok) {
              const pagesData = await pagesResponse.json();
              setPages(pagesData.pages || []);
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
      setPages(data.pages || []);
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

  if (isLoading || !userEmail) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

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
          <button
            onClick={() => setShowCreateModal(true)}
                    className="px-6 py-3 bg-[#2E47FF] text-white rounded-lg font-semibold hover:bg-[#1E37E6] transition-colors flex items-center gap-2"
          >
            <i className="fas fa-plus"></i>
            Nieuwe Lynqit
          </button>
        </div>

        {pages.length === 0 ? (
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pages.map((page) => (
              <div
                key={page.id}
                className="rounded-xl p-6 transition-shadow" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
              >
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xl font-semibold text-white">
                      {formatPageTitle(page.slug)}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        !page.subscriptionPlan || page.subscriptionPlan === "free"
                          ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                          : page.subscriptionPlan === "start"
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          : "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                      }`}
                    >
                      {!page.subscriptionPlan || page.subscriptionPlan === "free"
                        ? "Basis"
                        : page.subscriptionPlan === "start"
                        ? "Start"
                        : "Pro"}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mb-2">
                    /{page.slug}
                  </p>
                </div>

                <div className="flex gap-3">
                  <Link
                    href={`/dashboard/pages/${page.id}/edit`}
                    className="flex-1 px-4 py-2 bg-[#2E47FF] text-white rounded-lg text-sm font-medium hover:bg-[#1E37E6] transition-colors text-center"
                  >
                    Bewerken
                  </Link>
                  <Link
                    href={`/${page.slug}`}
                    target="_blank"
                    className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors text-center" style={{ border: '1px solid rgba(255, 255, 255, 0.2)', color: 'white' }}
                  >
                    Bekijken
                  </Link>
                  <button
                    onClick={() => handleDeletePage(page)}
                    disabled={isDeleting === page.id}
                    className="px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            ))}
          </div>
        )}

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

