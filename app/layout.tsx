import DeployButton from "@/components/deploy-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import HeaderAuth from "@/components/header-auth";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Link from "next/link";
import Image from "next/image";
import "./globals.css";
import Script from "next/script";

const defaultUrl = 'https://sher-sable.vercel.app'

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Quad",
  description: "The intersection of teachers and schools",
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <head>
        {/* Google tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-XYGMYVJ43M"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-XYGMYVJ43M');
          `}
        </Script>
      </head>
      <body className="bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main className="min-h-screen flex flex-col">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
              <div className="max-w-7xl mx-auto flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4">
                <Link 
                  href="/" 
                  className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity duration-200 shrink-0"
                >
                  <Image
                    src="/quad_logo.png"
                    alt="Quad"
                    width={32}
                    height={32}
                    className="sm:w-10 sm:h-10 rounded-xl"
                  />
                  <span className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    Quad
                  </span>
                </Link>
                
                <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                  {!hasEnvVars ? <EnvVarWarning /> : <HeaderAuth />}
                  <ThemeSwitcher />
                </div>
              </div>
            </nav>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
              <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
                {children}
              </div>

              {/* Footer */}
              <footer className="w-full border-t border-border/40 bg-card/50 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                  <div className="flex flex-col items-center gap-4 sm:gap-6 text-center">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Image
                        src="/quad_logo.png"
                        alt="Quad"
                        width={20}
                        height={20}
                        className="sm:w-6 sm:h-6 rounded-lg opacity-80"
                      />
                      <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                        Powered by Bharti Airtel Foundation
                      </span>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-xs text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <Link href="/privacy" className="hover:text-foreground transition-colors">
                          Privacy
                        </Link>
                        <span className="hidden sm:block w-1 h-1 bg-muted-foreground rounded-full"></span>
                        <Link href="#" className="hover:text-foreground transition-colors">
                          Terms
                        </Link>
                      </div>
                      <span className="hidden sm:block w-1 h-1 bg-muted-foreground rounded-full"></span>
                      <span>© 2024 Quad Team</span>
                    </div>
                  </div>
                </div>
              </footer>
            </div>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
