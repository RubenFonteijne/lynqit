"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { LynqitPage } from "@/lib/lynqit-pages";
import { formatPageTitle } from "@/lib/utils";
import TemplateRouter from "@/app/components/templates/TemplateRouter";
import AdminBar from "@/app/components/AdminBar";

export default function PublicLynqitPage() {
  const params = useParams();
  const [page, setPage] = useState<LynqitPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (params.slug) {
      fetchPage();
    }
  }, [params.slug]);

  // Set page title
  useEffect(() => {
    if (page) {
      const pageTitle = page.title || formatPageTitle(page.slug);
      document.title = `${pageTitle} - Lynqit`;
    } else if (!isLoading) {
      document.title = "Page niet gevonden - Lynqit";
    }
  }, [page, isLoading]);

  // Track pageview when page is loaded
  useEffect(() => {
    if (page?.id) {
      const referrer = typeof document !== "undefined" ? document.referrer : undefined;
      const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : undefined;
      
      fetch("/api/analytics/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pageId: page.id,
          referrer: referrer || undefined,
          userAgent: userAgent || undefined,
        }),
      }).catch((error) => {
        console.error("Error tracking pageview:", error);
      });
    }
  }, [page?.id]);

  // Helper function to track clicks
  const trackClick = (clickType: string, targetUrl?: string) => {
    if (!page?.id) return;
    
    const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : undefined;
    
    fetch("/api/analytics/click", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pageId: page.id,
        clickType,
        targetUrl,
        userAgent: userAgent || undefined,
      }),
    }).catch((error) => {
      console.error("Error tracking click:", error);
    });
  };

  const fetchPage = async () => {
    try {
      const response = await fetch(`/api/pages/slug/${params.slug}`);
      if (response.ok) {
        const data = await response.json();
        setPage(data.page);
      }
    } catch (error) {
      console.error("Error fetching page:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while fetching
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "#000", color: "#FFF" }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Laden...</p>
        </div>
      </div>
    );
  }

  // Only show "not found" if we're done loading and page doesn't exist
  if (!page) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "#000", color: "#FFF" }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Page niet gevonden</h1>
          <p className="text-gray-400">Deze Lynqit page bestaat niet.</p>
        </div>
      </div>
    );
  }

  const theme = page.theme || "dark";
  const isDark = theme === "dark";
  const bgColor = page.backgroundColor || (isDark ? "#000" : "#FFF");
  const textColor = isDark ? "#FFF" : "#000";
  const hasCustomBackground = !!page.backgroundColor;

  // Helper function to convert Spotify URL to embed URL
  const convertSpotifyUrlToEmbed = (url: string): string => {
    try {
      // Remove query parameters and hash from URL
      const cleanUrl = url.trim().split('?')[0].split('#')[0];
      
      // Handle different Spotify URL formats
      // https://open.spotify.com/track/4sgGhg9tyb70ob5ENDZKep
      // https://open.spotify.com/album/...
      // https://open.spotify.com/playlist/...
      
      const urlObj = new URL(cleanUrl);
      const pathParts = urlObj.pathname.split("/").filter(Boolean);
      
      if (pathParts.length >= 2) {
        const type = pathParts[0]; // track, album, playlist, etc.
        const id = pathParts[1];
        // Use minimal embed URL without extra parameters that might cause issues
        return `https://open.spotify.com/embed/${type}/${id}`;
      }
      
      return url; // Return original if can't parse
    } catch (e) {
      console.error("Error converting Spotify URL:", e);
      return url; // Return original if error
    }
  };

  // Helper function to convert hex to rgba
  const hexToRgba = (color: string, alpha: number): string => {
    if (!color) return `rgba(0, 0, 0, ${alpha})`;
    
    // If already in rgb() or rgba() format, extract RGB values
    const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1]);
      const g = parseInt(rgbMatch[2]);
      const b = parseInt(rgbMatch[3]);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    // If it's a hex color, convert it
    const cleanHex = color.replace("#", "");
    if (cleanHex.length === 6 || cleanHex.length === 3) {
      const r = cleanHex.length === 6 
        ? parseInt(cleanHex.substring(0, 2), 16)
        : parseInt(cleanHex.substring(0, 1) + cleanHex.substring(0, 1), 16);
      const g = cleanHex.length === 6
        ? parseInt(cleanHex.substring(2, 4), 16)
        : parseInt(cleanHex.substring(1, 2) + cleanHex.substring(1, 2), 16);
      const b = cleanHex.length === 6
        ? parseInt(cleanHex.substring(4, 6), 16)
        : parseInt(cleanHex.substring(2, 3) + cleanHex.substring(2, 3), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    // Fallback
    return `rgba(0, 0, 0, ${alpha})`;
  };

  // Helper function to convert hex to rgb
  const hexToRgb = (color: string): string => {
    if (!color) return "rgb(0, 0, 0)";
    
    // If already in rgb() format, return as is
    if (color.startsWith("rgb(")) {
      return color;
    }
    
    // If it's a hex color, convert it
    const cleanHex = color.replace("#", "");
    if (cleanHex.length === 6 || cleanHex.length === 3) {
      const r = cleanHex.length === 6 
        ? parseInt(cleanHex.substring(0, 2), 16)
        : parseInt(cleanHex.substring(0, 1) + cleanHex.substring(0, 1), 16);
      const g = cleanHex.length === 6
        ? parseInt(cleanHex.substring(2, 4), 16)
        : parseInt(cleanHex.substring(1, 2) + cleanHex.substring(1, 2), 16);
      const b = cleanHex.length === 6
        ? parseInt(cleanHex.substring(4, 6), 16)
        : parseInt(cleanHex.substring(2, 3) + cleanHex.substring(2, 3), 16);
      return `rgb(${r}, ${g}, ${b})`;
    }
    
    // Fallback
    return "rgb(0, 0, 0)";
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
    <div className="min-h-screen" style={{ backgroundColor: bgColor, color: textColor, overflowX: "hidden" }}>
      {/* Admin Bar - Only visible for admin users */}
      <AdminBar />
      
      {/* Header with Background - 16:9 aspect ratio */}
      {page.header.url && (
        <div className="relative w-full overflow-hidden aspect-video max-h-[600px]">
          <div className="absolute inset-0" style={{ overflow: "hidden" }}>
            {page.header.type === "video" ? (
              (() => {
                // Check if it's a YouTube URL
                const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
                const match = page.header.url.match(youtubeRegex);
                
                if (match) {
                  // It's a YouTube video - use iframe embed with cover effect
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
                  // Regular video file - use as background with cover
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
          
          {/* Overlay: background color gradient from 20% to 98% */}
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
      <div className="max-w-md mx-auto px-4 pt-6">
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
          trackClick={trackClick}
          theme={theme}
          isDark={isDark}
          bgColor={bgColor}
          textColor={textColor}
          hasCustomBackground={hasCustomBackground}
          ctaButtonColor={ctaButtonColor}
          ctaTextColor={ctaTextColor}
          socialPlatforms={socialPlatforms}
          convertSpotifyUrlToEmbed={convertSpotifyUrlToEmbed}
        />

        {/* Contact Information & CTA - Evenredig gespaced */}
        <div className="mb-6 space-y-3">
          {/* Telefoonnummer - width 100%, border-radius 50px */}
          {page.telefoonnummer && (
            <a
              href={`tel:${page.telefoonnummer}`}
              onClick={() => trackClick("phone", `tel:${page.telefoonnummer}`)}
              className="block w-full px-4 py-3 transition-colors text-center"
              style={{
                backgroundColor: isDark ? "#3F3F3F" : "#EEEEEE",
                color: textColor,
                borderRadius: "50px",
                fontSize: "16px",
                fontFamily: "'PT Sans', sans-serif",
                fontWeight: "bold",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDark ? "#4F4F4F" : "#DDDDDD";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isDark ? "#3F3F3F" : "#EEEEEE";
              }}
            >
              {page.telefoonnummer}
            </a>
          )}

          {/* Emailadres - width 100%, border-radius 50px */}
          {page.emailadres && (
            <a
              href={`mailto:${page.emailadres}`}
              onClick={() => trackClick("email", `mailto:${page.emailadres}`)}
              className="block w-full px-4 py-3 transition-colors text-center"
              style={{
                backgroundColor: isDark ? "#3F3F3F" : "#EEEEEE",
                color: textColor,
                borderRadius: "50px",
                fontSize: "16px",
                fontFamily: "'PT Sans', sans-serif",
                fontWeight: "bold",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDark ? "#4F4F4F" : "#DDDDDD";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isDark ? "#3F3F3F" : "#EEEEEE";
              }}
            >
              {page.emailadres}
            </a>
          )}

          {/* CTA Button - width 100%, border-radius 50px */}
          {page.ctaButton.text && (
            <Link
              href={page.ctaButton.link}
              onClick={() => trackClick(`cta_${page.ctaButton.text}`, page.ctaButton.link)}
              className="block w-full px-4 py-3 transition-colors text-center hover:opacity-90"
              style={{
                backgroundColor: ctaButtonColor,
                color: ctaTextColor,
                borderRadius: "50px",
                fontSize: "16px",
                fontFamily: "'PT Sans', sans-serif",
                fontWeight: "bold",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.9";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              {page.ctaButton.text}
            </Link>
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
                <Link
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackClick(`custom_link_${index}`, link.url)}
                  className="block w-full px-4 py-3 transition-colors flex items-center justify-between"
                  style={{
                    backgroundColor: hasCustomBackground ? (isDark ? "rgba(0, 0, 0, 0.15)" : "rgba(0, 0, 0, 0.05)") : (isDark ? "#3F3F3F" : "#EEEEEE"),
                    color: textColor,
                    borderRadius: "50px",
                    fontSize: "16px",
                    fontFamily: "'PT Sans', sans-serif",
                    fontWeight: "bold",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = hasCustomBackground ? (isDark ? "rgba(0, 0, 0, 0.25)" : "rgba(0, 0, 0, 0.15)") : (isDark ? "#4F4F4F" : "#DDDDDD");
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = hasCustomBackground ? (isDark ? "rgba(0, 0, 0, 0.15)" : "rgba(0, 0, 0, 0.05)") : (isDark ? "#3F3F3F" : "#EEEEEE");
                  }}
                >
                  <span>{link.text}</span>
                  <i className="fas fa-angle-right"></i>
                </Link>
              ))}
          </div>
        </div>
      )}

      {/* Promo Banner - Direct onder CTA knop */}
      {page.promoBanner.enabled && (
        <div className="max-w-md mx-auto px-4">
          <div className="relative w-full overflow-hidden" style={{ borderRadius: "10px" }}>
          {/* Background Image or Gradient */}
          <div
            className="absolute inset-0"
            style={{
              borderRadius: "10px",
              ...(page.promoBanner.backgroundImage && page.promoBanner.backgroundImage.trim()
                ? {
                    backgroundImage: `url(${page.promoBanner.backgroundImage})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : {
                    background: `linear-gradient(135deg, ${hexToRgb(bgColor)} 0%, rgb(155,81,224) 100%)`,
                  }),
            }}
          />
          
          {/* Overlay: achtergrondkleur-transparant links-rechts */}
          <div
            className="absolute inset-0"
            style={{
              borderRadius: "10px",
              background: `linear-gradient(to right, ${hexToRgba(bgColor, 1)} 0%, ${hexToRgba(bgColor, 0)} 100%)`,
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
                <Link
                  href={page.promoBanner.buttonLink}
                  onClick={() => trackClick(`promo_banner_${page.promoBanner.buttonText}`, page.promoBanner.buttonLink)}
                  className="inline-block px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
                  style={{
                    backgroundColor: page.brandColor || "#2E47FF",
                    color: page.ctaTextColor || getContrastTextColor(page.brandColor || "#2E47FF"),
                  }}
                >
                  {page.promoBanner.buttonText}
                </Link>
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
                  <Link
                    key={index}
                    href={link.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackClick(`featured_${index + 1}`, link.link)}
                    className="block overflow-hidden transition-colors"
                    style={{
                      backgroundColor: isDark ? "#1a1a1a" : "#f0f0f0",
                      borderRadius: "8px",
                      border: isDark ? "1px solid rgba(255, 255, 255, 0.05)" : "1px solid rgba(0, 0, 0, 0.15)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = isDark ? "#2a2a2a" : "#e0e0e0";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = isDark ? "#1a1a1a" : "#f0f0f0";
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
                  </Link>
                );
              })}
            </div>
          </div>
        )}

      {/* Shows - Alleen voor Artist template, na uitgelichte links */}
      {page.template === "artist" && page.shows && page.shows.length > 0 && (
        <div className="max-w-md mx-auto px-4 mt-4 mb-6">
          <h2
            className="text-xl font-semibold mb-4 text-center"
            style={{ color: textColor }}
          >
            Shows
          </h2>
          <div className="space-y-4">
            {page.shows
              .filter((show) => show.enabled !== false)
              .map((show, index) => {
                // Helper function to format show date for display
                const formatShowDate = (dateString: string) => {
                  try {
                    const date = new Date(dateString);
                    const day = date.getDate();
                    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
                    const month = monthNames[date.getMonth()];
                    const year = date.getFullYear();
                    return { day, month, year };
                  } catch (e) {
                    return null;
                  }
                };

                const dateInfo = show.date ? formatShowDate(show.date) : null;
                const showContent = (
                  <div className="flex items-center gap-4 w-full">
                    {/* Date Card */}
                    {dateInfo && (
                      <div 
                        className="flex-shrink-0 rounded-lg border flex flex-col items-center justify-center"
                        style={{
                          width: '80px',
                          height: '80px',
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                          backgroundColor: hasCustomBackground ? 'rgba(0, 0, 0, 0.2)' : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'),
                        }}
                      >
                        <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase', marginTop: '8px' }}>
                          {dateInfo.month}
                        </div>
                        <div style={{ fontSize: '32px', color: '#FFFFFF', fontWeight: 'bold', lineHeight: '1' }}>
                          {dateInfo.day}
                        </div>
                        <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '8px' }}>
                          {dateInfo.year}
                        </div>
                      </div>
                    )}
                    
                    {/* Show Details */}
                    <div className="flex-1 flex flex-col gap-1">
                      <div style={{ fontSize: '16px', color: '#FFFFFF', fontWeight: 'bold', fontFamily: "'PT Sans', sans-serif" }}>
                        {show.show}
                      </div>
                      {show.location && (
                        <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', fontFamily: "'PT Sans', sans-serif" }}>
                          {show.location}
                        </div>
                      )}
                    </div>
                  </div>
                );

                const brandColor = page.brandColor || "#2E47FF";
                const buttonTextColor = page.ctaTextColor || "#FFFFFF";
                
                return (
                  show.link ? (
                    <Link
                      key={index}
                      href={show.link}
                      onClick={() => trackClick(`show_${index}`, show.link)}
                      className="block w-full p-4 transition-opacity hover:opacity-90"
                      style={{
                        backgroundColor: brandColor,
                        color: buttonTextColor,
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      {showContent}
                    </Link>
                  ) : (
                    <div
                      key={index}
                      className="block w-full p-4"
                      style={{
                        backgroundColor: brandColor,
                        color: buttonTextColor,
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      {showContent}
                    </div>
                  )
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
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackClick(`social_${platform}`, url)}
                    className="py-3 font-medium transition-colors flex items-center justify-center"
                    style={{
                      backgroundColor: hasCustomBackground ? (isDark ? "rgba(0, 0, 0, 0.15)" : "rgba(0, 0, 0, 0.05)") : (isDark ? "#3F3F3F" : "#EEEEEE"),
                      color: textColor,
                      borderRadius: "50px",
                      flex: "0 1 calc(25% - 9px)",
                      minWidth: "calc(25% - 9px)",
                      maxWidth: "calc(25% - 9px)",
                      fontSize: "16px",
                      fontFamily: "'PT Sans', sans-serif",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = hasCustomBackground ? (isDark ? "rgba(0, 0, 0, 0.25)" : "rgba(0, 0, 0, 0.15)") : (isDark ? "#4F4F4F" : "#DDDDDD");
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = hasCustomBackground ? (isDark ? "rgba(0, 0, 0, 0.15)" : "rgba(0, 0, 0, 0.05)") : (isDark ? "#3F3F3F" : "#EEEEEE");
                    }}
                    title={platformInfo?.label || platform}
                  >
                    <i className={platformInfo?.icon || "fas fa-link"} style={{ fontSize: "20px" }}></i>
                  </a>
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
}
