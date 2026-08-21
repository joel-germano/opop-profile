import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Manrope, Gasoek_One } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "./sw-register";
import { GOOGLE_FONTS_HREF } from "@/lib/fonts";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";

const bahnschrift = localFont({
  src: "./fonts/bahnschrift.ttf",
  variable: "--font-bahnschrift",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const gasoekOne = Gasoek_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-gasoek",
  display: "swap",
});

const madeFlorenceSans = localFont({
  src: "./fonts/made-florence-sans.otf",
  variable: "--font-made-florence",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: SITE_NAME,
  },
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "128x128", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: [{ url: "/favicon.png", type: "image/png" }],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: SITE_TITLE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#2A2A2A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${bahnschrift.variable} ${madeFlorenceSans.variable} ${manrope.variable} ${gasoekOne.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col overscroll-none bg-[#2A2A2A] font-sans antialiased"
        suppressHydrationWarning
      >
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={GOOGLE_FONTS_HREF} />
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
