"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import type { LynqitPage } from "@/lib/lynqit-pages";
import { formatPageTitle } from "@/lib/utils";
import ImageUpload from "@/app/components/ImageUpload";
import AuthGuard from "@/app/components/AuthGuard";
import DashboardSidebar from "@/app/components/DashboardSidebar";
import TemplateRouter from "@/app/components/templates/TemplateRouter";
import { SUBSCRIPTION_PRICES, calculatePriceWithBTW } from "@/lib/pricing";

export default function EditPagePage() {
  const params = useParams();
  const router = useRouter();
  const [page, setPage] = useState<LynqitPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [collapsedEvents, setCollapsedEvents] = useState<Set<number>>(new Set());
  const [draggedEventIndex, setDraggedEventIndex] = useState<number | null>(null);
  const [collapsedProducts, setCollapsedProducts] = useState<Set<number>>(new Set());
  const [draggedProductIndex, setDraggedProductIndex] = useState<number | null>(null);
  const [collapsedShows, setCollapsedShows] = useState<Set<number>>(new Set());
  const [draggedShowIndex, setDraggedShowIndex] = useState<number | null>(null);
  const [collapsedLinks, setCollapsedLinks] = useState<Set<number>>(new Set());
  const [draggedLinkIndex, setDraggedLinkIndex] = useState<number | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);

  useEffect(() => {
    if (page) {
      const pageTitle = page.title || formatPageTitle(page.slug);
      document.title = `${pageTitle} bewerken - Lynqit`;
    } else {
      document.title = "Page bewerken - Lynqit";
    }
  }, [page]);

  useEffect(() => {
    // Get user email from localStorage
    const userData = localStorage.getItem("lynqit_user");
    if (!userData) {
      router.push("/");
      return;
    }

    try {
      const user = JSON.parse(userData);
      setUserEmail(user.email);
      
      if (params.id) {
        fetchPage(user.email);
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
      router.push("/");
    }
  }, [params.id, router]);

  const fetchPage = async (email: string) => {
    try {
      const response = await fetch(`/api/pages/${params.id}?userId=${encodeURIComponent(email)}`);
      if (!response.ok) {
        router.push("/");
        return;
      }
      
      const data = await response.json();
      const fetchedPage = data.page;
      
      // Check if user owns this page or is admin
      const isAdmin = email === "rubenfonteijne@gmail.com";
      const userData = localStorage.getItem("lynqit_user");
      let userRole = "user";
      if (userData) {
        try {
          const user = JSON.parse(userData);
          userRole = user.role || "user";
        } catch (e) {}
      }
      const isAdminUser = isAdmin && userRole === "admin";
      
      if (fetchedPage.userId !== email && !isAdminUser) {
        router.push("/");
        return;
      }
      
      setPage(fetchedPage);
    } catch (error) {
      console.error("Error fetching page:", error);
      router.push("/");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!page || !userEmail) return;

    setIsSaving(true);
    setSaveMessage(null);
    try {
      const response = await fetch(`/api/pages/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...page,
          userId: userEmail,
        }),
      });

      if (response.ok) {
        setSaveMessage({ type: "success", text: "Page succesvol opgeslagen!" });
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        const error = await response.json();
        setSaveMessage({ type: "error", text: error.error || "Fout bij opslaan" });
        setTimeout(() => setSaveMessage(null), 5000);
      }
    } catch (error) {
      console.error("Error saving page:", error);
      setSaveMessage({ type: "error", text: "Er is een fout opgetreden bij het opslaan" });
      setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const updatePage = (updates: Partial<LynqitPage>) => {
    if (!page) return;
    setPage({ ...page, ...updates });
  };

  // Force header type to image for free and start plans
  useEffect(() => {
    if (page && (!page.subscriptionPlan || page.subscriptionPlan === "free" || page.subscriptionPlan === "start") && page.header.type === "video") {
      setPage({ ...page, header: { ...page.header, type: "image" } });
    }
  }, [page?.subscriptionPlan, page?.header.type]);

  const handleUpgrade = async (plan: "start" | "pro") => {
    if (!page || !userEmail || isUpgrading) return;

    setIsUpgrading(true);
    try {
      const response = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          plan: plan,
          pageId: page.id,
        }),
      });

      const data = await response.json();

      if (response.ok && data.paymentUrl) {
        // Redirect to Mollie payment page
        window.location.href = data.paymentUrl;
      } else {
        setSaveMessage({
          type: "error",
          text: data.error || "Fout bij het starten van de upgrade",
        });
        setTimeout(() => setSaveMessage(null), 5000);
        setIsUpgrading(false);
      }
    } catch (error) {
      console.error("Error upgrading:", error);
      setSaveMessage({
        type: "error",
        text: "Er is een fout opgetreden bij het upgraden",
      });
      setTimeout(() => setSaveMessage(null), 5000);
      setIsUpgrading(false);
    }
  };

  // Don't show loading screen, just render empty state if needed

  if (!page) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-600">Page not found</div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen font-sans flex dark" style={{ background: 'linear-gradient(#2F3441, #000)' }}>
        <DashboardSidebar />
        <div className="flex-1 ml-64">
          <div className="w-full px-8 py-8 mt-6 rounded-xl" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
        <div className="mb-4 flex justify-between items-center">
          <div>
            <div className="flex items-baseline gap-3">
              <Link
                href="/dashboard/pages"
                className="px-4 py-3 rounded-lg font-medium transition-colors" style={{ border: '1px solid rgba(255, 255, 255, 0.2)', color: 'white' }}
              >
                ← Terug
              </Link>
              <h1 className="text-xl font-semibold text-white">
                Page Bewerken: {formatPageTitle(page.slug)}
              </h1>
              <p className="text-xs text-zinc-400">
                <span className="font-mono">/{page.slug}</span>
              </p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            {saveMessage && (
              <div
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  saveMessage.type === "success"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                }`}
              >
                {saveMessage.text}
              </div>
            )}
            <Link
              href={`/${page.slug}`}
              target="_blank"
              className="px-4 py-3 rounded-lg font-medium transition-colors" style={{ border: '1px solid rgba(255, 255, 255, 0.2)', color: 'white' }}
            >
              Open
            </Link>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-3 bg-gradient-to-r from-[#2E47FF] to-[#00F0EE] text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSaving ? "Opslaan..." : "Opslaan"}
            </button>
          </div>
        </div>

        {/* Upgrade Section - Free Plan */}
        {(!page.subscriptionPlan || page.subscriptionPlan === "free") && (
          <div className="mb-6 bg-gradient-to-r from-[#2E47FF] to-[#00F0EE] rounded-xl shadow-sm border border-[#2E47FF] p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">
                  Upgrade je pagina
                </h3>
                <p className="text-sm text-white/90">
                  Je gebruikt momenteel het Basis plan (gratis). Upgrade naar Start of Pro voor meer functies.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleUpgrade("start")}
                  disabled={isUpgrading}
                  className="px-4 py-2 bg-white text-[#2E47FF] rounded-lg text-sm font-semibold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpgrading ? "Laden..." : `Upgrade naar Start (€${SUBSCRIPTION_PRICES.start.toFixed(2)}/maand)`}
                </button>
                <button
                  onClick={() => handleUpgrade("pro")}
                  disabled={isUpgrading}
                  className="px-4 py-2 bg-white text-[#00F0EE] rounded-lg text-sm font-semibold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpgrading ? "Laden..." : `Upgrade naar Pro (€${SUBSCRIPTION_PRICES.pro.toFixed(2)}/maand)`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upgrade Section - Start Plan */}
        {page.subscriptionPlan === "start" && (
          <div className="mb-6 bg-gradient-to-r from-[#2E47FF] to-[#00F0EE] rounded-xl shadow-sm border border-[#2E47FF] p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">
                  Upgrade naar Pro
                </h3>
                <p className="text-sm text-white/90">
                  Je gebruikt momenteel het Start plan. Upgrade naar Pro voor nog meer functies zoals video headers en geavanceerde analytics.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleUpgrade("pro")}
                  disabled={isUpgrading}
                  className="px-4 py-2 bg-white text-[#00F0EE] rounded-lg text-sm font-semibold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpgrading ? "Laden..." : `Upgrade naar Pro (€${SUBSCRIPTION_PRICES.pro.toFixed(2)}/maand)`}
                </button>
              </div>
            </div>
          </div>
        )}


        <div className="grid grid-cols-1 xl:grid-cols-[70%_30%] gap-8">
          {/* Left Column - Scrollable */}
          <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-200px)] pr-4">
            {/* Template - Only for Pro plan */}
            {page.subscriptionPlan === "pro" && (
              <div className="rounded-xl p-6" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <h2 className="text-xl font-semibold text-zinc-50 mb-4">
                  Template
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Template
                    </label>
                    <div className="relative">
                      <select
                        value={page.template || "default"}
                        onChange={(e) =>
                          updatePage({ template: e.target.value as "default" | "events" | "artist" | "webshop" })
                        }
                        className="w-full px-4 py-2 pr-10 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-50 focus:outline-none focus:ring-2 focus:ring-[#2E47FF] appearance-none"
                        style={{ minWidth: "100%", boxSizing: "border-box" }}
                      >
                        <option value="default">Standaard</option>
                        <option value="events">Events</option>
                        <option value="artist">Artist</option>
                        <option value="webshop">Webshop</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <i className="fas fa-chevron-down text-zinc-500 dark:text-zinc-400"></i>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">
                      Kies een template voor de layout van je pagina.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Theme - First for free plan */}
            <div className="rounded-xl shadow-sm border border-zinc-800 p-6" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
              <h2 className="text-xl font-semibold text-zinc-50 mb-4">
                {(!page.subscriptionPlan || page.subscriptionPlan === "free") ? "Thema" : "Thema & Brand Kleur"}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Thema
                  </label>
                  <div className="relative">
                    <select
                      value={page.theme || "dark"}
                      onChange={(e) =>
                        updatePage({ theme: e.target.value as "dark" | "light" })
                      }
                      className="w-full px-4 py-2 pr-10 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-50 focus:outline-none focus:ring-2 focus:ring-[#2E47FF] appearance-none"
                      style={{ minWidth: "100%", boxSizing: "border-box" }}
                    >
                      <option value="dark">Donker</option>
                      <option value="light">Licht</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <i className="fas fa-chevron-down text-zinc-500 dark:text-zinc-400"></i>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    Donker: zwarte achtergrond, witte tekst. Licht: witte achtergrond, zwarte tekst.
                  </p>
                </div>
                {page.subscriptionPlan && page.subscriptionPlan !== "free" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        CTA Button Kleur
                      </label>
                      <div className="flex gap-3 items-center">
                        <input
                          type="color"
                          value={page.brandColor || "#2E47FF"}
                          onChange={(e) => updatePage({ brandColor: e.target.value })}
                          className="w-20 h-10 rounded-lg border border-zinc-300 dark:border-zinc-700 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={page.brandColor || "#2E47FF"}
                          onChange={(e) => updatePage({ brandColor: e.target.value })}
                          placeholder="#2E47FF"
                          className="flex-1 px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-50 font-mono"
                        />
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">
                        Deze kleur wordt gebruikt voor de CTA button, promobanner knop, events knoppen en shows knoppen
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Tekst Kleur op CTA Kleur
                      </label>
                      <div className="flex gap-3 items-center">
                        <input
                          type="color"
                          value={page.ctaTextColor || "#FFFFFF"}
                          onChange={(e) => updatePage({ ctaTextColor: e.target.value })}
                          className="w-20 h-10 rounded-lg border border-zinc-300 dark:border-zinc-700 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={page.ctaTextColor || "#FFFFFF"}
                          onChange={(e) => updatePage({ ctaTextColor: e.target.value })}
                          placeholder="#FFFFFF"
                          className="flex-1 px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-50 font-mono"
                        />
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">
                        Deze kleur wordt gebruikt voor de tekst op de CTA button, promobanner knop, events knoppen en shows knoppen
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Achtergrond-kleur
                      </label>
                      <div className="flex gap-3 items-center">
                        <input
                          type="color"
                          value={page.backgroundColor || ""}
                          onChange={(e) => updatePage({ backgroundColor: e.target.value })}
                          className="w-20 h-10 rounded-lg border border-zinc-300 dark:border-zinc-700 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={page.backgroundColor || ""}
                          onChange={(e) => updatePage({ backgroundColor: e.target.value })}
                          placeholder="#000000"
                          className="flex-1 px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-50 font-mono"
                        />
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">
                        Optionele achtergrondkleur voor de pagina. Als ingevuld, krijgen icons en knoppen zwart met 15% opacity.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Header - Only image for free/start, image or video for pro */}
            <div className="rounded-xl shadow-sm border border-zinc-800 p-6" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
              <h2 className="text-xl font-semibold text-zinc-50 mb-4">
                Header Afbeelding
              </h2>
              <div className="space-y-4">
                {page.subscriptionPlan === "pro" && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Type
                    </label>
                    <div className="relative">
                      <select
                        value={page.header.type}
                        onChange={(e) =>
                          updatePage({
                            header: { ...page.header, type: e.target.value as "video" | "image" },
                          })
                        }
                        className="w-full px-4 py-2 pr-10 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-50 focus:outline-none focus:ring-2 focus:ring-[#2E47FF] appearance-none"
                        style={{ minWidth: "100%", boxSizing: "border-box" }}
                      >
                        <option value="image">Afbeelding</option>
                        <option value="video">Video</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <i className="fas fa-chevron-down text-zinc-500 dark:text-zinc-400"></i>
                      </div>
                    </div>
                  </div>
                )}
                {(page.subscriptionPlan === "pro" ? page.header.type === "image" : true) ? (
                  <>
                    <ImageUpload
                      value={page.header.url}
                      onChange={(url) =>
                        updatePage({
                          header: { ...page.header, url },
                        })
                      }
                      label="Header Afbeelding Upload"
                    />
                  </>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Video URL
                    </label>
                    <input
                      type="url"
                      value={page.header.url || ""}
                      onChange={(e) =>
                        updatePage({
                          header: { ...page.header, url: e.target.value },
                        })
                      }
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-50"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Promo Banner - Only visible for Pro plan */}
            {page.subscriptionPlan === "pro" && (
              <div className="rounded-xl p-6" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <h2 className="text-xl font-semibold text-zinc-50 mb-4">
                Promo Banner
              </h2>
              <div className="space-y-4">
                <label className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-300">
                    Promo banner inschakelen
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updatePage({
                        promoBanner: { ...page.promoBanner, enabled: !page.promoBanner.enabled },
                      })
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      page.promoBanner.enabled ? "bg-[#2E47FF]" : "bg-zinc-300 dark:bg-zinc-700"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        page.promoBanner.enabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </label>
                {page.promoBanner.enabled && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Titel
                      </label>
                      <input
                        type="text"
                        value={page.promoBanner.title || ""}
                        onChange={(e) =>
                          updatePage({
                            promoBanner: { ...page.promoBanner, title: e.target.value },
                          })
                        }
                        className="w-full px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Beschrijving
                      </label>
                      <textarea
                        value={page.promoBanner.description || ""}
                        onChange={(e) =>
                          updatePage({
                            promoBanner: { ...page.promoBanner, description: e.target.value },
                          })
                        }
                        rows={3}
                        className="w-full px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Button Tekst
                      </label>
                      <input
                        type="text"
                        value={page.promoBanner.buttonText || ""}
                        onChange={(e) =>
                          updatePage({
                            promoBanner: { ...page.promoBanner, buttonText: e.target.value },
                          })
                        }
                        className="w-full px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Button Link
                      </label>
                      <input
                        type="text"
                        value={page.promoBanner.buttonLink || ""}
                        onChange={(e) =>
                          updatePage({
                            promoBanner: { ...page.promoBanner, buttonLink: e.target.value },
                          })
                        }
                        className="w-full px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-50"
                      />
                    </div>
                    <ImageUpload
                      value={page.promoBanner.backgroundImage}
                      onChange={(url) =>
                        updatePage({
                          promoBanner: { ...page.promoBanner, backgroundImage: url },
                        })
                      }
                      label="Achtergrond Afbeelding"
                    />
                  </>
                )}
              </div>
            </div>
            )}

            {/* Events (for Events template) - Hidden for free plan */}
            {(!page.subscriptionPlan || page.subscriptionPlan !== "free") && page.template === "events" && (
              <div className="rounded-xl p-6" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <h2 className="text-xl font-semibold text-zinc-50 mb-4">
                  Events
                </h2>
                <div className="space-y-4">
                  {(page.events || []).map((event, index) => {
                    const isCollapsed = collapsedEvents.has(index);
                    const isDragging = draggedEventIndex === index;
                    return (
                      <div
                        key={index}
                        draggable
                        onDragStart={(e) => {
                          setDraggedEventIndex(index);
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (draggedEventIndex === null || draggedEventIndex === index) {
                            setDraggedEventIndex(null);
                            return;
                          }
                          
                          const newEvents = [...(page.events || [])];
                          const draggedEvent = newEvents[draggedEventIndex];
                          newEvents.splice(draggedEventIndex, 1);
                          newEvents.splice(index, 0, draggedEvent);
                          
                          // Update collapsed events indices
                          const newCollapsed = new Set<number>();
                          collapsedEvents.forEach((collapsedIndex) => {
                            if (collapsedIndex === draggedEventIndex) {
                              newCollapsed.add(index);
                            } else if (collapsedIndex < draggedEventIndex && collapsedIndex >= index) {
                              newCollapsed.add(collapsedIndex + 1);
                            } else if (collapsedIndex > draggedEventIndex && collapsedIndex <= index) {
                              newCollapsed.add(collapsedIndex - 1);
                            } else {
                              newCollapsed.add(collapsedIndex);
                            }
                          });
                          setCollapsedEvents(newCollapsed);
                          
                          updatePage({ events: newEvents });
                          setDraggedEventIndex(null);
                        }}
                        onDragEnd={() => {
                          setDraggedEventIndex(null);
                        }}
                        className={`border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 space-y-4 cursor-move transition-opacity ${
                          isDragging ? "opacity-50" : "opacity-100"
                        } hover:border-zinc-300 dark:hover:border-zinc-600`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <i className="fas fa-grip-vertical text-zinc-400 dark:text-zinc-500"></i>
                            <h3 className="text-sm font-medium text-zinc-300">
                              {event.text || `Event ${index + 1}`}
                            </h3>
                          </div>
                          <div className="flex items-center gap-3">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={event.enabled !== false}
                                onChange={(e) => {
                                  const newEvents = [...(page.events || [])];
                                  newEvents[index] = { ...event, enabled: e.target.checked };
                                  updatePage({ events: newEvents });
                                }}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-zinc-300 dark:bg-zinc-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-[#2E47FF]"></div>
                            </label>
                            <button
                              onClick={() => {
                                const newCollapsed = new Set(collapsedEvents);
                                if (isCollapsed) {
                                  newCollapsed.delete(index);
                                } else {
                                  newCollapsed.add(index);
                                }
                                setCollapsedEvents(newCollapsed);
                              }}
                              className="text-zinc-400 hover:text-zinc-200 text-sm p-2"
                              title={isCollapsed ? "Uitklappen" : "Inklappen"}
                            >
                              <i className={`fas ${isCollapsed ? "fa-chevron-down" : "fa-chevron-up"}`}></i>
                            </button>
                            <button
                              onClick={() => {
                                const newEvents = [...(page.events || [])];
                                newEvents.splice(index, 1);
                                updatePage({ events: newEvents });
                              }}
                              className="text-red-500 hover:text-red-700 text-sm p-2"
                              title="Verwijderen"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </div>
                        {!isCollapsed && (
                          <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Event
                          </label>
                          <input
                            type="text"
                            value={event.text}
                            onChange={(e) => {
                              const newEvents = [...(page.events || [])];
                              newEvents[index] = { ...event, text: e.target.value };
                              updatePage({ events: newEvents });
                            }}
                            placeholder="Event"
                            className="w-full px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Link
                          </label>
                          <input
                            type="text"
                            value={event.link}
                            onChange={(e) => {
                              const newEvents = [...(page.events || [])];
                              newEvents[index] = { ...event, link: e.target.value };
                              updatePage({ events: newEvents });
                            }}
                            placeholder="https://..."
                            className="w-full px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-50"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Datum event
                        </label>
                        <input
                          type="date"
                          value={event.eventDate ? new Date(event.eventDate).toISOString().split("T")[0] : ""}
                          onChange={(e) => {
                            const date = e.target.value;
                            if (date) {
                              const eventDate = new Date(date);
                              eventDate.setHours(0, 0, 0, 0);
                              const newEvents = [...(page.events || [])];
                              newEvents[index] = { ...event, eventDate: eventDate.toISOString() };
                              updatePage({ events: newEvents });
                            }
                          }}
                          className="w-full px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Locatie (optioneel)
                        </label>
                        <input
                          type="text"
                          value={event.location || ""}
                          onChange={(e) => {
                            const newEvents = [...(page.events || [])];
                            newEvents[index] = { ...event, location: e.target.value };
                            updatePage({ events: newEvents });
                          }}
                          placeholder="Bijv. Amsterdam, Nederland"
                          className="w-full px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-50"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Zichtbaar vanaf (datum)
                          </label>
                          <input
                            type="date"
                            value={
                              event.visibleFrom
                                ? new Date(event.visibleFrom).toISOString().split("T")[0]
                                : ""
                            }
                            onChange={(e) => {
                              const date = e.target.value;
                              const existingDateTime = event.visibleFrom
                                ? new Date(event.visibleFrom)
                                : new Date();
                              if (date) {
                                existingDateTime.setFullYear(
                                  parseInt(date.split("-")[0]),
                                  parseInt(date.split("-")[1]) - 1,
                                  parseInt(date.split("-")[2])
                                );
                                const newEvents = [...(page.events || [])];
                                newEvents[index] = { ...event, visibleFrom: existingDateTime.toISOString() };
                                updatePage({ events: newEvents });
                              }
                            }}
                            className="w-full px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Zichtbaar vanaf (tijd)
                          </label>
                          <input
                            type="time"
                            value={
                              event.visibleFrom
                                ? new Date(event.visibleFrom).toTimeString().slice(0, 5)
                                : ""
                            }
                            onChange={(e) => {
                              const time = e.target.value;
                              const existingDateTime = event.visibleFrom
                                ? new Date(event.visibleFrom)
                                : new Date();
                              if (time) {
                                const [hours, minutes] = time.split(":");
                                existingDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                                const newEvents = [...(page.events || [])];
                                newEvents[index] = { ...event, visibleFrom: existingDateTime.toISOString() };
                                updatePage({ events: newEvents });
                              }
                            }}
                            className="w-full px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-50"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Onzichtbaar vanaf (datum)
                          </label>
                          <input
                            type="date"
                            value={
                              event.visibleUntil
                                ? new Date(event.visibleUntil).toISOString().split("T")[0]
                                : ""
                            }
                            onChange={(e) => {
                              const date = e.target.value;
                              const existingDateTime = event.visibleUntil
                                ? new Date(event.visibleUntil)
                                : new Date();
                              if (date) {
                                existingDateTime.setFullYear(
                                  parseInt(date.split("-")[0]),
                                  parseInt(date.split("-")[1]) - 1,
                                  parseInt(date.split("-")[2])
                                );
                                const newEvents = [...(page.events || [])];
                                newEvents[index] = { ...event, visibleUntil: existingDateTime.toISOString() };
                                updatePage({ events: newEvents });
                              }
                            }}
                            className="w-full px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Onzichtbaar vanaf (tijd)
                          </label>
                          <input
                            type="time"
                            value={
                              event.visibleUntil
                                ? new Date(event.visibleUntil).toTimeString().slice(0, 5)
                                : ""
                            }
                            onChange={(e) => {
                              const time = e.target.value;
                              const existingDateTime = event.visibleUntil
                                ? new Date(event.visibleUntil)
                                : new Date();
                              if (time) {
                                const [hours, minutes] = time.split(":");
                                existingDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                                const newEvents = [...(page.events || [])];
                                newEvents[index] = { ...event, visibleUntil: existingDateTime.toISOString() };
                                updatePage({ events: newEvents });
                              }
                            }}
                            className="w-full px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-50"
                          />
                        </div>
                      </div>
                        </>
                        )}
                      </div>
                    );
                  })}
                  {(page.events || []).length < 20 && (
                    <button
                      onClick={() => {
                        const newEvents = [...(page.events || [])];
                        newEvents.push({
                          text: "",
                          link: "",
                          eventDate: new Date().toISOString(),
                          enabled: true,
                        });
                        updatePage({ events: newEvents });
                      }}
                      className="w-full px-4 py-2 border-2 border-dashed border-zinc-700 rounded-lg text-zinc-300 hover:border-zinc-600 transition-colors"
                    >
                      + Nieuw event toevoegen
                    </button>
                  )}
                  {(page.events || []).length >= 20 && (
                    <p className="text-sm text-zinc-500 text-center">
                      Maximum van 20 events bereikt
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Products (for Webshop template) - Hidden for free plan */}
            {(!page.subscriptionPlan || page.subscriptionPlan !== "free") && page.template === "webshop" && (
              <div className="rounded-xl p-6" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <h2 className="text-xl font-semibold text-zinc-50 mb-4">
                  Producten
                </h2>
                <div className="space-y-4">
                  {(page.products || []).map((product, index) => {
                    const isCollapsed = collapsedProducts.has(index);
                    const isDragging = draggedProductIndex === index;
                    return (
                      <div
                        key={index}
                        draggable
                        onDragStart={(e) => {
                          setDraggedProductIndex(index);
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (draggedProductIndex === null || draggedProductIndex === index) {
                            setDraggedProductIndex(null);
                            return;
                          }
                          
                          const newProducts = [...(page.products || [])];
                          const draggedProduct = newProducts[draggedProductIndex];
                          newProducts.splice(draggedProductIndex, 1);
                          newProducts.splice(index, 0, draggedProduct);
                          
                          // Update collapsed products indices
                          const newCollapsed = new Set<number>();
                          collapsedProducts.forEach((collapsedIndex) => {
                            if (collapsedIndex === draggedProductIndex) {
                              newCollapsed.add(index);
                            } else if (collapsedIndex < draggedProductIndex && collapsedIndex >= index) {
                              newCollapsed.add(collapsedIndex + 1);
                            } else if (collapsedIndex > draggedProductIndex && collapsedIndex <= index) {
                              newCollapsed.add(collapsedIndex - 1);
                            } else {
                              newCollapsed.add(collapsedIndex);
                            }
                          });
                          setCollapsedProducts(newCollapsed);
                          
                          updatePage({ products: newProducts });
                          setDraggedProductIndex(null);
                        }}
                        onDragEnd={() => {
                          setDraggedProductIndex(null);
                        }}
                        className={`border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 space-y-4 cursor-move transition-opacity ${
                          isDragging ? "opacity-50" : "opacity-100"
                        } hover:border-zinc-300 dark:hover:border-zinc-600`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <i className="fas fa-grip-vertical text-zinc-400 dark:text-zinc-500"></i>
                            <h3 className="text-sm font-medium text-zinc-300">
                              {product.name || `Product ${index + 1}`}
                            </h3>
                          </div>
                          <div className="flex items-center gap-3">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={product.enabled !== false}
                                onChange={(e) => {
                                  const newProducts = [...(page.products || [])];
                                  newProducts[index] = { ...product, enabled: e.target.checked };
                                  updatePage({ products: newProducts });
                                }}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-zinc-300 dark:bg-zinc-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-[#2E47FF]"></div>
                            </label>
                            <button
                              onClick={() => {
                                const newCollapsed = new Set(collapsedProducts);
                                if (isCollapsed) {
                                  newCollapsed.delete(index);
                                } else {
                                  newCollapsed.add(index);
                                }
                                setCollapsedProducts(newCollapsed);
                              }}
                              className="text-zinc-400 hover:text-zinc-200 text-sm p-2"
                              title={isCollapsed ? "Uitklappen" : "Inklappen"}
                            >
                              <i className={`fas ${isCollapsed ? "fa-chevron-down" : "fa-chevron-up"}`}></i>
                            </button>
                            <button
                              onClick={() => {
                                const newProducts = [...(page.products || [])];
                                newProducts.splice(index, 1);
                                updatePage({ products: newProducts });
                              }}
                              className="text-red-500 hover:text-red-700 text-sm p-2"
                              title="Verwijderen"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </div>
                        {!isCollapsed && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Product
                              </label>
                              <input
                                type="text"
                                value={product.name}
                                onChange={(e) => {
                                  const newProducts = [...(page.products || [])];
                                  newProducts[index] = { ...product, name: e.target.value };
                                  updatePage({ products: newProducts });
                                }}
                                placeholder="Product naam"
                                className="w-full px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-50"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                  Prijs
                                </label>
                                <input
                                  type="text"
                                  value={product.price}
                                  onChange={(e) => {
                                    const newProducts = [...(page.products || [])];
                                    newProducts[index] = { ...product, price: e.target.value };
                                    updatePage({ products: newProducts });
                                  }}
                                  placeholder="€ 29,99"
                                  className="w-full px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-50"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                  Kortingsprijs (optioneel)
                                </label>
                                <input
                                  type="text"
                                  value={product.discountPrice || ""}
                                  onChange={(e) => {
                                    const newProducts = [...(page.products || [])];
                                    newProducts[index] = { ...product, discountPrice: e.target.value || undefined };
                                    updatePage({ products: newProducts });
                                  }}
                                  placeholder="€ 19,99"
                                  className="w-full px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-50"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={product.isFromPrice || false}
                                  onChange={(e) => {
                                    const newProducts = [...(page.products || [])];
                                    newProducts[index] = { ...product, isFromPrice: e.target.checked };
                                    updatePage({ products: newProducts });
                                  }}
                                  className="w-4 h-4 text-[#2E47FF] rounded focus:ring-[#2E47FF]"
                                />
                                <span className="text-sm font-medium text-zinc-300">
                                  Vanaf-prijs
                                </span>
                              </label>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Link
                              </label>
                              <input
                                type="text"
                                value={product.link}
                                onChange={(e) => {
                                  const newProducts = [...(page.products || [])];
                                  newProducts[index] = { ...product, link: e.target.value };
                                  updatePage({ products: newProducts });
                                }}
                                placeholder="https://..."
                                className="w-full px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-50"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Afbeelding
                              </label>
                              <ImageUpload
                                value={product.image}
                                onChange={(url) => {
                                  const newProducts = [...(page.products || [])];
                                  newProducts[index] = { ...product, image: url };
                                  updatePage({ products: newProducts });
                                }}
                                label="Product afbeelding"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                  {(page.products || []).length < 5 && (
                    <button
                      onClick={() => {
                        const newProducts = [...(page.products || [])];
                        newProducts.push({
                          name: "",
                          price: "",
                          discountPrice: undefined,
                          isFromPrice: false,
                          link: "",
                          image: "",
                          enabled: true,
                        });
                        updatePage({ products: newProducts });
                      }}
                      className="w-full px-4 py-2 border-2 border-dashed border-zinc-700 rounded-lg text-zinc-300 hover:border-zinc-600 transition-colors"
                    >
                      + Nieuw product toevoegen
                    </button>
                  )}
                  {(page.products || []).length >= 5 && (
                    <p className="text-sm text-zinc-500 text-center">
                      Maximum van 5 producten bereikt
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Shows (for Artist template) - Hidden for free plan */}
            {(!page.subscriptionPlan || page.subscriptionPlan !== "free") && page.template === "artist" && (
              <div className="rounded-xl p-6" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <h2 className="text-xl font-semibold text-zinc-50 mb-4">
                  Shows
                </h2>
                <div className="space-y-4">
                  {(page.shows || []).map((show, index) => {
                    const isCollapsed = collapsedShows.has(index);
                    const isDragging = draggedShowIndex === index;
                    return (
                      <div
                        key={index}
                        draggable
                        onDragStart={(e) => {
                          setDraggedShowIndex(index);
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (draggedShowIndex === null || draggedShowIndex === index) {
                            setDraggedShowIndex(null);
                            return;
                          }
                          
                          const newShows = [...(page.shows || [])];
                          const draggedShow = newShows[draggedShowIndex];
                          newShows.splice(draggedShowIndex, 1);
                          newShows.splice(index, 0, draggedShow);
                          
                          // Update collapsed shows indices
                          const newCollapsed = new Set<number>();
                          collapsedShows.forEach((collapsedIndex) => {
                            if (collapsedIndex === draggedShowIndex) {
                              newCollapsed.add(index);
                            } else if (collapsedIndex < draggedShowIndex && collapsedIndex >= index) {
                              newCollapsed.add(collapsedIndex + 1);
                            } else if (collapsedIndex > draggedShowIndex && collapsedIndex <= index) {
                              newCollapsed.add(collapsedIndex - 1);
                            } else {
                              newCollapsed.add(collapsedIndex);
                            }
                          });
                          setCollapsedShows(newCollapsed);
                          
                          updatePage({ shows: newShows });
                          setDraggedShowIndex(null);
                        }}
                        onDragEnd={() => {
                          setDraggedShowIndex(null);
                        }}
                        className={`border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 space-y-4 cursor-move transition-opacity ${
                          isDragging ? "opacity-50" : "opacity-100"
                        } hover:border-zinc-300 dark:hover:border-zinc-600`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <i className="fas fa-grip-vertical text-zinc-400 dark:text-zinc-500"></i>
                            <h3 className="text-sm font-medium text-zinc-300">
                              {show.show || `Show ${index + 1}`}
                            </h3>
                          </div>
                          <div className="flex items-center gap-3">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={show.enabled !== false}
                                onChange={(e) => {
                                  const newShows = [...(page.shows || [])];
                                  newShows[index] = { ...show, enabled: e.target.checked };
                                  updatePage({ shows: newShows });
                                }}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-zinc-300 dark:bg-zinc-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-[#2E47FF]"></div>
                            </label>
                            <button
                              onClick={() => {
                                const newCollapsed = new Set(collapsedShows);
                                if (isCollapsed) {
                                  newCollapsed.delete(index);
                                } else {
                                  newCollapsed.add(index);
                                }
                                setCollapsedShows(newCollapsed);
                              }}
                              className="text-zinc-400 hover:text-zinc-200 text-sm p-2"
                              title={isCollapsed ? "Uitklappen" : "Inklappen"}
                            >
                              <i className={`fas ${isCollapsed ? "fa-chevron-down" : "fa-chevron-up"}`}></i>
                            </button>
                            <button
                              onClick={() => {
                                const newShows = [...(page.shows || [])];
                                newShows.splice(index, 1);
                                updatePage({ shows: newShows });
                              }}
                              className="text-red-500 hover:text-red-700 text-sm p-2"
                              title="Verwijderen"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </div>
                        {!isCollapsed && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Show
                              </label>
                              <input
                                type="text"
                                value={show.show}
                                onChange={(e) => {
                                  const newShows = [...(page.shows || [])];
                                  newShows[index] = { ...show, show: e.target.value };
                                  updatePage({ shows: newShows });
                                }}
                                placeholder="Show naam"
                                className="w-full px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-50"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Datum
                              </label>
                              <input
                                type="date"
                                value={show.date ? new Date(show.date).toISOString().split("T")[0] : ""}
                                onChange={(e) => {
                                  const date = e.target.value;
                                  if (date) {
                                    const showDate = new Date(date);
                                    showDate.setHours(0, 0, 0, 0);
                                    const newShows = [...(page.shows || [])];
                                    newShows[index] = { ...show, date: showDate.toISOString() };
                                    updatePage({ shows: newShows });
                                  }
                                }}
                                className="w-full px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-50"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Locatie (optioneel)
                              </label>
                              <input
                                type="text"
                                value={show.location || ""}
                                onChange={(e) => {
                                  const newShows = [...(page.shows || [])];
                                  newShows[index] = { ...show, location: e.target.value };
                                  updatePage({ shows: newShows });
                                }}
                                placeholder="Bijv. Amsterdam, Nederland"
                                className="w-full px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-50"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Link (optioneel)
                              </label>
                              <input
                                type="text"
                                value={show.link || ""}
                                onChange={(e) => {
                                  const newShows = [...(page.shows || [])];
                                  newShows[index] = { ...show, link: e.target.value };
                                  updatePage({ shows: newShows });
                                }}
                                placeholder="https://..."
                                className="w-full px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-50"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                  {(page.shows || []).length < 20 && (
                    <button
                      onClick={() => {
                        const newShows = [...(page.shows || [])];
                        newShows.push({
                          show: "",
                          date: new Date().toISOString(),
                          enabled: true,
                        });
                        updatePage({ shows: newShows });
                      }}
                      className="w-full px-4 py-2 border-2 border-dashed border-zinc-700 rounded-lg text-zinc-300 hover:border-zinc-600 transition-colors"
                    >
                      + Nieuwe show toevoegen
                    </button>
                  )}
                  {(page.shows || []).length >= 20 && (
                    <p className="text-sm text-zinc-500 text-center">
                      Maximum van 20 shows bereikt
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Logo & Intro - Third for free plan, after Header */}
            {(!page.subscriptionPlan || page.subscriptionPlan === "free") && (
              <div className="rounded-xl p-6" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <h2 className="text-xl font-semibold text-zinc-50 mb-4">
                  Logo & Intro
                </h2>
                <div className="space-y-4">
                  <ImageUpload
                    value={page.logo}
                    onChange={(url) => updatePage({ logo: url })}
                    label="Logo"
                  />
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Intro Tekst
                    </label>
                    <textarea
                      value={page.intro || ""}
                      onChange={(e) => updatePage({ intro: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-50"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Links - Fourth for free plan */}
            {(!page.subscriptionPlan || page.subscriptionPlan === "free") && (
              <div className="rounded-xl p-6" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <h2 className="text-xl font-semibold text-zinc-50 mb-4">
                  Links
                  <span className="text-sm font-normal text-zinc-500 ml-2">(Maximaal 5)</span>
                </h2>
              <div className="space-y-4">
                {(page.customLinks || []).slice(0, (!page.subscriptionPlan || page.subscriptionPlan === "free") ? 5 : undefined).map((link, index) => {
                  const isCollapsed = collapsedLinks.has(index);
                  const isDragging = draggedLinkIndex === index;
                  return (
                    <div
                      key={index}
                      draggable
                      onDragStart={(e) => {
                        setDraggedLinkIndex(index);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggedLinkIndex === null || draggedLinkIndex === index) {
                          setDraggedLinkIndex(null);
                          return;
                        }
                        
                        const newLinks = [...(page.customLinks || [])];
                        const draggedLink = newLinks[draggedLinkIndex];
                        newLinks.splice(draggedLinkIndex, 1);
                        newLinks.splice(index, 0, draggedLink);
                        
                        // Update collapsed links indices
                        const newCollapsed = new Set<number>();
                        collapsedLinks.forEach((collapsedIndex) => {
                          if (collapsedIndex === draggedLinkIndex) {
                            newCollapsed.add(index);
                          } else if (collapsedIndex < draggedLinkIndex && collapsedIndex >= index) {
                            newCollapsed.add(collapsedIndex + 1);
                          } else if (collapsedIndex > draggedLinkIndex && collapsedIndex <= index) {
                            newCollapsed.add(collapsedIndex - 1);
                          } else {
                            newCollapsed.add(collapsedIndex);
                          }
                        });
                        setCollapsedLinks(newCollapsed);
                        
                        updatePage({ customLinks: newLinks });
                        setDraggedLinkIndex(null);
                      }}
                      onDragEnd={() => {
                        setDraggedLinkIndex(null);
                      }}
                      className={`border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 space-y-4 cursor-move transition-opacity ${
                        isDragging ? "opacity-50" : "opacity-100"
                      } hover:border-zinc-300 dark:hover:border-zinc-600`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <i className="fas fa-grip-vertical text-zinc-400 dark:text-zinc-500"></i>
                          <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            {link.text || `Link ${index + 1}`}
                          </h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={link.enabled !== false}
                              onChange={(e) => {
                                const newLinks = [...(page.customLinks || [])];
                                newLinks[index] = { ...link, enabled: e.target.checked };
                                updatePage({ customLinks: newLinks });
                              }}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-zinc-300 dark:bg-zinc-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-[#2E47FF]"></div>
                          </label>
                          <button
                            onClick={() => {
                              const newCollapsed = new Set(collapsedLinks);
                              if (isCollapsed) {
                                newCollapsed.delete(index);
                              } else {
                                newCollapsed.add(index);
                              }
                              setCollapsedLinks(newCollapsed);
                            }}
                            className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 text-sm p-2"
                            title={isCollapsed ? "Uitklappen" : "Inklappen"}
                          >
                            <i className={`fas ${isCollapsed ? "fa-chevron-down" : "fa-chevron-up"}`}></i>
                          </button>
                          <button
                            onClick={() => {
                              const newLinks = [...(page.customLinks || [])];
                              newLinks.splice(index, 1);
                              updatePage({ customLinks: newLinks });
                            }}
                            className="text-red-500 hover:text-red-700 text-sm p-2"
                            title="Verwijderen"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </div>
                      {!isCollapsed && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                              Tekst
                            </label>
                            <input
                              type="text"
                              value={link.text}
                              onChange={(e) => {
                                const newLinks = [...(page.customLinks || [])];
                                newLinks[index] = { ...link, text: e.target.value };
                                updatePage({ customLinks: newLinks });
                              }}
                              placeholder="Tekst"
                              className="w-full px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-50"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                              URL
                            </label>
                            <input
                              type="text"
                              value={link.url}
                              onChange={(e) => {
                                const newLinks = [...(page.customLinks || [])];
                                newLinks[index] = { ...link, url: e.target.value };
                                updatePage({ customLinks: newLinks });
                              }}
                              placeholder="https://..."
                              className="w-full px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-50"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {((!page.subscriptionPlan || page.subscriptionPlan === "free") ? (page.customLinks || []).length < 5 : true) && (
                  <button
                    onClick={() => {
                      const newLinks = [...(page.customLinks || [])];
                      newLinks.push({
                        text: "",
                        url: "",
                        enabled: true,
                      });
                      updatePage({ customLinks: newLinks });
                    }}
                    className="w-full px-4 py-2 border-2 border-dashed border-zinc-700 rounded-lg text-zinc-300 hover:border-zinc-600 transition-colors"
                  >
                    + Nieuwe link toevoegen
                  </button>
                )}
                {(!page.subscriptionPlan || page.subscriptionPlan === "free") && (page.customLinks || []).length >= 5 && (
                  <p className="text-sm text-zinc-500 text-center">
                    Maximum van 5 links bereikt voor gratis plan
                  </p>
                )}
              </div>
            </div>
            )}

            {/* Social Media - For all plans */}
            <div className="rounded-xl p-6" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <h2 className="text-xl font-semibold text-zinc-50 mb-4">
                Social Media Links
              </h2>
              <div className="space-y-4">
                {[
                  "instagram",
                  "facebook",
                  "youtube",
                  "tiktok",
                  "linkedin",
                  "soundcloud",
                  "spotify",
                  "website",
                ].map((platform) => (
                  <div key={platform}>
                    <label className="block text-sm font-medium text-zinc-300 mb-2 capitalize">
                      {platform}
                    </label>
                    <input
                      type="url"
                      value={page.socialMedia[platform as keyof typeof page.socialMedia] || ""}
                      onChange={(e) =>
                        updatePage({
                          socialMedia: {
                            ...page.socialMedia,
                            [platform]: e.target.value,
                          },
                        })
                      }
                      placeholder="https://..."
                      className="w-full px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-50"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Info - Only for Start and Pro plans */}
            {page.subscriptionPlan && page.subscriptionPlan !== "free" && (
              <div className="rounded-xl p-6" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <h2 className="text-xl font-semibold text-zinc-50 mb-4">
                  Contactgegevens
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Telefoonnummer
                    </label>
                    <input
                      type="text"
                      value={page.telefoonnummer || ""}
                      onChange={(e) => updatePage({ telefoonnummer: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      E-mailadres
                    </label>
                    <input
                      type="email"
                      value={page.emailadres || ""}
                      onChange={(e) => updatePage({ emailadres: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-50"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* CTA Button - Only for Start and Pro plans */}
            {page.subscriptionPlan && page.subscriptionPlan !== "free" && (
              <div className="rounded-xl p-6" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <h2 className="text-xl font-semibold text-zinc-50 mb-4">
                  CTA Knop
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Tekst
                    </label>
                    <input
                      type="text"
                      value={page.ctaButton.text}
                      onChange={(e) =>
                        updatePage({
                          ctaButton: { ...page.ctaButton, text: e.target.value },
                        })
                      }
                      className="w-full px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Link
                    </label>
                    <input
                      type="text"
                      value={page.ctaButton.link}
                      onChange={(e) =>
                        updatePage({
                          ctaButton: { ...page.ctaButton, link: e.target.value },
                        })
                      }
                      className="w-full px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-50"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Logo & Intro - For Start and Pro plans */}
            {(!page.subscriptionPlan || page.subscriptionPlan !== "free") && (
              <div className="rounded-xl p-6" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <h2 className="text-xl font-semibold text-zinc-50 mb-4">
                  Logo & Intro
                </h2>
                <div className="space-y-4">
                  <ImageUpload
                    value={page.logo}
                    onChange={(url) => updatePage({ logo: url })}
                    label="Logo"
                  />
                  {/* Spotify Embed (only for Artist template) */}
                  {page.template === "artist" && (
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Spotify Nummer URL
                      </label>
                      <input
                        type="url"
                        value={page.spotifyUrl || ""}
                        onChange={(e) => updatePage({ spotifyUrl: e.target.value })}
                        placeholder="https://open.spotify.com/track/..."
                        className="w-full px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-50"
                      />
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        Plak hier de Spotify URL van het nummer dat je wilt embedden
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Intro Tekst
                    </label>
                    <textarea
                      value={page.intro || ""}
                      onChange={(e) => updatePage({ intro: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-50"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Featured Links - Only for Start and Pro plans */}
            {page.subscriptionPlan && page.subscriptionPlan !== "free" && (
              <div className="rounded-xl p-6" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <h2 className="text-xl font-semibold text-zinc-50 mb-4">
                Featured Links
              </h2>
              <div className="space-y-6">
                {/* Link 1 and 2 side by side */}
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2].map((num) => {
                    const linkKey = `link${num}` as keyof typeof page.featuredLinks;
                    const link = page.featuredLinks[linkKey];
                    return (
                      <div 
                        key={num} 
                        className="border border-zinc-700 rounded-lg p-4"
                      >
                        <h3 className="text-lg font-medium text-zinc-50 mb-4">
                          Featured Link {num}
                        </h3>
                        <div className="space-y-4">
                        <ImageUpload
                          value={link?.image}
                          onChange={(url) =>
                            updatePage({
                              featuredLinks: {
                                ...page.featuredLinks,
                                [linkKey]: {
                                  ...link,
                                  image: url,
                                  title: link?.title || "",
                                  link: link?.link || "",
                                },
                              },
                            })
                          }
                          label="Afbeelding"
                        />
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Titel
                          </label>
                          <input
                            type="text"
                            value={link?.title || ""}
                            onChange={(e) =>
                              updatePage({
                                featuredLinks: {
                                  ...page.featuredLinks,
                                  [linkKey]: {
                                    ...link,
                                    title: e.target.value,
                                    image: link?.image || "",
                                    link: link?.link || "",
                                  },
                                },
                              })
                            }
                            className="w-full px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Link
                          </label>
                          <input
                            type="url"
                            value={link?.link || ""}
                            onChange={(e) =>
                              updatePage({
                                featuredLinks: {
                                  ...page.featuredLinks,
                                  [linkKey]: {
                                    ...link,
                                    link: e.target.value,
                                    image: link?.image || "",
                                    title: link?.title || "",
                                  },
                                },
                              })
                            }
                            placeholder="https://..."
                            className="w-full px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-50"
                          />
                        </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Link 3 and 4 side by side */}
                <div className="grid grid-cols-2 gap-4">
                  {[3, 4].map((num) => {
                    const linkKey = `link${num}` as keyof typeof page.featuredLinks;
                    const link = page.featuredLinks[linkKey];
                    return (
                      <div 
                        key={num} 
                        className="border border-zinc-700 rounded-lg p-4"
                      >
                        <h3 className="text-lg font-medium text-zinc-50 mb-4">
                          Featured Link {num}
                        </h3>
                        <div className="space-y-4">
                          <ImageUpload
                            value={link?.image}
                            onChange={(url) =>
                              updatePage({
                                featuredLinks: {
                                  ...page.featuredLinks,
                                  [linkKey]: {
                                    ...link,
                                    image: url,
                                    title: link?.title || "",
                                    link: link?.link || "",
                                  },
                                },
                              })
                            }
                            label="Afbeelding"
                          />
                          <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                              Titel
                            </label>
                            <input
                              type="text"
                              value={link?.title || ""}
                              onChange={(e) =>
                                updatePage({
                                  featuredLinks: {
                                    ...page.featuredLinks,
                                    [linkKey]: {
                                      ...link,
                                      title: e.target.value,
                                      image: link?.image || "",
                                      link: link?.link || "",
                                    },
                                  },
                                })
                              }
                              className="w-full px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-50"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                              Link
                            </label>
                            <input
                              type="url"
                              value={link?.link || ""}
                              onChange={(e) =>
                                updatePage({
                                  featuredLinks: {
                                    ...page.featuredLinks,
                                    [linkKey]: {
                                      ...link,
                                      link: e.target.value,
                                      image: link?.image || "",
                                      title: link?.title || "",
                                    },
                                  },
                                })
                              }
                              placeholder="https://..."
                              className="w-full px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-50"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            )}
          </div>

          {/* Right Column - Sticky Preview (30%) */}
          <div className="xl:sticky xl:top-8 h-fit pr-4">
            {/* Live Preview */}
            <div 
              className="border-4 border-black rounded-2xl overflow-hidden shadow-lg mx-auto"
              style={{ 
                aspectRatio: "9/16",
                width: "100%",
                maxWidth: "400px",
                maxHeight: "65vh",
                height: "auto"
              }}
            >
              <div className="h-full overflow-y-auto" style={{ backgroundColor: page.backgroundColor || ((page.theme || "dark") === "dark" ? "#000" : "#FFF") }}>
                {/* Exact copy of public page structure */}
                {(() => {
                  const theme = page.theme || "dark";
                  const isDark = theme === "dark";
                  const bgColor = page.backgroundColor || (isDark ? "#000" : "#FFF");
                  const textColor = isDark ? "#FFF" : "#000";
                  const hasCustomBackground = !!page.backgroundColor;

                  // Helper function to convert hex to rgba
                  const hexToRgba = (hex: string, alpha: number): string => {
                    if (!hex) return `rgba(0, 0, 0, ${alpha})`;
                    const cleanHex = hex.replace("#", "");
                    const r = parseInt(cleanHex.substring(0, 2), 16);
                    const g = parseInt(cleanHex.substring(2, 4), 16);
                    const b = parseInt(cleanHex.substring(4, 6), 16);
                    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
                  };

                  const socialPlatforms: Record<string, { icon: string; label: string }> = {
                    linkedin: { icon: "fab fa-linkedin-in", label: "LinkedIn" },
                    instagram: { icon: "fab fa-instagram", label: "Instagram" },
                    facebook: { icon: "fab fa-facebook-f", label: "Facebook" },
                    youtube: { icon: "fab fa-youtube", label: "YouTube" },
                    tiktok: { icon: "fab fa-tiktok", label: "TikTok" },
                    soundcloud: { icon: "fab fa-soundcloud", label: "SoundCloud" },
                    spotify: { icon: "fab fa-spotify", label: "Spotify" },
                    website: { icon: "fas fa-globe", label: "Website" },
                  };

                  // Calculate if a color is light or dark to determine text color
                  const getContrastTextColor = (backgroundColor: string): string => {
                    // Default to white if no color provided
                    if (!backgroundColor) return "#FFF";
                    
                    // Remove # if present
                    const hex = backgroundColor.replace("#", "");
                    
                    // Convert to RGB
                    const r = parseInt(hex.substring(0, 2), 16);
                    const g = parseInt(hex.substring(2, 4), 16);
                    const b = parseInt(hex.substring(4, 6), 16);
                    
                    // Calculate relative luminance (perceived brightness)
                    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                    
                    // Return black for light backgrounds, white for dark backgrounds
                    return luminance > 0.5 ? "#000" : "#FFF";
                  };

                  const ctaButtonColor = page.brandColor || "#2E47FF";
                  const ctaTextColor = page.ctaTextColor || getContrastTextColor(ctaButtonColor);

                  return (
                    <div style={{ minHeight: "100%" }}>
                      {/* Header with Background - 16:9 aspect ratio */}
                      {page.header.url && (
                                <div className="relative w-full overflow-hidden aspect-video">
                                  <div className="absolute inset-0" style={{ overflow: "hidden" }}>
                                    {page.header.type === "video" ? (
                                      (() => {
                                        const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
                                        const match = page.header.url.match(youtubeRegex);
                                        
                                        if (match) {
                                          const videoId = match[1];
                                          const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&playsinline=1`;
                                          return (
                                            <div 
                                              style={{ 
                                                position: "absolute",
                                                top: 0,
                                                left: 0,
                                                width: "100%",
                                                height: "100%",
                                                overflow: "hidden",
                                              }}
                                              aria-hidden="true"
                                            >
                                              <iframe
                                                src={embedUrl}
                                                style={{
                                                  position: "absolute",
                                                  top: 0,
                                                  left: 0,
                                                  width: "100%",
                                                  height: "100%",
                                                  border: "none",
                                                  pointerEvents: "none",
                                                }}
                                                allow="autoplay; encrypted-media"
                                                allowFullScreen={false}
                                              />
                                            </div>
                                          );
                                        } else {
                                          return (
                                            <video
                                              src={page.header.url}
                                              autoPlay
                                              loop
                                              muted
                                              playsInline
                                              style={{
                                                position: "absolute",
                                                top: 0,
                                                left: 0,
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                                objectPosition: "center top",
                                                pointerEvents: "none",
                                                minWidth: "100%",
                                                minHeight: "100%",
                                              }}
                                            />
                                          );
                                        }
                                      })()
                                    ) : (
                                      <img
                                        src={page.header.url}
                                        alt="Header"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = "none";
                                        }}
                                      />
                                    )}
                                  </div>
                                  
                                  {/* Overlay */}
                                  <div
                                    className="absolute inset-0"
                                    style={{
                                      background: hasCustomBackground
                                        ? `linear-gradient(to bottom, ${hexToRgba(page.backgroundColor!, 0)} 20%, ${page.backgroundColor} 98%)`
                                        : isDark
                                        ? "linear-gradient(to bottom, rgba(0,0,0,0) 20%, #000 98%)"
                                        : "linear-gradient(to bottom, rgba(255,255,255,0) 20%, #FFF 98%)",
                                      top: 0,
                                      left: 0,
                                      right: 0,
                                      bottom: 0,
                                      width: "100%",
                                      height: "100%",
                                    }}
                                  ></div>
                        </div>
                      )}

                      {/* Main Content */}
                      <div className="max-w-md mx-auto px-4 pt-6" style={{ backgroundColor: bgColor, color: textColor }}>
                        {/* Logo with padding 20px and negative margin-top -100px */}
                        {page.logo && (
                          <div
                            className="flex justify-center"
                            style={{
                              padding: "20px",
                              marginTop: page.header.url ? "-100px" : "0",
                              position: page.header.url ? "relative" : "static",
                              zIndex: 10,
                            }}
                          >
                            <img
                              src={page.logo}
                              alt="Logo"
                              className="h-30 w-auto"
                              style={{ objectFit: "contain" }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          </div>
                        )}

                        {/* Template-specific content */}
                        <TemplateRouter
                          page={page}
                          trackClick={() => {}} // No tracking in preview
                          theme={theme}
                          isDark={isDark}
                          bgColor={bgColor}
                          textColor={textColor}
                          hasCustomBackground={hasCustomBackground}
                          ctaButtonColor={ctaButtonColor}
                          ctaTextColor={ctaTextColor}
                          socialPlatforms={socialPlatforms}
                          convertSpotifyUrlToEmbed={(url: string) => {
                            try {
                              // Remove query parameters and hash from URL
                              const cleanUrl = url.trim().split('?')[0].split('#')[0];
                              const urlObj = new URL(cleanUrl);
                              const pathParts = urlObj.pathname.split("/").filter(Boolean);
                              if (pathParts.length >= 2) {
                                const type = pathParts[0];
                                const id = pathParts[1];
                                // Use minimal embed URL without extra parameters
                                return `https://open.spotify.com/embed/${type}/${id}`;
                              }
                              return url;
                            } catch (e) {
                              console.error("Error converting Spotify URL:", e);
                              return url;
                            }
                          }}
                        />

                        {/* Contact Information & CTA - Evenredig gespaced */}
                        <div className="mb-6 space-y-3">
                          {/* Telefoonnummer - width 100%, border-radius 50px */}
                          {page.telefoonnummer && (
                            <div
                              className="block w-full px-4 py-3 transition-colors text-center"
                              style={{
                                backgroundColor: isDark ? "#3F3F3F" : "#EEEEEE",
                                color: textColor,
                                borderRadius: "50px",
                                fontSize: "16px",
                                fontFamily: "'PT Sans', sans-serif",
                                fontWeight: "bold",
                              }}
                            >
                              {page.telefoonnummer}
                            </div>
                          )}

                          {/* Emailadres - width 100%, border-radius 50px */}
                          {page.emailadres && (
                            <div
                              className="block w-full px-4 py-3 transition-colors text-center"
                              style={{
                                backgroundColor: isDark ? "#3F3F3F" : "#EEEEEE",
                                color: textColor,
                                borderRadius: "50px",
                                fontSize: "16px",
                                fontFamily: "'PT Sans', sans-serif",
                                fontWeight: "bold",
                              }}
                            >
                              {page.emailadres}
                            </div>
                          )}

                          {/* CTA Button - width 100%, border-radius 50px */}
                          {page.ctaButton.text && (
                            <div
                              className="block w-full px-4 py-3 transition-colors text-center"
                              style={{
                                backgroundColor: ctaButtonColor,
                                color: ctaTextColor,
                                borderRadius: "50px",
                                fontSize: "16px",
                                fontFamily: "'PT Sans', sans-serif",
                                fontWeight: "bold",
                              }}
                            >
                              {page.ctaButton.text}
                            </div>
                          )}

                        </div>
                      </div>

                      {/* Custom Links - Direct onder CTA knop */}
                      {page.customLinks && page.customLinks.length > 0 && (
                        <div className="max-w-md mx-auto px-4 mb-6">
                          <h3
                            className="text-xl font-semibold mb-4 text-center"
                            style={{ color: textColor }}
                          >
                            Links
                          </h3>
                          <div className="space-y-3">
                            {page.customLinks
                              .filter((link) => link.enabled !== false && link.text && link.url)
                              .map((link, index) => (
                                <div
                                  key={index}
                                  className="block w-full px-4 py-3 transition-colors flex items-center justify-between"
                                  style={{
                                    backgroundColor: "#00000033",
                                    color: "#FFFFFF",
                                    borderRadius: "50px",
                                    fontSize: "16px",
                                    fontFamily: "'PT Sans', sans-serif",
                                    fontWeight: "bold",
                                  }}
                                >
                                  <span>{link.text}</span>
                                  <i className="fas fa-angle-right"></i>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Promo Banner - Direct onder CTA knop */}
                      {page.promoBanner.enabled && (
                        <div className="max-w-md mx-auto px-4">
                          <div className="relative w-full overflow-hidden" style={{ borderRadius: "10px" }}>
                            {/* Background Image */}
                            <div
                              className="absolute inset-0"
                              style={{
                                borderRadius: "10px",
                                ...(page.promoBanner.backgroundImage
                                  ? {
                                      backgroundImage: `url(${page.promoBanner.backgroundImage})`,
                                      backgroundSize: "cover",
                                      backgroundPosition: "center",
                                    }
                                  : {
                                      background: "linear-gradient(135deg, rgb(6,147,227) 0%, rgb(155,81,224) 100%)",
                                    }),
                              }}
                            />
                            
                            {/* Overlay: wit-transparant links-rechts (licht) of zwart-transparant (donker) */}
                            <div
                              className="absolute inset-0"
                              style={{
                                borderRadius: "10px",
                                background: isDark
                                  ? "linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0) 100%)"
                                  : "linear-gradient(to right, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0) 100%)",
                              }}
                            />
                            
                            {/* Content */}
                            <div className="relative py-6 px-6">
                              <div style={{ maxWidth: "50%" }}>
                                {page.promoBanner.title && (
                                  <h2 
                                    className="text-xl font-bold mb-2"
                                    style={{ color: isDark ? "#FFF" : "#000" }}
                                  >
                                    {page.promoBanner.title}
                                  </h2>
                                )}
                                {page.promoBanner.description && (
                                  <p 
                                    className="mb-3"
                                    style={{ color: isDark ? "#FFF" : "#000", opacity: 0.9, fontSize: "16px" }}
                                  >
                                    {page.promoBanner.description}
                                  </p>
                                )}
                                {page.promoBanner.buttonText && page.promoBanner.buttonLink && (
                                  <div
                                    className="inline-block px-4 py-2 rounded-lg text-sm font-semibold transition-opacity"
                                    style={{
                                      backgroundColor: page.brandColor || "#2E47FF",
                                      color: page.ctaTextColor || getContrastTextColor(page.brandColor || "#2E47FF"),
                                    }}
                                  >
                                    {page.promoBanner.buttonText}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Featured Links / Services */}
                      {Object.values(page.featuredLinks).some((link) => link && link.title && link.link) && (
                        <div className="max-w-md mx-auto px-4 mt-4">
                          <h2
                            className="text-xl font-semibold mb-4 text-center"
                            style={{ color: textColor }}
                          >
                            Uitgelicht
                          </h2>
                          <div className="grid grid-cols-2 gap-3">
                            {Object.values(page.featuredLinks).map((link, index) => {
                              if (!link || !link.title || !link.link) return null;
                              return (
                                <div
                                  key={index}
                                  className="block overflow-hidden transition-colors"
                                  style={{
                                    backgroundColor: isDark ? "#1a1a1a" : "#f0f0f0",
                                    borderRadius: "8px",
                                  }}
                                >
                                  {link.image && (
                                    <div className="aspect-square bg-gray-800 overflow-hidden">
                                      <img
                                        src={link.image}
                                        alt={link.title}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = "none";
                                        }}
                                      />
                                    </div>
                                  )}
                                  <div className="p-3">
                                    <h3
                                      className="text-sm font-medium text-center"
                                      style={{ color: textColor }}
                                    >
                                      {link.title}
                                    </h3>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Socials - Alleen voor Events template, onderaan de pagina */}
                      {page.template === "events" && Object.keys(page.socialMedia).some(
                        (key) => page.socialMedia[key as keyof typeof page.socialMedia]
                      ) && (
                        <div className="max-w-md mx-auto px-4 mt-8 mb-6">
                          <h3
                            className="text-xl font-semibold mb-4 text-center"
                            style={{ color: textColor }}
                          >
                            Socials
                          </h3>
                          <div className="flex flex-wrap gap-3 justify-center">
                            {Object.entries(page.socialMedia)
                              .filter(([_, url]) => url)
                              .map(([platform, url]) => {
                                const platformInfo = socialPlatforms[platform];
                                return (
                                  <div
                                    key={platform}
                                    className="py-3 font-medium transition-colors flex items-center justify-center"
                                    style={{
                                      backgroundColor: hasCustomBackground ? "rgba(0, 0, 0, 0.15)" : (isDark ? "#3F3F3F" : "#EEEEEE"),
                                      color: textColor,
                                      borderRadius: "50px",
                                      flex: "0 1 calc(25% - 9px)",
                                      minWidth: "calc(25% - 9px)",
                                      maxWidth: "calc(25% - 9px)",
                                      fontSize: "16px",
                                      fontFamily: "'PT Sans', sans-serif",
                                    }}
                                    title={platformInfo?.label || platform}
                                  >
                                    <i className={platformInfo?.icon || "fas fa-link"} style={{ fontSize: "20px" }}></i>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}

                      {/* Footer */}
                      <footer
                        className="border-t py-6 mt-8"
                        style={{
                          borderColor: isDark ? "#333" : "#e0e0e0",
                        }}
                      >
                        <div className="max-w-md mx-auto px-4 text-center">
                          <p
                            className="text-xs"
                            style={{ color: isDark ? "#666" : "#999" }}
                          >
                            powered by lynqit
                          </p>
                        </div>
                      </footer>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

