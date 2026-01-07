"use client";

import Link from "next/link";
import type { LynqitPage, EventButton } from "@/lib/lynqit-pages";

interface EventsTemplateProps {
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

// Helper function to check if event is visible
function isEventVisible(event: EventButton): boolean {
  if (!event.enabled) return false;
  
  const now = new Date();
  
  if (event.visibleFrom) {
    const visibleFrom = new Date(event.visibleFrom);
    if (now < visibleFrom) return false;
  }
  
  if (event.visibleUntil) {
    const visibleUntil = new Date(event.visibleUntil);
    if (now > visibleUntil) return false;
  }
  
  // Check if event date has passed (disable after eventDate + 1 day)
  if (event.eventDate) {
    const eventDate = new Date(event.eventDate);
    eventDate.setDate(eventDate.getDate() + 1); // Add 1 day
    if (now > eventDate) return false;
  }
  
  return true;
}

export default function EventsTemplate({
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
}: EventsTemplateProps) {
  // Helper function to format event date for display
  const formatEventDate = (dateString: string) => {
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

  return (
    <>
      {/* Events Buttons - Direct onder logo */}
      {page.events && page.events.length > 0 && (
        <div className="mb-6 space-y-4">
          {page.events
            .filter((event) => isEventVisible(event))
            .map((event, index) => {
              const dateInfo = event.eventDate ? formatEventDate(event.eventDate) : null;
              const eventContent = (
                <div className="flex items-center gap-4 w-full">
                  {/* Date Card */}
                  {dateInfo && (
                    <div 
                      className="flex-shrink-0 rounded-lg flex flex-col items-center justify-center"
                      style={{
                        width: '80px',
                        height: '80px',
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
                  
                  {/* Event Details */}
                  <div className="flex-1 flex flex-col gap-1">
                    <div style={{ fontSize: '16px', color: '#FFFFFF', fontWeight: 'bold', fontFamily: "'PT Sans', sans-serif" }}>
                      {event.text}
                    </div>
                    {event.location && (
                      <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', fontFamily: "'PT Sans', sans-serif" }}>
                        {event.location}
                      </div>
                    )}
                  </div>
                </div>
              );

              const brandColor = page.brandColor || "#2E47FF";
              const buttonTextColor = page.ctaTextColor || "#FFFFFF";
              
              return (
                event.link ? (
                  <Link
                    key={index}
                    href={event.link}
                    onClick={() => trackClick(`event_${index}`, event.link)}
                    className="block w-full p-4 transition-opacity hover:opacity-90"
                    style={{
                      backgroundColor: brandColor,
                      color: buttonTextColor,
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    {eventContent}
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
                    {eventContent}
                  </div>
                )
              );
            })}
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

