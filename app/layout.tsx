import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Minimal Web Scraper",
  description: "Fetch and inspect key metadata from any web page.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
