import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AeroOps — Flight Operations Dashboard",
  description:
    "AI-powered flight operations and incident intelligence for airline and airport operations teams.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
