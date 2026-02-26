import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lista della Spesa",
  description: "App famigliare per lista della spesa condivisa",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
