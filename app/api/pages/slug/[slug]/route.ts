import { NextRequest, NextResponse } from "next/server";
import { getPageBySlug } from "@/lib/lynqit-pages";

// GET - Get a page by slug (public endpoint)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const page = await getPageBySlug(resolvedParams.slug);

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    return NextResponse.json({ page });
  } catch (error) {
    console.error("Error fetching page:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching the page" },
      { status: 500 }
    );
  }
}
