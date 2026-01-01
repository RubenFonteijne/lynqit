/**
 * Formats a page slug for display: capitalizes first letter and replaces '-' with spaces
 * @param slug - The page slug (e.g., "my-page-name")
 * @returns Formatted title (e.g., "My page name")
 */
export function formatPageTitle(slug: string): string {
  if (!slug) return "";
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

