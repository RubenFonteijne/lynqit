"use client";

import { useState, useMemo } from "react";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label: string;
  accept?: string;
}

// Extract /uploads/[filename] from Supabase Storage URL
function extractUploadPath(url: string | undefined): string {
  if (!url) return "";
  
  // If it's already a relative path starting with /uploads/, return it
  if (url.startsWith("/uploads/")) {
    return url;
  }
  
  // If it's a Supabase Storage URL, extract the /uploads/ part
  const supabaseStorageMatch = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(uploads\/[^?]+)/);
  if (supabaseStorageMatch) {
    return `/${supabaseStorageMatch[1]}`;
  }
  
  // Otherwise return the full URL (for external URLs)
  return url;
}

// Reconstruct full URL from relative path or keep external URL
function reconstructFullUrl(path: string, originalUrl?: string): string {
  // If it's already a full URL (starts with http:// or https://), return it
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  
  // If it's a relative path starting with /uploads/, try to reconstruct Supabase URL
  if (path.startsWith("/uploads/")) {
    // If we have the original URL and it was a Supabase URL, reconstruct it
    if (originalUrl && originalUrl.includes("/storage/v1/object/public/")) {
      // Extract the base URL and bucket name from the original URL
      const urlMatch = originalUrl.match(/^(https?:\/\/[^/]+)\/storage\/v1\/object\/public\/([^/]+)\//);
      if (urlMatch) {
        const supabaseBaseUrl = urlMatch[1];
        const bucketName = urlMatch[2];
        const fileName = path.replace("/uploads/", "");
        return `${supabaseBaseUrl}/storage/v1/object/public/${bucketName}/uploads/${fileName}`;
      }
    }
    // If we can't reconstruct and original was a Supabase URL, keep the original
    // This handles the case where user just edits the filename part
    if (originalUrl && originalUrl.includes("/storage/v1/object/public/")) {
      // Extract filename from new path and replace in original URL
      const fileName = path.replace("/uploads/", "");
      const originalMatch = originalUrl.match(/^(.*\/uploads\/)([^?]+)(.*)$/);
      if (originalMatch) {
        return `${originalMatch[1]}${fileName}${originalMatch[3]}`;
      }
    }
    // If we can't reconstruct, return the relative path
    return path;
  }
  
  // Return as-is for other cases
  return path;
}

export default function ImageUpload({
  value,
  onChange,
  label,
  accept = "image/*",
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Display value: show only /uploads/[filename] part
  const displayValue = useMemo(() => extractUploadPath(value), [value]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const data = await response.json();
      onChange(data.url);
    } catch (error: any) {
      setUploadError(error.message || "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-zinc-300 mb-2">
        {label}
      </label>
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="file"
            accept={accept}
            onChange={handleFileChange}
            disabled={isUploading}
            className="flex-1 px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-50 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#2E47FF] file:text-white hover:file:bg-[#1E37E6] disabled:opacity-50"
          />
        </div>
        <input
          type="text"
          value={displayValue}
          onChange={(e) => {
            const newValue = e.target.value;
            // Reconstruct full URL if needed, otherwise use the entered value
            const fullUrl = reconstructFullUrl(newValue, value);
            onChange(fullUrl);
          }}
          placeholder="Of plak een URL hier..."
          className="w-full px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-50 text-sm"
        />
        {value && (
          <div className="mt-2">
            <img
              src={value}
              alt="Preview"
              className="max-w-full h-32 object-contain rounded-lg border border-zinc-700"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}
        {isUploading && (
          <p className="text-sm text-[#00F0EE]">Uploaden...</p>
        )}
        {uploadError && (
          <p className="text-sm text-red-400">{uploadError}</p>
        )}
      </div>
    </div>
  );
}

