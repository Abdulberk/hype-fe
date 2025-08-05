import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Registry } from './registry';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Place & Trade Area Data Visualization",
  description: "Interactive visualization of place data, trade areas, and customer analytics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`} suppressHydrationWarning={true}>
        <Registry>
          {children}
        </Registry>
      </body>
    </html>
  );
}
