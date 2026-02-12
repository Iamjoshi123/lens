import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "LENS – Intelligence-to-Brief Engine",
  description:
    "Transform winning ads into production-ready creative briefs. A spatial workbench for ad intelligence.",
  keywords: ["ad research", "creative brief", "UGC", "ad intelligence", "marketing"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
