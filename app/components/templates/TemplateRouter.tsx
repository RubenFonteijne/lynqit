"use client";

import type { LynqitPage } from "@/lib/lynqit-pages";
import DefaultTemplate from "./DefaultTemplate";
import EventsTemplate from "./EventsTemplate";
import ArtistTemplate from "./ArtistTemplate";
import WebshopTemplate from "./WebshopTemplate";

interface TemplateRouterProps {
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
  convertSpotifyUrlToEmbed?: (url: string) => string;
}

export default function TemplateRouter(props: TemplateRouterProps) {
  const template = props.page.template || "default";

  switch (template) {
    case "mobile_app":
      // Mobile App uses the Default layout, but has different "contact" rendering
      // (handled in the page + live preview wrapper)
      return <DefaultTemplate {...props} />;
    case "events":
      return <EventsTemplate {...props} />;
    case "artist":
      return <ArtistTemplate {...props} convertSpotifyUrlToEmbed={props.convertSpotifyUrlToEmbed!} />;
    case "webshop":
      return <WebshopTemplate {...props} />;
    case "default":
    default:
      return <DefaultTemplate {...props} />;
  }
}

