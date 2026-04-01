import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SBUDate — Dating for Stony Brook",
  description: "A dating app exclusively for Stony Brook University students. Designed to be deleted.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
