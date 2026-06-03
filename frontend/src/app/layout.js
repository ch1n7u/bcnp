import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { AuthProvider } from "../context/AuthContext";

export const metadata = {
  metadataBase: new URL("https://bharatcybernyayportal.online"),
  title: "Bharat Cyber Nyay Portal",
  description:
    "A secure digital platform empowering citizens to report cybercrime incidents, track case progress, and seek timely assistance",
  icons: {
    icon: [
      { url: "/favicon.ico?v=2" },
      { url: "/logo.svg?v=2", type: "image/svg+xml", sizes: "any" }
    ],
    shortcut: "/favicon.ico?v=2",
    apple: "/logo.svg?v=2"
  },
  openGraph: {
    title: "Bharat Cyber Nyay Portal",
    description:
      "A secure digital platform empowering citizens to report cybercrime incidents, track case progress, and seek timely assistance",
    url: "https://bharatcybernyayportal.online",
    siteName: "Bharat Cyber Nyay Portal",
    type: "website",
    images: [
      {
        url: "/opengraph-image.png?v=1",
        width: 1200,
        height: 630,
        alt: "Bharat Cyber Nyay Portal"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Bharat Cyber Nyay Portal",
    description:
      "A secure digital platform empowering citizens to report cybercrime incidents, track case progress, and seek timely assistance",
    images: ["/opengraph-image.png?v=1"]
  }
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" translate="no">
      <head>
        <meta name="google" content="notranslate" />
      </head>
      <body className="min-h-screen overflow-x-hidden">
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 md:py-8 lg:px-8">{children}</main>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
