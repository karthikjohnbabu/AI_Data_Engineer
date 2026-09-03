import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Newton · The AI Data Engineer",
  description:
    "Newton · The AI Data Engineer — automates ETL/ELT from Jira, Teams, and Slack through triage, coding, DEV/PROD validation, and sector skill learning",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <DashboardLayout>{children}</DashboardLayout>
      </body>
    </html>
  );
}
