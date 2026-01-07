"use client";

import Link from "next/link";
import type { LynqitPage } from "@/lib/lynqit-pages";

interface DefaultTemplateProps {
  page: LynqitPage;
  trackClick: (clickType: string, targetUrl?: string) => void;
  theme: "dark" | "light";
  isDark: boolean;
  bgColor: string;
  textColor: string;
  hasCustomBackground: boolean;
  ctaButtonColor: string;
  ctaTextColor: string;
  socialPlatforms: Record<string, { icon: string; label: string }>;
}

export default function DefaultTemplate({
  page,
  trackClick,
  theme,
  isDark,
  bgColor,
  textColor,
  hasCustomBackground,
  ctaButtonColor,
  ctaTextColor,
  socialPlatforms,
}: DefaultTemplateProps) {
  return (
    <>
      {/* Social Media Links */}
      {Object.keys(page.socialMedia).some(
        (key) => page.socialMedia[key as keyof typeof page.socialMedia]
      ) && (
        <div style={{ marginBottom: "24px" }}>
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

      {/* Intro Text */}
      {page.intro && (
        <div style={{ marginBottom: "24px" }}>
          <p
            className="leading-relaxed whitespace-pre-line text-center"
            style={{
              color: textColor,
              fontSize: "16px",
              fontFamily: "'PT Sans', sans-serif",
            }}
          >
            {page.intro}
          </p>
        </div>
      )}

      {/* Custom Links */}
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
                  className="block w-full px-4 py-3 transition-colors hover:opacity-90 flex items-center justify-between"
                  style={{
                    backgroundColor: "#00000033",
                    color: "#FFFFFF",
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
                  <span>{link.text}</span>
                  <i className="fas fa-angle-right"></i>
                </Link>
              ))}
          </div>
        </div>
      )}
    </>
  );
}

