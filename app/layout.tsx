import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { AppProvider } from "./context/appContext";
import { Toaster } from "@/components/ui/toaster";
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
        <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
          <AppProvider>{children}</AppProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
