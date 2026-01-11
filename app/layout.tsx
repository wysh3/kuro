import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { CartProvider } from "@/contexts/cart-context"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "KURO - Intelligent Canteen Ops",
  description: "High-performance autonomous point-of-sale system powered by AI and crowd intelligence.",

  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
}

export const viewport = {
  themeColor: "#141413",
  userScalable: false,
  width: "device-width",
  initialScale: 1,
}

import { PageTransition } from "@/components/ui/page-transition"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${_geist.className} font-sans antialiased bg-background text-foreground`}>
        <CartProvider>
          <PageTransition>
            {children}
          </PageTransition>
          <Analytics />
        </CartProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/firebase-messaging-sw.js')
                    .then(function(registration) {
                      console.log('[FCM SW] Registered:', registration.scope);
                      return navigator.serviceWorker.register('/sw.js');
                    })
                    .then(function(registration) {
                      console.log('[Cache SW] Registered:', registration.scope);
                    })
                    .catch(function(err) {
                      console.log('[SW] Registration failed:', err);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
