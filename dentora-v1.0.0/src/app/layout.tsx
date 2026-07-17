import type { Metadata, Viewport } from "next";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Dentora", template: "%s · Dentora" },
  description: "A private, intelligent dental revision question bank.",
  applicationName: "Dentora",
  appleWebApp: { capable: true, title: "Dentora", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#176b68",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="antialiased">
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
