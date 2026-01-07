"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import type { LynqitPage, Product } from "@/lib/lynqit-pages";

interface WebshopTemplateProps {
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

export default function WebshopTemplate({
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
}: WebshopTemplateProps) {
  const enabledProducts = (page.products || []).filter((product) => product.enabled !== false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    }
    if (isRightSwipe) {
      goToPrevious();
    }
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? enabledProducts.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === enabledProducts.length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  useEffect(() => {
    setCurrentIndex(0);
  }, [enabledProducts.length]);

  return (
    <>
      {/* Social Media Links - Direct onder logo */}
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

      {/* Intro Text - Na social media icons */}
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

      {/* Products Carousel - Na intro tekst */}
      {enabledProducts.length > 0 && (
        <div className="mb-6">
          <div 
            className="relative w-full"
            ref={carouselRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Carousel Container */}
            <div className="overflow-hidden w-full">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{
                transform: `translateX(calc(-${currentIndex * 95}% + 5%))`,
              }}
            >
              {enabledProducts.map((product, index) => (
                <div
                  key={index}
                  className="flex-shrink-0"
                  style={{ width: '90%', marginRight: '5%' }}
                >
                    <div
                      className="rounded-xl overflow-hidden w-full"
                      style={{
                        backgroundColor: hasCustomBackground ? 'rgba(0, 0, 0, 0.1)' : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'),
                        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                      }}
                    >
                      {/* Product Image */}
                      {product.image && (
                        <div className="w-full" style={{ height: '200px', overflow: 'hidden' }}>
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      
                      {/* Product Details */}
                      <div className="p-4">
                        <div style={{ fontSize: '18px', color: textColor, fontWeight: 'bold', fontFamily: "'PT Sans', sans-serif", marginBottom: '8px' }}>
                          {product.name}
                        </div>
                        {(product.price || product.discountPrice) && (
                          <div style={{ fontSize: '16px', fontFamily: "'PT Sans', sans-serif", marginBottom: '12px' }}>
                            {product.isFromPrice && (
                              <small style={{ color: textColor, marginRight: '4px' }}>Vanaf </small>
                            )}
                            {product.discountPrice ? (
                              <>
                                <span style={{ textDecoration: 'line-through', color: textColor, opacity: 0.6, marginRight: '8px' }}>
                                  {product.price}
                                </span>
                                <span style={{ color: ctaButtonColor, fontWeight: 'bold' }}>
                                  {product.discountPrice}
                                </span>
                              </>
                            ) : (
                              <span style={{ color: textColor }}>
                                {product.price}
                              </span>
                            )}
                          </div>
                        )}
                        {product.link && (
                          <Link
                            href={product.link}
                            onClick={() => trackClick(`product_${index}`, product.link)}
                            className="block w-full text-center py-2 px-4 rounded-lg transition-opacity hover:opacity-90"
                            style={{
                              backgroundColor: ctaButtonColor,
                              color: ctaTextColor,
                              fontSize: '14px',
                              fontFamily: "'PT Sans', sans-serif",
                              fontWeight: '600',
                            }}
                          >
                            Bekijk product
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination Dots */}
            {enabledProducts.length > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {enabledProducts.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className="w-2 h-2 rounded-full transition-all"
                    style={{
                      backgroundColor: index === currentIndex 
                        ? ctaButtonColor 
                        : (isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)'),
                      width: index === currentIndex ? '8px' : '6px',
                      height: index === currentIndex ? '8px' : '6px',
                    }}
                    aria-label={`Go to product ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
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