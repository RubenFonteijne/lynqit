"use client";

import { useState, useEffect } from "react";

interface SpotifyEmbedProps {
  url: string;
  convertSpotifyUrlToEmbed: (url: string) => string;
}

export default function SpotifyEmbed({ url, convertSpotifyUrlToEmbed }: SpotifyEmbedProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="mb-4 w-full" style={{ height: "152px", borderRadius: 12, backgroundColor: "#1DB954", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
        Loading...
      </div>
    );
  }

  const embedUrl = convertSpotifyUrlToEmbed(url);

  return (
    <div className="mb-4 w-full">
      <iframe
        style={{ borderRadius: 12, border: "none" }}
        src={embedUrl}
        width="100%"
        height="152"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        title="Spotify Embed"
      />
    </div>
  );
}
