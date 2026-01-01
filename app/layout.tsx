import type { Metadata } from "next";
import { Inter_Tight } from "next/font/google";
import "./globals.css";
import ConditionalNavbar from "./components/ConditionalNavbar";
import ThemeProvider from "./components/ThemeProvider";

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Lynqit - ONE LINK TO RULE THEM ALL",
  description: "Bundel al je belangrijke links op één professionele pagina in jouw eigen stijl. Eén link voor maximale impact.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedTheme = localStorage.getItem('lynqit_dashboard_theme');
                  const root = document.documentElement;
                  
                  if (savedTheme === 'light') {
                    root.classList.remove('dark');
                    root.classList.add('light');
                  } else if (savedTheme === 'dark') {
                    root.classList.remove('light');
                    root.classList.add('dark');
                  } else {
                    // Auto mode - use system preference
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    if (prefersDark) {
                      root.classList.add('dark');
                    } else {
                      root.classList.add('light');
                    }
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${interTight.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider />
        <ConditionalNavbar />
        {children}
      </body>
    </html>
  );
}
