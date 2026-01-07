import { NextRequest, NextResponse } from "next/server";
import { getPageBySlug } from "@/lib/lynqit-pages";

// GET - Check if a slug is available
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json(
        { error: "Slug is required" },
        { status: 400 }
      );
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { available: false, error: "Slug mag alleen kleine letters, cijfers en streepjes bevatten" },
        { status: 200 }
      );
    }

    // Check if slug already exists
    const existingPage = await getPageBySlug(slug);
    
    return NextResponse.json({
      available: !existingPage,
      slug: slug,
    });
  } catch (error) {
    console.error("Error checking slug:", error);
    return NextResponse.json(
      { error: "An error occurred checking slug availability" },
      { status: 500 }
    );
  }
}
