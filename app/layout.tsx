import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { AppProvider } from "./context/appContext";
import { Toaster } from "@/components/ui/toaster";
import Script from "next/script";
const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const lotaGrotesque = localFont({
  src: "./fonts/Los-Andes-Lota-Grotesque-Regular.otf",
  variable: "--font-lota-grotesque",
  weight: "400",
});

export const metadata: Metadata = {
  title: "Proganize",
  description: "Organize smarter, Document faster",
  metadataBase: new URL("https://proganize.app"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body className={`${lotaGrotesque.variable} antialiased`}>
        <Script
          async
          defer
          src='https://cloud.umami.is/script.js'
          data-website-id='2fd5a43f-e6b3-478d-8e76-d26042f05d11'
        />
        <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
          <AppProvider>{children}</AppProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
