"use client";

import { useState } from "react";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label: string;
  accept?: string;
}

export default function ImageUpload({
  value,
  onChange,
  label,
  accept = "image/*",
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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
      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
        {label}
      </label>
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="file"
            accept={accept}
            onChange={handleFileChange}
            disabled={isUploading}
            className="flex-1 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#2E47FF] file:text-white hover:file:bg-[#1E37E6] disabled:opacity-50"
          />
        </div>
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Of plak een URL hier..."
          className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 text-sm"
        />
        {value && (
          <div className="mt-2">
            <img
              src={value}
              alt="Preview"
              className="max-w-full h-32 object-contain rounded-lg border border-zinc-200 dark:border-zinc-700"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}
        {isUploading && (
          <p className="text-sm text-[#2E47FF] dark:text-[#00F0EE]">Uploaden...</p>
        )}
        {uploadError && (
          <p className="text-sm text-red-600 dark:text-red-400">{uploadError}</p>
        )}
      </div>
    </div>
  );
}

