"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardSidebar from "@/app/components/DashboardSidebar";
import { createClientClient } from "@/lib/supabase-client";
import ConfirmModal from "@/app/components/ConfirmModal";

interface DiscountCode {
  id: string;
  code: string;
  discountType: "first_payment" | "recurring";
  discountValue: number;
  isPercentage: boolean;
  validFrom: string;
  validUntil?: string;
  maxUses?: number;
  usedCount: number;
  active: boolean;
  applicablePlans: ("start" | "pro")[];
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>("");
  const [settings, setSettings] = useState({
    stripeSecretKeyTest: "",
    stripeSecretKeyLive: "",
    stripePublishableKeyTest: "",
    stripePublishableKeyLive: "",
    useTestMode: true,
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Discount codes state
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [discountCodesLoading, setDiscountCodesLoading] = useState(false);
  const [showDiscountCodeForm, setShowDiscountCodeForm] = useState(false);
  const [editingDiscountCode, setEditingDiscountCode] = useState<DiscountCode | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; code: DiscountCode | null }>({ isOpen: false, code: null });
  const [discountCodeForm, setDiscountCodeForm] = useState({
    code: "",
    discountType: "first_payment" as "first_payment" | "recurring",
    discountValue: 0,
    isPercentage: true,
    validFrom: new Date().toISOString().split("T")[0],
    validUntil: "",
    maxUses: "",
    applicablePlans: ["start", "pro"] as ("start" | "pro")[],
    description: "",
    active: true,
  });

  useEffect(() => {
    document.title = "Settings - Lynqit";
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const checkAdmin = async () => {
      try {
        const supabase = createClientClient();
        
        // Get current session from Supabase
        let session = null;
        let error = null;
        
        try {
          const sessionData = await supabase.auth.getSession();
          session = sessionData.data?.session || null;
          error = sessionData.error || null;
        } catch (e) {
          error = e as any;
        }
        
        // Fallback: check localStorage for user data if Supabase session is not available
        let userEmail = null;
        if ((error || !session || !session.user || !session.user.email)) {
          const cachedUser = localStorage.getItem("lynqit_user");
          if (cachedUser) {
            try {
              const user = JSON.parse(cachedUser);
              userEmail = user.email;
            } catch (e) {
              // Invalid cache
              if (!isMounted) return;
              router.push("/");
              return;
            }
          } else {
            // No session and no cached user
            if (!isMounted) return;
            router.push("/");
            return;
          }
        } else {
          userEmail = session.user.email;
        }
        
        if (!isMounted) return;

        // Get user info from API
        const userResponse = await fetch(`/api/user?email=${encodeURIComponent(userEmail)}`);
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
            setUserEmail(userEmail || session?.user?.email || "");
            // Fetch settings
            await fetchSettings();
            // Fetch discount codes
            await fetchDiscountCodes(session.user.email);
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
          stripeSecretKeyTest: settingsData.settings.stripeSecretKeyTest || "",
          stripeSecretKeyLive: settingsData.settings.stripeSecretKeyLive || "",
          stripePublishableKeyTest: settingsData.settings.stripePublishableKeyTest || "",
          stripePublishableKeyLive: settingsData.settings.stripePublishableKeyLive || "",
          useTestMode: settingsData.settings.useTestMode ?? true,
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const fetchDiscountCodes = async (email: string) => {
    setDiscountCodesLoading(true);
    try {
      const response = await fetch(`/api/admin/discount-codes?userId=${encodeURIComponent(email)}`, { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        setDiscountCodes(data.discountCodes || []);
      }
    } catch (error) {
      console.error("Error fetching discount codes:", error);
    } finally {
      setDiscountCodesLoading(false);
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

  const handleSaveDiscountCode = async () => {
    if (!userEmail) return;

    if (!discountCodeForm.code || discountCodeForm.discountValue <= 0) {
      setSaveMessage({ type: "error", text: "Code en kortingswaarde zijn verplicht" });
      setTimeout(() => setSaveMessage(null), 5000);
      return;
    }

    setDiscountCodesLoading(true);
    setSaveMessage(null);

    try {
      const payload: any = {
        userId: userEmail,
        code: discountCodeForm.code,
        discountType: discountCodeForm.discountType,
        discountValue: discountCodeForm.discountValue,
        isPercentage: discountCodeForm.isPercentage,
        validFrom: discountCodeForm.validFrom ? new Date(discountCodeForm.validFrom).toISOString() : undefined,
        validUntil: discountCodeForm.validUntil ? new Date(discountCodeForm.validUntil).toISOString() : undefined,
        maxUses: discountCodeForm.maxUses ? parseInt(discountCodeForm.maxUses) : undefined,
        applicablePlans: discountCodeForm.applicablePlans,
        description: discountCodeForm.description || undefined,
        active: discountCodeForm.active,
      };

      let response;
      if (editingDiscountCode) {
        response = await fetch(`/api/admin/discount-codes/${editingDiscountCode.id}?userId=${encodeURIComponent(userEmail)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch(`/api/admin/discount-codes?userId=${encodeURIComponent(userEmail)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        setSaveMessage({ type: "error", text: data.error || "Fout bij opslaan van kortingscode" });
        setTimeout(() => setSaveMessage(null), 5000);
        return;
      }

      setSaveMessage({ type: "success", text: editingDiscountCode ? "Kortingscode bijgewerkt!" : "Kortingscode aangemaakt!" });
      setTimeout(() => setSaveMessage(null), 3000);

      // Reset form
      setDiscountCodeForm({
        code: "",
        discountType: "first_payment",
        discountValue: 0,
        isPercentage: true,
        validFrom: new Date().toISOString().split("T")[0],
        validUntil: "",
        maxUses: "",
        applicablePlans: ["start", "pro"],
        description: "",
        active: true,
      });
      setShowDiscountCodeForm(false);
      setEditingDiscountCode(null);

      // Refresh discount codes
      await fetchDiscountCodes(userEmail);
    } catch (error) {
      console.error("Error saving discount code:", error);
      setSaveMessage({ type: "error", text: "Er is een fout opgetreden bij het opslaan van de kortingscode" });
      setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      setDiscountCodesLoading(false);
    }
  };

  const handleEditDiscountCode = (code: DiscountCode) => {
    setEditingDiscountCode(code);
    setDiscountCodeForm({
      code: code.code,
      discountType: code.discountType,
      discountValue: code.discountValue,
      isPercentage: code.isPercentage,
      validFrom: new Date(code.validFrom).toISOString().split("T")[0],
      validUntil: code.validUntil ? new Date(code.validUntil).toISOString().split("T")[0] : "",
      maxUses: code.maxUses?.toString() || "",
      applicablePlans: code.applicablePlans,
      description: code.description || "",
      active: code.active,
    });
    setShowDiscountCodeForm(true);
  };

  const handleDeleteDiscountCode = async () => {
    if (!userEmail || !deleteModal.code) return;

    setDiscountCodesLoading(true);
    try {
      const response = await fetch(`/api/admin/discount-codes/${deleteModal.code.id}?userId=${encodeURIComponent(userEmail)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        setSaveMessage({ type: "error", text: data.error || "Fout bij verwijderen van kortingscode" });
        setTimeout(() => setSaveMessage(null), 5000);
        return;
      }

      setSaveMessage({ type: "success", text: "Kortingscode verwijderd!" });
      setTimeout(() => setSaveMessage(null), 3000);
      setDeleteModal({ isOpen: false, code: null });

      // Refresh discount codes
      await fetchDiscountCodes(userEmail);
    } catch (error) {
      console.error("Error deleting discount code:", error);
      setSaveMessage({ type: "error", text: "Er is een fout opgetreden bij het verwijderen van de kortingscode" });
      setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      setDiscountCodesLoading(false);
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
              Beheer Stripe API instellingen
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
              Stripe API Instellingen
            </h2>
            <div className="space-y-4">
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
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Stripe Test Secret Key
                </label>
                <input
                  type="password"
                  value={settings.stripeSecretKeyTest}
                  onChange={(e) => setSettings({ ...settings, stripeSecretKeyTest: e.target.value })}
                  placeholder="sk_test_..."
                  className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" style={{ border: '1px solid rgba(255, 255, 255, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white' }}
                />
                <p className="mt-1 text-xs text-zinc-400">
                  Test secret key voor ontwikkelomgeving
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Stripe Test Publishable Key
                </label>
                <input
                  type="password"
                  value={settings.stripePublishableKeyTest}
                  onChange={(e) => setSettings({ ...settings, stripePublishableKeyTest: e.target.value })}
                  placeholder="pk_test_..."
                  className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" style={{ border: '1px solid rgba(255, 255, 255, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white' }}
                />
                <p className="mt-1 text-xs text-zinc-400">
                  Test publishable key voor ontwikkelomgeving
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Stripe Live Secret Key
                </label>
                <input
                  type="password"
                  value={settings.stripeSecretKeyLive}
                  onChange={(e) => setSettings({ ...settings, stripeSecretKeyLive: e.target.value })}
                  placeholder="sk_live_..."
                  className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" style={{ border: '1px solid rgba(255, 255, 255, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white' }}
                />
                <p className="mt-1 text-xs text-zinc-400">
                  Live secret key voor productieomgeving
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Stripe Live Publishable Key
                </label>
                <input
                  type="password"
                  value={settings.stripePublishableKeyLive}
                  onChange={(e) => setSettings({ ...settings, stripePublishableKeyLive: e.target.value })}
                  placeholder="pk_live_..."
                  className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" style={{ border: '1px solid rgba(255, 255, 255, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white' }}
                />
                <p className="mt-1 text-xs text-zinc-400">
                  Live publishable key voor productieomgeving
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


          {/* Discount Codes Section */}
          <div className="mt-8 rounded-xl p-6" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">
                Kortingscodes
              </h2>
              <button
                onClick={() => {
                  setEditingDiscountCode(null);
                  setDiscountCodeForm({
                    code: "",
                    discountType: "first_payment",
                    discountValue: 0,
                    isPercentage: true,
                    validFrom: new Date().toISOString().split("T")[0],
                    validUntil: "",
                    maxUses: "",
                    applicablePlans: ["start", "pro"],
                    description: "",
                    active: true,
                  });
                  setShowDiscountCodeForm(true);
                }}
                className="px-4 py-2 bg-[#2E47FF] text-white rounded-lg font-medium hover:bg-[#1E37E6] transition-colors"
              >
                Nieuwe kortingscode
              </button>
            </div>

            {showDiscountCodeForm && (
              <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <h3 className="text-lg font-semibold text-white mb-4">
                  {editingDiscountCode ? "Kortingscode bewerken" : "Nieuwe kortingscode"}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Code *</label>
                    <input
                      type="text"
                      value={discountCodeForm.code}
                      onChange={(e) => setDiscountCodeForm({ ...discountCodeForm, code: e.target.value.toUpperCase() })}
                      placeholder="WELCOME10"
                      className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" style={{ border: '1px solid rgba(255, 255, 255, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Kortingstype *</label>
                    <select
                      value={discountCodeForm.discountType}
                      onChange={(e) => setDiscountCodeForm({ ...discountCodeForm, discountType: e.target.value as "first_payment" | "recurring" })}
                      className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" style={{ border: '1px solid rgba(255, 255, 255, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white' }}
                    >
                      <option value="first_payment">Eerste betaling</option>
                      <option value="recurring">Elke maand</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Kortingswaarde *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={discountCodeForm.discountValue}
                      onChange={(e) => setDiscountCodeForm({ ...discountCodeForm, discountValue: parseFloat(e.target.value) || 0 })}
                      placeholder="10"
                      className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" style={{ border: '1px solid rgba(255, 255, 255, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Type</label>
                    <select
                      value={discountCodeForm.isPercentage ? "percentage" : "fixed"}
                      onChange={(e) => setDiscountCodeForm({ ...discountCodeForm, isPercentage: e.target.value === "percentage" })}
                      className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" style={{ border: '1px solid rgba(255, 255, 255, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white' }}
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Vast bedrag (€)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Geldig vanaf</label>
                    <input
                      type="date"
                      value={discountCodeForm.validFrom}
                      onChange={(e) => setDiscountCodeForm({ ...discountCodeForm, validFrom: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" style={{ border: '1px solid rgba(255, 255, 255, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Geldig tot (optioneel)</label>
                    <input
                      type="date"
                      value={discountCodeForm.validUntil}
                      onChange={(e) => setDiscountCodeForm({ ...discountCodeForm, validUntil: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" style={{ border: '1px solid rgba(255, 255, 255, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Maximaal aantal gebruik (optioneel)</label>
                    <input
                      type="number"
                      min="1"
                      value={discountCodeForm.maxUses}
                      onChange={(e) => setDiscountCodeForm({ ...discountCodeForm, maxUses: e.target.value })}
                      placeholder="Onbeperkt"
                      className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" style={{ border: '1px solid rgba(255, 255, 255, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Van toepassing op</label>
                    <div className="flex gap-4 mt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={discountCodeForm.applicablePlans.includes("start")}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setDiscountCodeForm({ ...discountCodeForm, applicablePlans: [...discountCodeForm.applicablePlans, "start"] });
                            } else {
                              setDiscountCodeForm({ ...discountCodeForm, applicablePlans: discountCodeForm.applicablePlans.filter(p => p !== "start") });
                            }
                          }}
                          className="w-4 h-4 text-[#2E47FF] rounded focus:ring-[#2E47FF]"
                        />
                        <span className="text-sm text-zinc-300">Start</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={discountCodeForm.applicablePlans.includes("pro")}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setDiscountCodeForm({ ...discountCodeForm, applicablePlans: [...discountCodeForm.applicablePlans, "pro"] });
                            } else {
                              setDiscountCodeForm({ ...discountCodeForm, applicablePlans: discountCodeForm.applicablePlans.filter(p => p !== "pro") });
                            }
                          }}
                          className="w-4 h-4 text-[#2E47FF] rounded focus:ring-[#2E47FF]"
                        />
                        <span className="text-sm text-zinc-300">Pro</span>
                      </label>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Beschrijving (optioneel)</label>
                    <input
                      type="text"
                      value={discountCodeForm.description}
                      onChange={(e) => setDiscountCodeForm({ ...discountCodeForm, description: e.target.value })}
                      placeholder="Welkomstkorting voor nieuwe klanten"
                      className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" style={{ border: '1px solid rgba(255, 255, 255, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white' }}
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={discountCodeForm.active}
                        onChange={(e) => setDiscountCodeForm({ ...discountCodeForm, active: e.target.checked })}
                        className="w-4 h-4 text-[#2E47FF] rounded focus:ring-[#2E47FF]"
                      />
                      <span className="text-sm font-medium text-zinc-300">Actief</span>
                    </label>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleSaveDiscountCode}
                    disabled={discountCodesLoading}
                    className="px-4 py-2 bg-[#2E47FF] text-white rounded-lg font-medium hover:bg-[#1E37E6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {discountCodesLoading ? "Opslaan..." : "Opslaan"}
                  </button>
                  <button
                    onClick={() => {
                      setShowDiscountCodeForm(false);
                      setEditingDiscountCode(null);
                    }}
                    className="px-4 py-2 bg-zinc-700 text-white rounded-lg font-medium hover:bg-zinc-600 transition-colors"
                  >
                    Annuleren
                  </button>
                </div>
              </div>
            )}

            {discountCodesLoading && discountCodes.length === 0 ? (
              <p className="text-zinc-400 text-center py-8">Laden...</p>
            ) : discountCodes.length === 0 ? (
              <p className="text-zinc-400 text-center py-8">Geen kortingscodes gevonden</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-300">Code</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-300">Type</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-300">Korting</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-300">Plannen</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-300">Gebruikt</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-300">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-300">Acties</th>
                    </tr>
                  </thead>
                  <tbody>
                    {discountCodes.map((code) => (
                      <tr key={code.id} className="border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}>
                        <td className="py-3 px-4 text-sm text-white font-mono">{code.code}</td>
                        <td className="py-3 px-4 text-sm text-zinc-300">
                          {code.discountType === "first_payment" ? "Eerste betaling" : "Elke maand"}
                        </td>
                        <td className="py-3 px-4 text-sm text-zinc-300">
                          {code.isPercentage ? `${code.discountValue}%` : `€${code.discountValue.toFixed(2)}`}
                        </td>
                        <td className="py-3 px-4 text-sm text-zinc-300">
                          {code.applicablePlans.join(", ")}
                        </td>
                        <td className="py-3 px-4 text-sm text-zinc-300">
                          {code.usedCount}{code.maxUses ? ` / ${code.maxUses}` : ""}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <span className={`px-2 py-1 rounded ${code.active ? "bg-green-900/30 text-green-300" : "bg-red-900/30 text-red-300"}`}>
                            {code.active ? "Actief" : "Inactief"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditDiscountCode(code)}
                              className="px-3 py-1 bg-zinc-700 text-white rounded text-sm hover:bg-zinc-600 transition-colors"
                            >
                              Bewerken
                            </button>
                            <button
                              onClick={() => setDeleteModal({ isOpen: true, code })}
                              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                            >
                              Verwijderen
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, code: null })}
        onConfirm={handleDeleteDiscountCode}
        title="Kortingscode verwijderen"
        message={`Weet je zeker dat je de kortingscode "${deleteModal.code?.code}" wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.`}
      />
    </div>
  );
}

