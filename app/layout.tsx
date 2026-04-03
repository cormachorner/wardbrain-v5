import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../components/AuthProvider";

export const metadata: Metadata = {
  title: "WardBrain v5",
  description: "A clinical reasoning coach for medical students",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
