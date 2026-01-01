import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/users";
import { getPagesByUser } from "@/lib/lynqit-pages";
import { SUBSCRIPTION_PRICES, calculatePriceWithBTW } from "@/lib/pricing";

interface CompanyDetails {
  companyName?: string;
  firstName?: string;
  lastName?: string;
  vatNumber?: string;
  phoneNumber?: string;
  email: string;
}

// Simple PDF generation using text-based approach
// In production, you might want to use a library like pdfkit or puppeteer
function generateInvoicePDF(
  companyDetails: CompanyDetails,
  paidPages: Array<{
    slug: string;
    plan: "start" | "pro";
    priceExBTW: number;
    priceInclBTW: number;
  }>,
  totalExBTW: number,
  totalBTW: number,
  totalInclBTW: number
): string {
  const now = new Date();
  const invoiceDate = now.toLocaleDateString("nl-NL");
  const invoiceNumber = `INV-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;

  // Create HTML for PDF
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      color: #333;
    }
    .header {
      margin-bottom: 40px;
    }
    .company-info {
      margin-bottom: 20px;
    }
    .invoice-info {
      text-align: right;
      margin-bottom: 40px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #f5f5f5;
      font-weight: bold;
    }
    .total-row {
      font-weight: bold;
      background-color: #f9f9f9;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #333;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-info">
      <h1>Lynqit</h1>
      <p>Factuur</p>
    </div>
    <div class="invoice-info">
      <p><strong>Factuurnummer:</strong> ${invoiceNumber}</p>
      <p><strong>Factuurdatum:</strong> ${invoiceDate}</p>
      <p><strong>Klant:</strong> ${companyDetails.companyName || `${companyDetails.firstName || ""} ${companyDetails.lastName || ""}`.trim() || companyDetails.email}</p>
      ${companyDetails.vatNumber ? `<p><strong>BTW nummer:</strong> ${companyDetails.vatNumber}</p>` : ""}
      ${companyDetails.phoneNumber ? `<p><strong>Telefoon:</strong> ${companyDetails.phoneNumber}</p>` : ""}
      <p><strong>E-mail:</strong> ${companyDetails.email}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Omschrijving</th>
        <th>Plan</th>
        <th style="text-align: right;">Prijs (ex. BTW)</th>
        <th style="text-align: right;">BTW (21%)</th>
        <th style="text-align: right;">Prijs (incl. BTW)</th>
      </tr>
    </thead>
    <tbody>
      ${paidPages
        .map(
          (page) => `
      <tr>
        <td>Lynqit pagina: ${page.slug}</td>
        <td>${page.plan === "start" ? "Start" : "Pro"}</td>
        <td style="text-align: right;">€${page.priceExBTW.toFixed(2)}</td>
        <td style="text-align: right;">€${(page.priceExBTW * 0.21).toFixed(2)}</td>
        <td style="text-align: right;">€${page.priceInclBTW.toFixed(2)}</td>
      </tr>
      `
        )
        .join("")}
      <tr class="total-row">
        <td colspan="2"><strong>Totaal</strong></td>
        <td style="text-align: right;"><strong>€${totalExBTW.toFixed(2)}</strong></td>
        <td style="text-align: right;"><strong>€${totalBTW.toFixed(2)}</strong></td>
        <td style="text-align: right;"><strong>€${totalInclBTW.toFixed(2)}</strong></td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    <p><strong>Lynqit</strong></p>
    <p>BTW-nummer: [BTW-nummer]</p>
    <p>KvK-nummer: [KvK-nummer]</p>
    <p>Bankrekening: [Bankrekening]</p>
    <p style="margin-top: 20px;">
      Deze factuur is automatisch gegenereerd. Voor vragen kunt u contact opnemen via [contact email].
    </p>
  </div>
</body>
</html>
  `;

  return html;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is verplicht" },
        { status: 400 }
      );
    }

    const user = getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Prepare company details
    const companyDetails: CompanyDetails = {
      companyName: user.companyName,
      firstName: user.firstName,
      lastName: user.lastName,
      vatNumber: user.vatNumber,
      phoneNumber: user.phoneNumber,
      email: user.email,
    };

    // Get all pages for this user
    const allPages = getPagesByUser(email);

    // Filter paid pages
    const paidPages = allPages
      .filter(
        (page) =>
          page.subscriptionPlan &&
          page.subscriptionPlan !== "free" &&
          page.subscriptionStatus === "active"
      )
      .map((page) => {
        const plan = page.subscriptionPlan!;
        const priceExBTW =
          plan === "start"
            ? SUBSCRIPTION_PRICES.start
            : SUBSCRIPTION_PRICES.pro;
        const priceInclBTW = calculatePriceWithBTW(priceExBTW);

        return {
          slug: page.slug,
          plan: plan as "start" | "pro",
          priceExBTW,
          priceInclBTW,
        };
      });

    if (paidPages.length === 0) {
      return NextResponse.json(
        { error: "Geen betaalde abonnementen gevonden" },
        { status: 400 }
      );
    }

    // Calculate totals
    const totalExBTW = paidPages.reduce(
      (sum, page) => sum + page.priceExBTW,
      0
    );
    const totalBTW = totalExBTW * 0.21;
    const totalInclBTW = calculatePriceWithBTW(totalExBTW);

    // Generate HTML invoice
    const html = generateInvoicePDF(
      companyDetails,
      paidPages,
      totalExBTW,
      totalBTW,
      totalInclBTW
    );

    // Return HTML (in production, you might want to convert this to PDF using a library)
    // For now, we'll return HTML that can be printed/saved as PDF by the browser
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `attachment; filename="factuur-lynqit-${new Date().toISOString().split("T")[0]}.html"`,
      },
    });
  } catch (error: any) {
    console.error("Invoice generation error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred generating invoice" },
      { status: 500 }
    );
  }
}

